/**
 * Secciones de la app. Módulo sin "use client" para que lo usen tanto la
 * navegación (cliente) como la página "Más" (servidor).
 * Cada sección tiene un color de la paleta que la identifica en la navegación.
 */
import {
  Award,
  CalendarClock,
  ChartColumn,
  Flame,
  ListTodo,
  NotebookPen,
  Settings,
  Sprout,
  type LucideIcon,
} from "lucide-react";

export type ColorSeccion = "mandarina" | "verde" | "cielo" | "violeta" | "amarillo" | "neutro";

export type Seccion = {
  href: string;
  etiqueta: string;
  descripcion: string;
  Icono: LucideIcon;
  color: ColorSeccion;
};

export const PRINCIPALES: Seccion[] = [
  { href: "/hoy", etiqueta: "Hoy", descripcion: "Tus hábitos y tu agenda del día", Icono: Flame, color: "mandarina" },
  { href: "/habitos", etiqueta: "Hábitos", descripcion: "Lo que quieres repetir", Icono: Sprout, color: "verde" },
  { href: "/horario", etiqueta: "Horario", descripcion: "Tu semana tipo", Icono: CalendarClock, color: "cielo" },
  { href: "/bitacora", etiqueta: "Bitácora", descripcion: "Lo que hiciste cada día", Icono: NotebookPen, color: "violeta" },
];

export const SECUNDARIOS: Seccion[] = [
  { href: "/pendientes", etiqueta: "Pendientes", descripcion: "Tareas y eventos de una sola vez", Icono: ListTodo, color: "cielo" },
  { href: "/estadisticas", etiqueta: "Progreso", descripcion: "Cómo vas, en gráficos", Icono: ChartColumn, color: "violeta" },
  { href: "/logros", etiqueta: "Logros", descripcion: "Las medallas que ganaste", Icono: Award, color: "amarillo" },
  { href: "/configuracion", etiqueta: "Ajustes", descripcion: "Perfil, rachas y apariencia", Icono: Settings, color: "neutro" },
];

/**
 * Clases por color (escritas completas para que Tailwind las detecte).
 * `activo`: pastilla de la sección actual · `icono`: baldosa del ícono.
 */
export const CLASES_COLOR: Record<ColorSeccion, { activo: string; icono: string; texto: string }> = {
  mandarina: { activo: "bg-mandarina-suave text-mandarina-texto border-mandarina/40", icono: "bg-mandarina text-white", texto: "text-mandarina-texto" },
  verde: { activo: "bg-verde-suave text-verde-texto border-verde/40", icono: "bg-verde text-white", texto: "text-verde-texto" },
  cielo: { activo: "bg-cielo-suave text-cielo-texto border-cielo/40", icono: "bg-cielo text-white", texto: "text-cielo-texto" },
  violeta: { activo: "bg-violeta-suave text-violeta-texto border-violeta/40", icono: "bg-violeta text-white", texto: "text-violeta-texto" },
  amarillo: { activo: "bg-amarillo-suave text-amarillo-texto border-amarillo/50", icono: "bg-amarillo text-[#2a2342]", texto: "text-amarillo-texto" },
  neutro: { activo: "bg-superficie text-texto border-borde-fuerte", icono: "bg-superficie-2 text-texto", texto: "text-texto" },
};
