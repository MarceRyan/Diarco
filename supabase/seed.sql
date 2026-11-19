-- =============================================================================
-- Diarco · Datos de ejemplo para desarrollo local
-- Se ejecuta automáticamente con `supabase db reset` después de las migraciones.
--
-- Usuario demo:  demo@diarco.local  /  diarco123
--
-- Las fechas son relativas a "hoy" en America/Lima, así que siempre hay rachas
-- activas sin importar cuándo se ejecute el seed.
-- =============================================================================

-- El catálogo de logros está en la migración catalogo_logros (se necesita en
-- todos los entornos, no solo en desarrollo).

-- -----------------------------------------------------------------------------
-- Usuario demo (el trigger al_crear_usuario crea su perfil automáticamente)
-- -----------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  'd3b07384-d9a0-4c9e-8f1a-000000000001',
  'authenticated', 'authenticated',
  'demo@diarco.local',
  extensions.crypt('diarco123', extensions.gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"nombre": "Demo"}',
  now() - interval '60 days', now(),
  '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  'd3b07384-d9a0-4c9e-8f1a-000000000001',
  'd3b07384-d9a0-4c9e-8f1a-000000000001',
  'email',
  '{"sub": "d3b07384-d9a0-4c9e-8f1a-000000000001", "email": "demo@diarco.local", "email_verified": true}',
  now(), now() - interval '60 days', now()
);

-- -----------------------------------------------------------------------------
-- Datos del usuario demo
-- -----------------------------------------------------------------------------
do $$
declare
  demo   constant uuid := 'd3b07384-d9a0-4c9e-8f1a-000000000001';
  hoy    constant date := (now() at time zone 'America/Lima')::date;
  cat_trabajo  bigint;
  cat_estudio  bigint;
  cat_salud    bigint;
  cat_ocio     bigint;
  hab_agua     bigint;
  hab_leer     bigint;
  hab_ejercicio bigint;
  hab_meditar  bigint;
