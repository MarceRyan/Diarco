-- =============================================================================
-- Huella · Esquema base
-- Tablas, restricciones e índices. La seguridad (RLS, permisos) está en la
-- siguiente migración y las funciones de rachas en la tercera.
--
-- Convenciones:
--   * Claves primarias bigint identity (una sola base de datos, inserciones ordenadas).
--   * usuario_id tiene default auth.uid(): los clientes no necesitan enviarlo.
--   * Las FK compuestas (id, usuario_id) garantizan que un usuario solo pueda
--     referenciar sus propios hábitos y categorías, incluso sin pasar por RLS.
--   * dias_semana: 0 = domingo … 6 = sábado (igual que Date.getDay() en JS).
-- =============================================================================

-- Esquema privado: funciones internas que no deben exponerse por la API.
create schema if not exists privado;
revoke all on schema privado from public;

-- -----------------------------------------------------------------------------
-- Funciones auxiliares de validación (inmutables, seguras de usar en CHECK)
-- -----------------------------------------------------------------------------

-- true si el arreglo contiene días válidos (0..6), sin repetir y al menos uno.
create function public.son_dias_semana_validos(dias smallint[])
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select cardinality(dias) between 1 and 7
     and dias <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
     and cardinality(dias) = (select count(distinct d) from unnest(dias) as d);
$$;

comment on function public.son_dias_semana_validos(smallint[]) is
  'Valida arreglos de días de la semana: valores 0 (domingo) a 6 (sábado), sin duplicados, al menos uno.';

-- true si el texto es una zona horaria IANA conocida por PostgreSQL.
create function public.es_zona_horaria_valida(zona text)
returns boolean
language sql
stable
parallel safe
set search_path = ''
as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = zona);
$$;

comment on function public.es_zona_horaria_valida(text) is
  'Valida que la zona horaria exista (ej. America/Lima).';

-- -----------------------------------------------------------------------------
-- perfiles: 1 a 1 con auth.users. Se crea automáticamente al registrarse.
-- -----------------------------------------------------------------------------
create table public.perfiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  nombre                text not null default '' check (char_length(nombre) <= 80),
  zona_horaria          text not null default 'America/Lima'
                          check (public.es_zona_horaria_valida(zona_horaria)),
  protectores_semana    smallint not null default 1
                          check (protectores_semana between 0 and 7),
  creado_en             timestamptz not null default now()
);

comment on table public.perfiles is 'Datos de cada usuario. id = auth.users.id.';
comment on column public.perfiles.zona_horaria is 'Todas las fechas del usuario se calculan en esta zona, nunca en UTC del servidor.';
comment on column public.perfiles.protectores_semana is 'Días por semana que un hábito puede faltar sin romper la racha (protector de racha).';

-- -----------------------------------------------------------------------------
-- categorias: agrupan actividades y bloques del horario.
-- -----------------------------------------------------------------------------
create table public.categorias (
  id          bigint generated always as identity primary key,
  usuario_id  uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  nombre      text not null check (char_length(nombre) between 1 and 40),
  color       text not null default '#6741d9' check (color ~ '^#[0-9a-fA-F]{6}$'),
  creado_en   timestamptz not null default now(),
  unique (id, usuario_id),            -- destino de las FK compuestas
  unique (usuario_id, nombre)
);

-- -----------------------------------------------------------------------------
-- habitos
-- -----------------------------------------------------------------------------
create table public.habitos (
  id           bigint generated always as identity primary key,
  usuario_id   uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  nombre       text not null check (char_length(nombre) between 1 and 60),
  icono        text not null default '✓' check (char_length(icono) between 1 and 16),
  color        text not null default '#ff6a2b' check (color ~ '^#[0-9a-fA-F]{6}$'),
  dias_semana  smallint[] not null default array[0, 1, 2, 3, 4, 5, 6]::smallint[]
                 check (public.son_dias_semana_validos(dias_semana)),
  meta         text check (char_length(meta) <= 120),
  activo       boolean not null default true,
  creado_en    timestamptz not null default now(),
  unique (id, usuario_id)             -- destino de la FK compuesta de habito_registros
);

comment on column public.habitos.dias_semana is 'Días programados: 0 = domingo … 6 = sábado.';
comment on column public.habitos.meta is 'Objetivo descriptivo del hábito (ej. "Leer 20 páginas").';

