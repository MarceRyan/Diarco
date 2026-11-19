# Diarco — guía del proyecto para Claude Code

## Qué es
Diarco es una app web y móvil para registrar lo que hago en el día (bitácora), organizar mi horario semanal y marcar hábitos diarios con rachas, estadísticas y logros.
Es un proyecto personal y de portafolio: el código debe ser limpio, tipado y documentado.

## Cómo trabajar conmigo
- Responde y comenta en español. Nombres de archivos, componentes, tablas y columnas en español (ej. `habitos`, `TarjetaHabito`, `calcularRacha`), sin tildes ni ñ en el código.
- Trabaja por etapas (ver "Plan") y espera mi confirmación antes de pasar a la siguiente.
- Antes de crear o cambiar muchos archivos, explica en pocas líneas qué vas a hacer y por qué.
- Muestra los comandos exactos que debo ejecutar. Nunca escribas claves reales en el código; usa `.env.local` y mantén `.env.example` actualizado.
- Al terminar cada etapa, sugiere un mensaje de commit (Conventional Commits en español, ej. `feat: agrega pantalla Hoy`).
- Usa las skills instaladas en `.claude/skills` cuando apliquen (Supabase, Vercel/React, Expo).

## Stack
- Monorepo con pnpm workspaces + Turborepo.
- `apps/web`: Next.js (App Router) + TypeScript + Tailwind CSS. Despliegue en Vercel.
- `apps/mobile`: Expo (Expo Router) + TypeScript. Notificaciones con Expo Notifications.
- `packages/shared` (`@diarco/shared`): tipos, esquemas Zod, lógica de rachas/estadísticas/logros y consultas a Supabase. Pruebas con Vitest.
- `supabase/`: migraciones SQL, políticas RLS, vistas, funciones y `seed.sql`. Supabase CLI para desarrollo local.
- Datos en el cliente: TanStack Query. Gráficos: Recharts (web) y Victory Native (móvil).

## Estructura
```
diarco/
├── apps/web/          (app/(auth), app/(app)/hoy|habitos|horario|bitacora|estadisticas|logros|configuracion, components/, lib/supabase/, middleware.ts)
├── apps/mobile/       (src/app/(auth), src/app/(tabs)/hoy|habitos|horario|bitacora|perfil, src/components/, src/lib/)
├── packages/shared/   (src/types, src/schemas, src/logic/rachas.ts|estadisticas.ts|logros.ts, src/api, tests/)
└── supabase/          (migrations/, functions/, seed.sql, config.toml)
```
Regla: la lógica de negocio vive solo en `packages/shared`. Web y móvil solo muestran datos y llaman a esa lógica.

## Modelo de datos (PostgreSQL)
- `perfiles` (id = auth.users.id, nombre, zona_horaria default 'America/Lima', protectores_semana default 1, creado_en) — se crea por trigger al registrarse
- `categorias` (id, usuario_id, nombre, color)
- `habitos` (id, usuario_id, nombre, icono, color, dias_semana smallint[] 0=domingo..6=sábado, meta text, activo, creado_en)
- `habito_registros` (id, habito_id, usuario_id, fecha date, completado, nota) — UNIQUE(habito_id, fecha); FK (habito_id, usuario_id) → habitos
- `actividades` (id, usuario_id, fecha, hora, descripcion, categoria_id, minutos)
- `bloques_horario` (id, usuario_id, dias_semana int[], inicio time, fin time, titulo, categoria_id) — CHECK fin > inicio
- `estados_animo` (usuario_id, fecha, nivel 1..5, nota) — PK(usuario_id, fecha)
- `logros` (id, codigo, nombre, descripcion) y `usuario_logros` (usuario_id, logro_id, obtenido_en)
Todas las tablas con RLS activado: cada usuario solo lee y escribe sus filas.
- IDs `bigint` identity; `usuario_id` tiene default `auth.uid()` (el cliente no lo envía).
- FK compuestas `(x_id, usuario_id)` impiden referenciar hábitos o categorías ajenas.
- Permisos explícitos (`GRANT`) solo a `authenticated`; `anon` no accede a nada.
- Funciones RPC (security invoker, respetan RLS): `fecha_hoy()`, `cumplimiento_habitos(desde, hasta)`, `resumen_diario(desde, hasta)`.
  Solo preparan datos; el cálculo de rachas vive en `packages/shared`.
- Usuario demo del seed: `demo@diarco.local` / `diarco123`.

## Reglas de negocio
- Racha de un hábito: días programados seguidos con registro completado. Los días no programados no rompen la racha.
- Si hoy aún no se marcó, la racha se cuenta hasta ayer (se rompe recién al terminar el día).
- Protector de racha: 1 día por semana puede faltar sin romper la racha (configurable).
- Racha general: días seguidos con al menos 70 % de los hábitos programados cumplidos.
- Fechas siempre en la zona horaria del usuario (por defecto America/Lima), nunca en UTC del servidor.
- Avisos de racha al llegar a 3, 7, 21, 30 y 100.

## Diseño
- Colores: mandarina #ff6a2b (rachas), violeta #6741d9 (progreso), fondo blanco; modo oscuro obligatorio.
- Tipografías: Sora (títulos) e Inter (texto).
- Mobile first, botones de al menos 44 px, buen contraste, estados vacíos y de carga en cada pantalla.

## Plan
0. Estructura del monorepo y configuración base.
1. Supabase: migraciones, RLS, vistas de rachas, seed.
2. `packages/shared`: tipos, Zod, lógica de rachas/estadísticas/logros + pruebas.
3. Web: login y pantallas Hoy, Hábitos, Horario, Bitácora.
4. Web: Estadísticas, Logros, Configuración.
5. Móvil con Expo + notificaciones ("tu racha está en riesgo" a las 9 p. m.).
6. Despliegue (Vercel y EAS) y README con capturas y diagramas.

## Comandos
- `pnpm install` — instalar dependencias (siempre desde la raíz)
- `pnpm dev` — levantar web y móvil a la vez · `pnpm dev:web` / `pnpm dev:mobile` por separado
- `pnpm test` — pruebas de `packages/shared` (Vitest)
- `pnpm typecheck` / `pnpm lint` / `pnpm build` — verificaciones de todo el monorepo
- `pnpm db:start` / `pnpm db:reset` / `pnpm db:stop` — Supabase local (requiere Docker)
- Dependencias de móvil: `pnpm --filter @diarco/mobile exec expo install <paquete>` (no `pnpm add`)

## Notas de configuración
- `.npmrc` usa `node-linker=hoisted` para compatibilidad con React Native.
- `@diarco/shared` se consume como TypeScript fuente (sin build); Next lo compila vía `transpilePackages`.
- pnpm solo ejecuta scripts de instalación de los paquetes listados en `allowBuilds` (`pnpm-workspace.yaml`).
