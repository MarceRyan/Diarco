-- =============================================================================
-- Diarco · Catálogo de logros
-- Datos de referencia que la app necesita en todos los entornos (por eso van
-- en una migración y no en seed.sql, que solo corre en desarrollo local).
-- Los códigos deben coincidir con CODIGOS_LOGRO en packages/shared/src/logic/logros.ts
-- (una prueba lo verifica).
-- =============================================================================
insert into public.logros (codigo, nombre, descripcion) values
  ('primer_paso',       'Primer paso',        'Completa un hábito por primera vez.'),
  ('racha_3',           'Calentando motores', 'Alcanza una racha de 3 días.'),
  ('racha_7',           'Una semana entera',  'Alcanza una racha de 7 días.'),
  ('racha_21',          'Hábito formado',     'Alcanza una racha de 21 días.'),
  ('racha_30',          'Un mes imparable',   'Alcanza una racha de 30 días.'),
  ('racha_100',         'Leyenda',            'Alcanza una racha de 100 días.'),
  ('semana_perfecta',   'Semana perfecta',    'Cumple el 100 % de tus hábitos programados durante 7 días seguidos.'),
  ('bitacora_constante','Bitácora constante', 'Registra actividades 7 días seguidos.'),
  ('buen_animo',        'Buen ánimo',         'Registra tu estado de ánimo 14 días seguidos.')
on conflict (codigo) do nothing;
