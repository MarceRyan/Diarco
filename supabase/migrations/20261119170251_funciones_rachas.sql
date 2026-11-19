-- =============================================================================
-- Diarco · Funciones de datos para rachas y estadísticas
--
-- La base de datos NO calcula rachas: esa regla (protector, "hoy aún no
-- cuenta", umbral del 70 %) vive en @diarco/shared para tener una sola fuente
-- de verdad con pruebas. Aquí solo se preparan los datos que esa lógica usa.
--
-- Son funciones (no vistas) porque reciben un rango de fechas: así no se
-- genera todo el historial en cada consulta.
--
-- Todas son SECURITY INVOKER: corren con el rol de quien llama y respetan RLS.
-- Se llaman desde el cliente con supabase.rpc('nombre_funcion', { ... }).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- fecha_hoy(): fecha actual en la zona horaria del usuario (no en UTC).
-- -----------------------------------------------------------------------------
create function public.fecha_hoy()
returns date
language sql
stable
security invoker
set search_path = ''
as $$
  select (now() at time zone coalesce(
    (select p.zona_horaria from public.perfiles p where p.id = (select auth.uid())),
    'America/Lima'
  ))::date;
$$;

comment on function public.fecha_hoy() is
  'Fecha de hoy en la zona horaria del usuario autenticado.';

-- -----------------------------------------------------------------------------
-- cumplimiento_habitos(desde, hasta): una fila por cada día PROGRAMADO de cada
-- hábito activo, indicando si se completó. Los días no programados no aparecen
-- (así no rompen la racha). Tampoco aparecen días anteriores a la creación del
-- hábito.
-- -----------------------------------------------------------------------------
create function public.cumplimiento_habitos(p_desde date, p_hasta date)
returns table (
  habito_id   bigint,
  fecha       date,
  completado  boolean
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if p_desde is null or p_hasta is null or p_hasta < p_desde then
    raise exception 'Rango de fechas inválido: % a %', p_desde, p_hasta
      using errcode = '22023';
  end if;

  if p_hasta - p_desde > 731 then
    raise exception 'El rango máximo es de 2 años'
      using errcode = '22023';
  end if;

  return query
  select
    h.id,
    dia.fecha,
    coalesce(r.completado, false)
  from public.habitos h
  join public.perfiles p on p.id = h.usuario_id
  cross join lateral (
    select g::date as fecha
    from generate_series(
      greatest(p_desde, (h.creado_en at time zone p.zona_horaria)::date),
      p_hasta,
      interval '1 day'
    ) as g
  ) as dia
  left join public.habito_registros r
    on r.habito_id = h.id
   and r.fecha = dia.fecha
  where h.activo
    and extract(dow from dia.fecha)::smallint = any (h.dias_semana)
  order by h.id, dia.fecha;
end;
$$;

comment on function public.cumplimiento_habitos(date, date) is
  'Días programados de cada hábito activo del usuario en el rango, con su estado de cumplimiento.';

-- -----------------------------------------------------------------------------
-- resumen_diario(desde, hasta): por cada día del rango, cuántos hábitos estaban
-- programados y cuántos se cumplieron. Base de la racha general y estadísticas.
-- Los días sin hábitos programados devuelven programados = 0 y porcentaje null.
-- -----------------------------------------------------------------------------
create function public.resumen_diario(p_desde date, p_hasta date)
returns table (
  fecha        date,
  programados  integer,
  completados  integer,
  porcentaje   numeric
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  -- Valida antes de consultar (cumplimiento_habitos aplica las mismas reglas,
  -- pero el planificador podría no llegar a llamarla si el rango está vacío).
  if p_desde is null or p_hasta is null or p_hasta < p_desde then
    raise exception 'Rango de fechas inválido: % a %', p_desde, p_hasta
      using errcode = '22023';
  end if;

  return query
  with cumplimiento as (
    select * from public.cumplimiento_habitos(p_desde, p_hasta)
  )
  select
    dia.fecha,
    count(c.habito_id)::integer,
    (count(c.habito_id) filter (where c.completado))::integer,
    round(
      (count(c.habito_id) filter (where c.completado))::numeric
        / nullif(count(c.habito_id), 0),
      4
    )
  from (
    select g::date as fecha
    from generate_series(p_desde, p_hasta, interval '1 day') as g
  ) as dia
  left join cumplimiento c on c.fecha = dia.fecha
  group by dia.fecha
  order by dia.fecha;
end;
$$;

comment on function public.resumen_diario(date, date) is
  'Por día: hábitos programados, completados y porcentaje (0..1). Base de la racha general.';

-- -----------------------------------------------------------------------------
-- Permisos: solo usuarios autenticados.
-- -----------------------------------------------------------------------------
revoke execute on function public.fecha_hoy()                       from public, anon;
revoke execute on function public.cumplimiento_habitos(date, date)  from public, anon;
revoke execute on function public.resumen_diario(date, date)        from public, anon;

grant execute on function public.fecha_hoy()                        to authenticated;
grant execute on function public.cumplimiento_habitos(date, date)   to authenticated;
grant execute on function public.resumen_diario(date, date)         to authenticated;
