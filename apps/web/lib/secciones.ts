/**
 * Secciones de la app. Módulo sin "use client" para que lo usen tanto la
 * navegación (cliente) como la página "Más" (servidor).
 */
import {
  Award,
  CalendarClock,
  CalendarDays,
  ChartColumn,
  NotebookPen,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type Seccion = { href: string; etiqueta: string; descripcion: string; Icono: LucideIcon };

export const PRINCIPALES: Seccion[] = [
  { href: "/hoy", etiqueta: "Hoy", descripcion: "Tus hábitos y agenda del día", Icono: CalendarDays },
  { href: "/habitos", etiqueta: "Hábitos", descripcion: "Lo que quieres repetir", Icono: Sparkles },
  { href: "/horario", etiqueta: "Horario", descripcion: "Tu semana tipo", Icono: CalendarClock },
  { href: "/bitacora", etiqueta: "Bitácora", descripcion: "Lo que hiciste cada día", Icono: NotebookPen },
];

export const SECUNDARIOS: Seccion[] = [
  { href: "/estadisticas", etiqueta: "Estadísticas", descripcion: "Tu progreso en gráficos", Icono: ChartColumn },
  { href: "/logros", etiqueta: "Logros", descripcion: "Lo que has desbloqueado", Icono: Award },
  { href: "/configuracion", etiqueta: "Configuración", descripcion: "Perfil, rachas y apariencia", Icono: Settings },
];
