-- =============================================================================
-- Diarco · Seguridad
-- 1. Permisos de tabla (GRANT): desde 2026 Supabase ya no expone tablas nuevas
--    a la Data API automáticamente; hay que concederlas explícitamente.
-- 2. RLS: cada usuario solo lee y escribe sus filas.
--    Patrón: TO authenticated + (select auth.uid()) = usuario_id
--    (el select hace que auth.uid() se evalúe una vez por consulta, no por fila).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Permisos: anon no accede a nada; authenticated accede según RLS.
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

grant select, update                 on public.perfiles         to authenticated;
grant select, insert, update, delete on public.categorias       to authenticated;
grant select, insert, update, delete on public.habitos          to authenticated;
grant select, insert, update, delete on public.habito_registros to authenticated;
grant select, insert, update, delete on public.actividades      to authenticated;
grant select, insert, update, delete on public.bloques_horario  to authenticated;
grant select, insert, update, delete on public.estados_animo    to authenticated;
grant select                         on public.logros           to authenticated;
grant select, insert                 on public.usuario_logros   to authenticated;

-- El usuario no puede cambiar su propio id ni la fecha de creación del perfil.
revoke update on public.perfiles from authenticated;
grant update (nombre, zona_horaria, protectores_semana) on public.perfiles to authenticated;

-- Las funciones de validación las usan los CHECK, que se evalúan con el rol del usuario.
revoke execute on function public.son_dias_semana_validos(smallint[]) from public, anon;
revoke execute on function public.es_zona_horaria_valida(text)       from public, anon;
grant  execute on function public.son_dias_semana_validos(smallint[]) to authenticated;
grant  execute on function public.es_zona_horaria_valida(text)       to authenticated;

-- -----------------------------------------------------------------------------
-- Activar RLS en todas las tablas
-- -----------------------------------------------------------------------------
alter table public.perfiles         enable row level security;
alter table public.categorias       enable row level security;
alter table public.habitos          enable row level security;
alter table public.habito_registros enable row level security;
alter table public.actividades      enable row level security;
alter table public.bloques_horario  enable row level security;
alter table public.estados_animo    enable row level security;
alter table public.logros           enable row level security;
alter table public.usuario_logros   enable row level security;

-- -----------------------------------------------------------------------------
-- perfiles: leer y editar el propio. Se crea por trigger y se borra en cascada
-- desde auth.users, así que no hay políticas de insert ni delete.
-- -----------------------------------------------------------------------------
create policy "perfiles: ver el propio" on public.perfiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "perfiles: editar el propio" on public.perfiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- -----------------------------------------------------------------------------
-- Tablas con usuario_id: CRUD completo sobre las filas propias.
-- -----------------------------------------------------------------------------
do $$
declare
  tabla text;
begin
  foreach tabla in array array[
    'categorias', 'habitos', 'habito_registros',
    'actividades', 'bloques_horario', 'estados_animo'
  ]
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

-- -----------------------------------------------------------------------------
-- logros: catálogo de solo lectura para cualquier usuario autenticado.
-- -----------------------------------------------------------------------------
create policy "logros: ver catalogo" on public.logros
  for select to authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- usuario_logros: ver y registrar los propios (la lógica de cuándo se obtiene
-- un logro vive en @diarco/shared). No se pueden editar ni borrar.
-- -----------------------------------------------------------------------------
create policy "usuario_logros: ver propios" on public.usuario_logros
  for select to authenticated
  using ((select auth.uid()) = usuario_id);

create policy "usuario_logros: registrar propios" on public.usuario_logros
  for insert to authenticated
  with check ((select auth.uid()) = usuario_id);
