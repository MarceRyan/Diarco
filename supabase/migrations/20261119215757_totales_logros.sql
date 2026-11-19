-- =============================================================================
-- Diarco · Totales para logros
-- Conteos de toda la historia del usuario en una sola llamada. Solo cuenta:
-- las reglas (qué meta da cada logro) viven en packages/shared/src/logic/logros.ts.
-- SECURITY INVOKER: respeta RLS, así que cada usuario solo cuenta lo suyo.
-- =============================================================================
create function public.totales_logros()
returns table (
  completados           integer,
  dias_activos          integer,
  actividades           integer,
  minutos_registrados   integer,
  actividades_madrugada integer,
  actividades_noche     integer,
  animo_registros       integer,
  habitos_creados       integer,
  habitos_activos       integer,
  categorias            integer,
  bloques               integer,
  minutos_planificados  integer,
  notas                 integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    (select count(*) from public.habito_registros r where r.completado)::integer,
    (select count(distinct r.fecha) from public.habito_registros r where r.completado)::integer,
    (select count(*) from public.actividades)::integer,
    (select coalesce(sum(a.minutos), 0) from public.actividades a)::integer,
    (select count(*) from public.actividades a where a.hora < time '07:00')::integer,
    (select count(*) from public.actividades a where a.hora >= time '22:00')::integer,
    (select count(*) from public.estados_animo)::integer,
    (select count(*) from public.habitos)::integer,
    (select count(*) from public.habitos h where h.activo)::integer,
    (select count(*) from public.categorias)::integer,
    (select count(*) from public.bloques_horario)::integer,
    (select coalesce(sum(
       (extract(epoch from (b.fin - b.inicio)) / 60)::integer * cardinality(b.dias_semana)
     ), 0) from public.bloques_horario b)::integer,
    (select count(*) from public.habito_registros r where r.completado and r.nota is not null)::integer;
$$;

comment on function public.totales_logros() is
  'Conteos de la historia del usuario autenticado para evaluar logros.';

revoke execute on function public.totales_logros() from public, anon;
grant execute on function public.totales_logros() to authenticated;
