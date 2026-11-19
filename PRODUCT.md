# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

(La app móvil con Expo llegará en la etapa 5 y compartirá esta misma identidad de producto.)

## Users

- **Principal:** el autor, que usa Diarco a diario para marcar hábitos, planificar su semana y anotar lo que hace.
- **Cualquier persona que se registre:** amigos o visitantes del portafolio pueden crear una cuenta y usarla de verdad,
  así que la primera experiencia debe explicarse sola, sin guía externa.
- Uso repartido: el celular para marcar hábitos en el momento; la computadora para planificar el horario y revisar estadísticas.

## Product Purpose

Diarco reúne en un solo lugar tres rutinas que suelen vivir separadas: la bitácora de lo que hice en el día,
el horario semanal y los hábitos diarios con rachas, estadísticas y logros. El éxito es que la persona vuelva cada día
porque marcar su progreso se siente bien, no por obligación.

## Positioning

Une hábitos, horario y bitácora con una regla de rachas justa: los días no programados no cuentan, el día de hoy
solo se pierde al terminar, y un protector semanal perdona un tropiezo. La constancia se celebra sin castigar.

## Operating Context

- Momentos cortos en el celular (marcar un hábito, elegir el ánimo) y sesiones más largas en la computadora
  (armar el horario, revisar gráficos).
- Las fechas siempre se calculan en la zona horaria del usuario (por defecto America/Lima).
- Etapa 5 añadirá un aviso a las 9 p. m. cuando una racha esté en riesgo.

## Capabilities and Constraints

- Pantallas: Hoy, Hábitos, Horario, Bitácora, Estadísticas, Logros, Configuración; login y registro con correo.
- Rachas por hábito y racha general (70 % de hábitos cumplidos), protector semanal configurable, hitos en 3, 7, 21, 30 y 100 días.
- 9 logros en el catálogo; ánimo diario de 1 a 5; categorías con color para actividades y bloques.
- Stack: monorepo Next.js 16 + Tailwind 4 (web), Expo (móvil), Supabase. Lógica de negocio solo en `packages/shared`.
- Interfaz y código en español.

## Brand Commitments

- Nombre: **Diarco** (diario + arco).
- Colores de marca: mandarina `#ff6a2b` (rachas) y violeta `#6741d9` (progreso). Modo oscuro obligatorio.
- Voz: **cercana y animada**. Tutea, celebra cada avance con entusiasmo y emojis puntuales
  (ej. "¡Vas 7 días seguidos! 🔥"). Nunca regaña: ante un tropiezo anima a volver.
- Pedido explícito del autor: una experiencia **amigable y lúdica**, en la línea de las apps de hábitos gamificadas
  (tipo Duolingo) pero más moderna y con identidad propia; evitar la estética "tecnológica" fría.
  No copiar marcas, personajes ni recursos de otras apps.

## Evidence on Hand

- No hay testimonios, usuarios reales, métricas ni prensa: no inventarlos.
- Datos de ejemplo solo en desarrollo local (`supabase/seed.sql`, usuario demo).

## Product Principles

1. **Celebrar más que exigir:** cada avance se reconoce; los tropiezos no se castigan.
2. **Hoy primero:** lo que toca hacer hoy está a un toque de distancia.
3. **Se explica sola:** una persona nueva entiende qué hacer sin instrucciones externas.
4. **Honesta con los datos:** las rachas y estadísticas reflejan exactamente las reglas, sin trucos.

## Accessibility & Inclusion

- Objetivos táctiles de al menos 44 px, contraste suficiente en claro y oscuro, foco visible.
- El color nunca es el único canal de información; respetar `prefers-reduced-motion`.