begin
  -- Categorías ---------------------------------------------------------------
  insert into public.categorias (usuario_id, nombre, color) values (demo, 'Trabajo', '#6741d9') returning id into cat_trabajo;
  insert into public.categorias (usuario_id, nombre, color) values (demo, 'Estudio', '#1c7ed6') returning id into cat_estudio;
  insert into public.categorias (usuario_id, nombre, color) values (demo, 'Salud',   '#2f9e44') returning id into cat_salud;
  insert into public.categorias (usuario_id, nombre, color) values (demo, 'Ocio',    '#ff6a2b') returning id into cat_ocio;

  -- Hábitos ------------------------------------------------------------------
  insert into public.habitos (usuario_id, nombre, icono, color, dias_semana, meta, creado_en)
  values (demo, 'Beber agua', '💧', '#1c7ed6', '{0,1,2,3,4,5,6}', '2 litros al día', now() - interval '60 days')
  returning id into hab_agua;

  insert into public.habitos (usuario_id, nombre, icono, color, dias_semana, meta, creado_en)
  values (demo, 'Leer', '📚', '#6741d9', '{1,2,3,4,5}', 'Leer 20 páginas', now() - interval '60 days')
  returning id into hab_leer;

  insert into public.habitos (usuario_id, nombre, icono, color, dias_semana, meta, creado_en)
  values (demo, 'Ejercicio', '🏃', '#ff6a2b', '{1,3,5}', '30 minutos', now() - interval '45 days')
  returning id into hab_ejercicio;

  insert into public.habitos (usuario_id, nombre, icono, color, dias_semana, meta, creado_en)
  values (demo, 'Meditar', '🧘', '#2f9e44', '{0,1,2,3,4,5,6}', '10 minutos', now() - interval '15 days')
  returning id into hab_meditar;

  insert into public.habitos (usuario_id, nombre, icono, color, dias_semana, meta, activo, creado_en)
  values (demo, 'Practicar guitarra', '🎸', '#e64980', '{2,4}', null, false, now() - interval '50 days');

  -- Registros de hábitos (solo días programados; patrones deterministas) ------
  -- Agua: falló hace 33 y 20 días → racha actual de 20 días (incluye hoy).
  insert into public.habito_registros (habito_id, usuario_id, fecha, completado)
  select hab_agua, demo, hoy - n, true
  from generate_series(0, 45) as n
  where n not in (20, 33);

  -- Leer (lun–vie): falla de vez en cuando; hoy aún sin marcar.
  insert into public.habito_registros (habito_id, usuario_id, fecha, completado)
  select hab_leer, demo, hoy - n, true
  from generate_series(1, 45) as n
  where extract(dow from hoy - n) between 1 and 5
    and n % 9 <> 4;

  -- Ejercicio (lun, mié, vie): falla algunos días; hoy aún sin marcar.
  insert into public.habito_registros (habito_id, usuario_id, fecha, completado)
  select hab_ejercicio, demo, hoy - n, true
  from generate_series(1, 44) as n
  where extract(dow from hoy - n) in (1, 3, 5)
    and n % 5 <> 2;

  -- Meditar: racha nueva de los últimos 8 días.
  insert into public.habito_registros (habito_id, usuario_id, fecha, completado, nota)
  select hab_meditar, demo, hoy - n, true,
         case when n = 1 then 'Me costó concentrarme, pero lo hice' end
  from generate_series(1, 8) as n;

  -- Bitácora: actividades de la última semana --------------------------------
  insert into public.actividades (usuario_id, fecha, hora, descripcion, categoria_id, minutos)
  select demo, hoy - n, a.hora, a.descripcion, a.categoria, a.minutos
  from generate_series(0, 6) as n
  cross join (values
    (time '08:00', 'Revisión de correos y planificación del día', cat_trabajo, 30),
    (time '09:00', 'Trabajo enfocado en el proyecto principal',  cat_trabajo, 180),
    (time '15:00', 'Curso de TypeScript',                        cat_estudio, 60),
    (time '19:30', 'Caminata por el parque',                     cat_salud,   40)
  ) as a (hora, descripcion, categoria, minutos)
  where extract(dow from hoy - n) between 1 and 5;

  insert into public.actividades (usuario_id, fecha, hora, descripcion, categoria_id, minutos)
  select demo, hoy - n, time '11:00', 'Salida con amigos', cat_ocio, 150
  from generate_series(0, 6) as n
  where extract(dow from hoy - n) in (0, 6);

  -- Horario semanal ----------------------------------------------------------
  insert into public.bloques_horario (usuario_id, dias_semana, inicio, fin, titulo, categoria_id) values
    (demo, '{1,3,5}',     '06:30', '07:30', 'Ejercicio',        cat_salud),
    (demo, '{1,2,3,4,5}', '08:00', '13:00', 'Trabajo',          cat_trabajo),
    (demo, '{1,2,3,4,5}', '14:00', '17:00', 'Trabajo',          cat_trabajo),
    (demo, '{2,4}',       '19:00', '20:30', 'Clase de inglés',  cat_estudio),
    (demo, '{6}',         '10:00', '12:00', 'Tiempo libre',     cat_ocio);

  -- Estado de ánimo de las últimas 2 semanas ---------------------------------
  insert into public.estados_animo (usuario_id, fecha, nivel, nota)
  select demo, hoy - n, 2 + ((n * 7) % 4),
         case when n = 0 then 'Buen día, con energía' end
  from generate_series(0, 13) as n;

  -- Logros ya obtenidos -------------------------------------------------------
  insert into public.usuario_logros (usuario_id, logro_id, obtenido_en)
  select demo, l.id, now() - (interval '1 day' * x.hace_dias)
  from public.logros l
  join (values ('primer_paso', 45), ('racha_3', 42), ('racha_7', 12)) as x (codigo, hace_dias)
    on x.codigo = l.codigo;
end;
$$;
