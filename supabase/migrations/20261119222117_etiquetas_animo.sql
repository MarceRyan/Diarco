-- =============================================================================
-- Diarco · Etiquetas de "qué influyó" en el ánimo
-- Permite relacionar el ánimo con situaciones del día (sueño, ejercicio, estrés…).
-- La lista replica ETIQUETAS_ANIMO de packages/shared/src/constantes.ts.
-- =============================================================================
alter table public.estados_animo
  add column etiquetas text[] not null default '{}'
    check (
      cardinality(etiquetas) <= 6
      and etiquetas <@ array[
        'dormi_bien', 'dormi_mal', 'ejercicio', 'trabajo', 'estudio', 'familia',
        'amigos', 'estres', 'salud', 'comida', 'descanso', 'logro'
      ]::text[]
    );

comment on column public.estados_animo.etiquetas is
  'Qué influyó en el ánimo del día (máx. 6). Ver ETIQUETAS_ANIMO en @diarco/shared.';
