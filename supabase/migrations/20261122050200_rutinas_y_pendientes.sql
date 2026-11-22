-- =============================================================================
-- Diarco · Rutina y pendientes
--
-- rutinas            tareas que se repiten sin hora y SIN racha (tender la cama,
--                    lavar los platos). No cuentan para rachas, logros ni el 70 %.
-- rutina_registros   qué día se hizo cada tarea de la rutina.
-- pendientes         cosas de una sola vez, con o sin fecha (y hora opcional):
--                    "pagar la luz", "cita con el dentista el viernes 10:00".
--                    Si se pasan de fecha sin hacerse, la app los muestra atrasados.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- rutinas
-- -----------------------------------------------------------------------------
create table public.rutinas (
  id           bigint generated always as identity primary key,
  usuario_id   uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  nombre       text not null check (char_length(nombre) between 1 and 60),
  icono        text not null default '🧹' check (char_length(icono) between 1 and 16),
  dias_semana  smallint[] not null default array[0, 1, 2, 3, 4, 5, 6]::smallint[]
                 check (public.son_dias_semana_validos(dias_semana)),
  activo       boolean not null default true,
  creado_en    timestamptz not null default now(),
  unique (id, usuario_id)             -- destino de la FK compuesta de rutina_registros
);

comment on table public.rutinas is
  'Tareas que se repiten sin hora ni racha. No cuentan para rachas ni logros.';

-- -----------------------------------------------------------------------------
-- rutina_registros: una fila por tarea y fecha hecha (desmarcar la borra).
-- usuario_id duplicado a propósito, como en habito_registros: la FK compuesta
-- obliga a que coincida con el dueño de la rutina.
-- -----------------------------------------------------------------------------
create table public.rutina_registros (
  id          bigint generated always as identity primary key,
  rutina_id   bigint not null,
  usuario_id  uuid not null default auth.uid(),
  fecha       date not null,
  creado_en   timestamptz not null default now(),
  unique (rutina_id, fecha),
  foreign key (rutina_id, usuario_id)
    references public.rutinas (id, usuario_id) on delete cascade
);

-- -----------------------------------------------------------------------------
-- pendientes
-- -----------------------------------------------------------------------------
create table public.pendientes (
  id          bigint generated always as identity primary key,
  usuario_id  uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  titulo      text not null check (char_length(titulo) between 1 and 120),
  fecha       date,                   -- null = "algún día"
  hora        time,                   -- solo con fecha
  nota        text check (char_length(nota) <= 280),
  hecho_en    date,                   -- null = pendiente
  creado_en   timestamptz not null default now(),
  check (hora is null or fecha is not null)
);

comment on table public.pendientes is
  'Tareas o eventos de una sola vez, con fecha opcional. hecho_en marca cuándo se hizo.';

-- -----------------------------------------------------------------------------
-- Índices
-- -----------------------------------------------------------------------------
create index rutinas_usuario_idx            on public.rutinas (usuario_id) where activo;
create index rutina_registros_usuario_fecha on public.rutina_registros (usuario_id, fecha);
create index pendientes_abiertos_idx        on public.pendientes (usuario_id, fecha) where hecho_en is null;
create index pendientes_hechos_idx          on public.pendientes (usuario_id, hecho_en) where hecho_en is not null;

-- -----------------------------------------------------------------------------
-- Permisos y RLS: cada usuario solo ve y edita sus filas.
-- Primero se quitan los privilegios por defecto del esquema (anon no accede a nada).
-- -----------------------------------------------------------------------------
revoke all on public.rutinas, public.rutina_registros, public.pendientes from anon, authenticated;

grant select, insert, update, delete on public.rutinas          to authenticated;
grant select, insert, update, delete on public.rutina_registros to authenticated;
grant select, insert, update, delete on public.pendientes       to authenticated;

alter table public.rutinas          enable row level security;
alter table public.rutina_registros enable row level security;
alter table public.pendientes       enable row level security;

do $$
declare
  tabla text;
begin
  foreach tabla in array array['rutinas', 'rutina_registros', 'pendientes']
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated
         using ((select auth.uid()) = usuario_id)',
      tabla || ': ver propios', tabla);

    execute format(
      'create policy %I on public.%I for insert to authenticated
         with check ((select auth.uid()) = usuario_id)',
      tabla || ': crear propios', tabla);

    execute format(
      'create policy %I on public.%I for update to authenticated
         using ((select auth.uid()) = usuario_id)
         with check ((select auth.uid()) = usuario_id)',
      tabla || ': editar propios', tabla);

    execute format(
      'create policy %I on public.%I for delete to authenticated
         using ((select auth.uid()) = usuario_id)',
      tabla || ': borrar propios', tabla);
  end loop;
end;
$$;