-- -----------------------------------------------------------------------------
-- habito_registros: un registro por hábito y fecha.
-- usuario_id está duplicado a propósito: simplifica y acelera RLS, y la FK
-- compuesta obliga a que coincida con el dueño del hábito.
-- -----------------------------------------------------------------------------
create table public.habito_registros (
  id           bigint generated always as identity primary key,
  habito_id    bigint not null,
  usuario_id   uuid not null default auth.uid(),
  fecha        date not null,
  completado   boolean not null default true,
  nota         text check (char_length(nota) <= 280),
  creado_en    timestamptz not null default now(),
  unique (habito_id, fecha),
  foreign key (habito_id, usuario_id)
    references public.habitos (id, usuario_id) on delete cascade
);

-- -----------------------------------------------------------------------------
-- actividades: bitácora de lo que hice en el día.
-- -----------------------------------------------------------------------------
create table public.actividades (
  id            bigint generated always as identity primary key,
  usuario_id    uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  fecha         date not null,
  hora          time,
  descripcion   text not null check (char_length(descripcion) between 1 and 500),
  categoria_id  bigint,
  minutos       integer check (minutos between 1 and 1440),
  creado_en     timestamptz not null default now(),
  -- Al borrar la categoría solo se limpia categoria_id (no usuario_id).
  foreign key (categoria_id, usuario_id)
    references public.categorias (id, usuario_id) on delete set null (categoria_id)
);

-- -----------------------------------------------------------------------------
-- bloques_horario: horario semanal recurrente.
-- -----------------------------------------------------------------------------
create table public.bloques_horario (
  id            bigint generated always as identity primary key,
  usuario_id    uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  dias_semana   smallint[] not null check (public.son_dias_semana_validos(dias_semana)),
  inicio        time not null,
  fin           time not null,
  titulo        text not null check (char_length(titulo) between 1 and 80),
  categoria_id  bigint,
  creado_en     timestamptz not null default now(),
  check (fin > inicio),
  foreign key (categoria_id, usuario_id)
    references public.categorias (id, usuario_id) on delete set null (categoria_id)
);

-- -----------------------------------------------------------------------------
-- estados_animo: un registro por usuario y día.
-- -----------------------------------------------------------------------------
create table public.estados_animo (
  usuario_id  uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  fecha       date not null,
  nivel       smallint not null check (nivel between 1 and 5),
  nota        text check (char_length(nota) <= 280),
  primary key (usuario_id, fecha)
);

-- -----------------------------------------------------------------------------
-- logros (catálogo global) y usuario_logros (los obtenidos por cada usuario).
-- -----------------------------------------------------------------------------
create table public.logros (
  id           bigint generated always as identity primary key,
  codigo       text not null unique check (codigo ~ '^[a-z0-9_]+$'),
  nombre       text not null,
  descripcion  text not null
);

create table public.usuario_logros (
  usuario_id   uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  logro_id     bigint not null references public.logros (id) on delete cascade,
  obtenido_en  timestamptz not null default now(),
  primary key (usuario_id, logro_id)
);

-- -----------------------------------------------------------------------------
-- Índices: columnas usadas por RLS, FK y consultas por fecha.
-- (Las PK y UNIQUE ya crean sus propios índices.)
-- -----------------------------------------------------------------------------
create index habitos_usuario_idx            on public.habitos (usuario_id) where activo;
create index habito_registros_usuario_fecha on public.habito_registros (usuario_id, fecha);
create index actividades_usuario_fecha_idx  on public.actividades (usuario_id, fecha);
create index actividades_categoria_idx      on public.actividades (categoria_id) where categoria_id is not null;
create index bloques_horario_usuario_idx    on public.bloques_horario (usuario_id);
create index bloques_horario_categoria_idx  on public.bloques_horario (categoria_id) where categoria_id is not null;
create index usuario_logros_logro_idx       on public.usuario_logros (logro_id);

-- -----------------------------------------------------------------------------
-- Alta automática del perfil al registrarse un usuario.
-- SECURITY DEFINER es necesario porque el trigger corre sobre auth.users;
-- vive en el esquema privado y nadie más puede ejecutarla.
-- -----------------------------------------------------------------------------
create function privado.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (
    new.id,
    -- El nombre solo se usa para mostrar; nunca para autorizar.
    left(coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1), ''), 80)
  );
  return new;
end;
$$;

revoke execute on function privado.crear_perfil_nuevo_usuario() from public;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function privado.crear_perfil_nuevo_usuario();
