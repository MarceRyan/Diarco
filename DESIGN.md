# Diarco · Sistema visual "Fiesta de colores"

Marcar el progreso del día se siente como una pequeña fiesta: amigable, lúdico y moderno, en la línea de las apps de
hábitos gamificadas, con identidad propia (Chispa, paleta por roles, papel picado). Fuente de verdad del código:
`apps/web/app/globals.css` (tokens) y `apps/web/components/` (piezas).

## Principios

1. **Cada color tiene un trabajo.** Nunca decorativo: si algo es mandarina, habla de rachas.
2. **Todo se puede tocar y "se hunde".** Botones, filas y chips tienen un labio inferior de 4 px que baja al presionar.
3. **Celebrar más que exigir.** Confeti al marcar, pantalla de fiesta al completar el día; nunca regaños.
4. **Chispa acompaña.** La racha hecha personaje aparece en Hoy, en los estados vacíos, en el acceso y en las celebraciones.

## Color (roles)

Cada rol trae cuatro tonos: base (relleno), `-labio` (borde 3D), `-suave` (fondo) y `-texto` (letra con contraste AA).

| Rol | Uso | Claro (base) | Oscuro (base) |
|---|---|---|---|
| mandarina | rachas, Chispa, sección Hoy | `#ff6a2b` | `#ff7a3d` |
| violeta | progreso, acción principal, Bitácora | `#6741d9` | `#6d4ae0` |
| verde | hecho, crear, sección Hábitos | `#17a362` | `#1fb26d` |
| amarillo | logros y medallas | `#ffc23d` | `#ffc845` |
| cielo | horario y agenda | `#2f9ff0` | `#3aa6f2` |
| peligro | borrar y errores | `#e03131` | `#f25555` |

Neutros: `fondo` lavanda (`#f6f4fd` / `#15121d`), `tarjeta` (`#fff` / `#1f1b2a`), `superficie`, `borde`, `borde-fuerte`,
`texto` (`#2a2342` / `#f3f0fb`), `texto-suave`.

Reglas:
- Como color de letra usar siempre la variante `-texto`; la base es para rellenos.
- Texto sobre amarillo: tinta oscura fija `#2a2342`. Sobre violeta: `sobre-violeta` (blanco).
- Gráficos: `--grafico` y la rampa `--calor-1..4`, validados con la skill dataviz en claro y oscuro (no cambiar sin revalidar).
- Tema: sistema por defecto; el usuario puede forzar claro u oscuro (`data-tema` en `<html>`).

## Tipografía

- **Baloo 2** (600–800) para títulos, números de racha y nombres de hábitos: redonda y alegre.
- **Nunito** (500–800) para todo el texto; peso base 500, etiquetas 800.
- Escala: títulos de pantalla 30–36 px, secciones 24 px, tarjetas 20 px, texto 16–18 px. Tracking mínimo −0,01 em.

## Forma y profundidad

- Tarjetas: `claseTarjeta` = radio 20 px, borde 2 px `borde`, labio inferior 4 px. Sin sombras (una sola forma de elevación).
- Botones (`Boton`): radio 16 px, labio 4 px del tono `-labio`; al presionar bajan 2 px. Altura mínima 44 px (48–52 en acciones principales).
- Campos: radio 16 px, borde 2 px, fondo `superficie`, foco violeta.
- Chips y selectores de día: mismas reglas de labio. Pastillas solo para controles pequeños.
- Excepción documentada: el detector de Impeccable marca `border-b-4` como "borde de acento"; aquí es la firma 3D del sistema, deliberada.

## Chispa

Llamita mandarina con interior amarillo, hecha con formas vectoriales exactas (`components/chispa.tsx`). Estados:
`feliz` (racha viva), `celebrando` (día completo), `preocupada` (racha en riesgo hoy), `dormida` (racha en 0, gris).
Flota suavemente (`animate-flotar`), salvo dormida o con movimiento reducido.

## Movimiento

- **Firma:** al marcar un hábito, el check hace `pop` y suelta confeti de papel picado (`components/confeti.tsx`).
  Al completar el día, diálogo de celebración con Chispa y más confeti.
- Curvas exponenciales de salida (`cubic-bezier(0.16, 1, 0.3, 1)`); nada elástico.
- `prefers-reduced-motion`: se anulan animaciones y el confeti no se muestra.

## Voz

Cercana y animada, tuteo, emojis puntuales. Títulos que hablan: "¡Hola, Ana!", "Tus hábitos de hoy", "¡Día completo!".
Errores con "¡Uy!" y una salida clara ("Intentar de nuevo"). Nunca regañar por un tropiezo.

## Horario y horas

- Horario: dos vistas con selector [Semana | Día] (se recuerda la última en el navegador).
  **Semana** (por defecto): cuadrícula de 7 columnas × horas (52 px por hora); en móvil se desliza de lado con la
  columna de horas fija y abre centrada en hoy; tocar la cabecera de un día abre su vista Día.
  **Día**: semana como 7 tarjetas de día (con puntitos de color de sus bloques) + el día elegido como línea de tiempo
  vertical (64 px por hora). Cada bloque mide lo que dura; si dos se pisan van lado a lado (`distribuirBloques`).
  Línea "Ahora" en mandarina (solo en el navegador). Tocar una hora libre crea un bloque a esa hora.
- Nunca usar `<input type="time">`: `SelectorHora` (números grandes con ▲▼ y atajos) y `SelectorDuracion` (chips).
  En bloques se elige "cuánto dura", no la hora de fin.

## Navegación

Escritorio: barra lateral blanca con baldosas de ícono del color de cada sección. Móvil: cabecera con logo y barra
inferior de 5 pestañas (Hoy, Hábitos, Horario, Bitácora, Más); la activa toma el color suave de su sección.
