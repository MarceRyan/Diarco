// Verifica migraciones, seed, RLS y restricciones de Huella sobre PGlite
// (PostgreSQL 17 en WebAssembly), sin necesidad de Docker.
// Simula lo mínimo de Supabase: roles anon/authenticated, auth.users y auth.uid().
// Uso: pnpm db:verificar
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dirSupabase = process.argv[2];
const db = new PGlite({ extensions: { pgcrypto } });

let fallos = 0;
const ok = (m) => console.log("  ✔", m);
const mal = (m) => { fallos++; console.log("  ✘", m); };

// --- Simulación mínima de Supabase -----------------------------------------
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create schema extensions;
  create extension pgcrypto schema extensions;
  create table auth.users (
    instance_id uuid, id uuid primary key, aud text, role text, email text,
    encrypted_password text, email_confirmed_at timestamptz,
    raw_app_meta_data jsonb, raw_user_meta_data jsonb,
    created_at timestamptz, updated_at timestamptz,
    confirmation_token text, recovery_token text,
    email_change_token_new text, email_change text
  );
  create table auth.identities (
    id uuid primary key, user_id uuid references auth.users on delete cascade,
    provider_id text, provider text, identity_data jsonb,
    last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz
  );
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth, public, extensions to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  -- Igual que Supabase: privilegios por defecto amplios en public.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`);

// --- Migraciones y seed ------------------------------------------------------
console.log("Migraciones:");
const dirMig = join(dirSupabase, "migrations");
for (const f of readdirSync(dirMig).filter((f) => f.endsWith(".sql")).sort()) {
  try { await db.exec(readFileSync(join(dirMig, f), "utf8")); ok(f); }
  catch (e) { mal(`${f}: ${e.message}`); process.exit(1); }
}
console.log("Seed:");
try { await db.exec(readFileSync(join(dirSupabase, "seed.sql"), "utf8")); ok("seed.sql"); }
catch (e) { mal(`seed.sql: ${e.message}`); process.exit(1); }

// --- Utilidades --------------------------------------------------------------
const DEMO = "d3b07384-d9a0-4c9e-8f1a-000000000001";
const OTRO = "aaaaaaaa-0000-4000-8000-000000000002";

async function comoUsuario(uid, fn) {
  await db.exec("begin");
  try {
    if (uid) {
      await db.query("select set_config('request.jwt.claim.sub', $1, true)", [uid]);
      await db.exec("set local role authenticated");
    } else {
      await db.exec("set local role anon");
    }
    return await fn();
  } finally {
    await db.exec("rollback");
  }
}
const uno = async (sql, p) => (await db.query(sql, p)).rows[0];
async function debeFallar(desc, uid, sql, p, patron) {
  try {
    await comoUsuario(uid, () => db.query(sql, p));
    mal(`${desc} (no falló)`);
  } catch (e) {
    if (patron && !patron.test(e.message)) mal(`${desc} (error inesperado: ${e.message})`);
    else ok(`${desc} → ${e.message.split("\n")[0]}`);
  }
}

// Segundo usuario: el trigger debe crearle el perfil.
await db.query(
  `insert into auth.users (id, email, raw_user_meta_data) values ($1, 'otro@huella.local', '{}')`,
  [OTRO],
);

// --- Datos del seed ------------------------------------------------------------
console.log("Seed y trigger:");
const perfiles = await uno("select count(*)::int n, string_agg(nombre, ',' order by nombre) nombres from public.perfiles");
perfiles.n === 2 && perfiles.nombres === "Demo,otro" ? ok(`perfiles creados por trigger: ${perfiles.nombres}`) : mal(`perfiles: ${JSON.stringify(perfiles)}`);
const conteos = await uno(`select
  (select count(*) from public.habitos)::int habitos,
  (select count(*) from public.habito_registros)::int registros,
  (select count(*) from public.actividades)::int actividades,
  (select count(*) from public.bloques_horario)::int bloques,
  (select count(*) from public.estados_animo)::int animo,
  (select count(*) from public.logros)::int logros,
  (select count(*) from public.usuario_logros)::int usuario_logros`);
ok(`conteos: ${JSON.stringify(conteos)}`);

// --- RLS: lo que ve cada usuario ---------------------------------------------
console.log("RLS:");
await comoUsuario(DEMO, async () => {
  const r = await uno("select (select count(*) from public.habitos)::int h, (select count(*) from public.perfiles)::int p, (select count(*) from public.logros)::int l");
  r.h === 5 && r.p === 1 && r.l === 9 ? ok(`demo ve sus 5 hábitos, solo su perfil y el catálogo de 9 logros`) : mal(`demo ve ${JSON.stringify(r)}`);
});
await comoUsuario(OTRO, async () => {
  const r = await uno(`select (select count(*) from public.habitos)::int h,
    (select count(*) from public.habito_registros)::int r,
    (select count(*) from public.actividades)::int a,
    (select count(*) from public.perfiles)::int p`);
  r.h === 0 && r.r === 0 && r.a === 0 && r.p === 1 ? ok("otro usuario no ve datos del demo") : mal(`otro ve ${JSON.stringify(r)}`);
  const upd = await db.query("update public.habitos set nombre = 'hackeado'");
  upd.affectedRows === 0 ? ok("otro usuario no puede editar hábitos del demo (0 filas)") : mal("otro editó hábitos del demo");
  const del = await db.query("delete from public.actividades");
  del.affectedRows === 0 ? ok("otro usuario no puede borrar actividades del demo (0 filas)") : mal("otro borró actividades del demo");
  const ins = await uno("insert into public.habitos (nombre) values ('Correr') returning usuario_id");
  ins.usuario_id === OTRO ? ok("insertar sin usuario_id usa auth.uid() por defecto") : mal("default auth.uid() no funcionó");
});

const habitoDemo = (await uno(`select id from public.habitos where usuario_id = $1 order by id limit 1`, [DEMO])).id;
const catDemo = (await uno(`select id from public.categorias where usuario_id = $1 order by id limit 1`, [DEMO])).id;
await debeFallar("otro no puede crear filas a nombre del demo", OTRO,
  `insert into public.habitos (usuario_id, nombre) values ($1, 'x')`, [DEMO], /row-level security/);
await debeFallar("otro no puede registrar un hábito del demo (FK compuesta)", OTRO,
  `insert into public.habito_registros (habito_id, fecha) values ($1, current_date + 365)`, [habitoDemo], /foreign key/);
await debeFallar("otro no puede usar una categoría del demo (FK compuesta)", OTRO,
  `insert into public.actividades (fecha, descripcion, categoria_id) values (current_date, 'x', $1)`, [catDemo], /foreign key/);
await debeFallar("demo no puede reasignar su hábito a otro usuario", DEMO,
  `update public.habitos set usuario_id = $1 where id = $2`, [OTRO, habitoDemo], /row-level security|foreign key/);
await debeFallar("no se puede cambiar el id del perfil", DEMO,
  `update public.perfiles set id = $1`, [OTRO], /permission denied/);
await debeFallar("usuario normal no puede crear logros", DEMO,
  `insert into public.logros (codigo, nombre, descripcion) values ('trampa', 'x', 'x')`, [], /permission denied/);
await debeFallar("anon no puede leer hábitos", null, `select * from public.habitos`, [], /permission denied/);
await debeFallar("anon no puede llamar resumen_diario", null, `select * from public.resumen_diario(current_date - 7, current_date)`, [], /permission denied/);

// --- Restricciones -------------------------------------------------------------
console.log("Restricciones:");
await debeFallar("día de semana 7 inválido", DEMO, `insert into public.habitos (nombre, dias_semana) values ('x', '{7}')`, [], /check/);
await debeFallar("días repetidos inválidos", DEMO, `insert into public.habitos (nombre, dias_semana) values ('x', '{1,1}')`, [], /check/);
await debeFallar("días vacíos inválidos", DEMO, `insert into public.habitos (nombre, dias_semana) values ('x', '{}')`, [], /check/);
await debeFallar("zona horaria inexistente", DEMO, `update public.perfiles set zona_horaria = 'Marte/Base'`, [], /check/);
await debeFallar("bloque con fin <= inicio", DEMO,
  `insert into public.bloques_horario (dias_semana, inicio, fin, titulo) values ('{1}', '10:00', '09:00', 'x')`, [], /check/);
await debeFallar("registro duplicado del mismo día", DEMO,
  `insert into public.habito_registros (habito_id, fecha) values ($1, (select max(fecha) from public.habito_registros where habito_id = $1))`, [habitoDemo], /duplicate key/);
await debeFallar("ánimo fuera de 1..5", DEMO, `insert into public.estados_animo (fecha, nivel) values (current_date + 100, 6)`, [], /check/);
await debeFallar("color con formato inválido", DEMO, `insert into public.categorias (nombre, color) values ('x', 'rojo')`, [], /check/);
await comoUsuario(DEMO, async () => {
  const r = await uno("update public.perfiles set zona_horaria = 'Europe/Madrid', protectores_semana = 2 returning zona_horaria");
  r?.zona_horaria === "Europe/Madrid" ? ok("demo puede editar su zona horaria y protectores") : mal("no pudo editar perfil");
});
await comoUsuario(DEMO, async () => {
  await db.query("delete from public.categorias where id = $1", [catDemo]);
  const r = await uno("select count(*)::int n, count(categoria_id)::int con_cat, count(usuario_id)::int con_usuario from public.actividades where descripcion like 'Revisión%'");
  r.n > 0 && r.con_cat === 0 && r.con_usuario === r.n
    ? ok("borrar categoría deja categoria_id en null sin tocar usuario_id")
    : mal(`borrado de categoría: ${JSON.stringify(r)}`);
});

// --- Funciones de rachas -------------------------------------------------------
console.log("Funciones:");
await comoUsuario(DEMO, async () => {
  const hoy = (await uno("select public.fecha_hoy()::text as hoy")).hoy;
  const lima = (await uno("select ((now() at time zone 'America/Lima')::date)::text as d")).d;
  hoy === lima ? ok(`fecha_hoy() en America/Lima: ${hoy}`) : mal(`fecha_hoy ${hoy} vs ${lima}`);

  const agua = (await db.query(`select c.fecha::text, c.completado from public.cumplimiento_habitos(public.fecha_hoy() - 25, public.fecha_hoy()) c
      join public.habitos h on h.id = c.habito_id where h.nombre = 'Beber agua' order by c.fecha desc`)).rows;
  let racha = 0; for (const d of agua) { if (!d.completado) break; racha++; }
  racha === 20 ? ok(`Beber agua: 20 días seguidos completados (incluye hoy)`) : mal(`racha agua calculada ${racha}`);

  const leer = (await db.query(`select extract(dow from c.fecha)::int dow from public.cumplimiento_habitos(public.fecha_hoy() - 13, public.fecha_hoy()) c
      join public.habitos h on h.id = c.habito_id where h.nombre = 'Leer'`)).rows;
  leer.every((d) => d.dow >= 1 && d.dow <= 5) && leer.length === 10
    ? ok("Leer: solo aparecen días programados (lun–vie), 10 en 2 semanas")
    : mal(`Leer días: ${JSON.stringify(leer)}`);

  const meditar = await uno(`select min(c.fecha) - (public.fecha_hoy() - 15) as dif from public.cumplimiento_habitos(public.fecha_hoy() - 30, public.fecha_hoy()) c
      join public.habitos h on h.id = c.habito_id where h.nombre = 'Meditar'`);
  meditar.dif >= 0 ? ok("Meditar: no aparecen días anteriores a su creación") : mal(`meditar dif ${meditar.dif}`);

  const guitarra = await uno(`select count(*)::int n from public.cumplimiento_habitos(public.fecha_hoy() - 30, public.fecha_hoy()) c
      join public.habitos h on h.id = c.habito_id where not h.activo`);
  guitarra.n === 0 ? ok("hábitos inactivos no aparecen") : mal("aparecen inactivos");

  const resumen = (await db.query("select fecha::text, programados, completados, porcentaje::float from public.resumen_diario(public.fecha_hoy() - 6, public.fecha_hoy())")).rows;
  resumen.length === 7 ? ok("resumen_diario devuelve los 7 días del rango:") : mal(`resumen ${resumen.length} filas`);
  console.table(resumen);
});
await debeFallar("rango invertido rechazado", DEMO, "select * from public.resumen_diario(current_date, current_date - 1)", [], /Rango de fechas/);
await debeFallar("rango mayor a 2 años rechazado", DEMO, "select * from public.cumplimiento_habitos(current_date - 1000, current_date)", [], /máximo/);

console.log(fallos === 0 ? "\nTODO OK" : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
