/**
 * Estadísticas para las pantallas de progreso y sus gráficos.
 * Funciones puras: reciben filas ya consultadas y devuelven datos listos para graficar.
 */
import type { Actividad, CumplimientoHabito, DiaSemana, EstadoAnimo } from "../types";
import { diaSemana } from "./fechas";

/** Nombres cortos de los días, indexados por DiaSemana (0 = domingo). */
export const NOMBRES_DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

/** Fracción redondeada a 4 decimales, o null si no hay base. */
function fraccion(parte: number, total: number): number | null {
  return total > 0 ? Math.round((parte / total) * 10_000) / 10_000 : null;
}

/** Tasa de cumplimiento (0..1) de un conjunto de días programados, o null si está vacío. */
export function tasaCumplimiento(filas: readonly Pick<CumplimientoHabito, "completado">[]): number | null {
  const completados = filas.filter((f) => f.completado).length;
  return fraccion(completados, filas.length);
}

export interface CumplimientoAgrupado {
  programados: number;
  completados: number;
  /** 0..1, o null si no hubo días programados. */
  tasa: number | null;
}

/** Cumplimiento de cada hábito en el periodo, ordenado por habito_id. */
export function cumplimientoPorHabito(
  filas: readonly CumplimientoHabito[],
): (CumplimientoAgrupado & { habito_id: number })[] {
  const grupos = new Map<number, { programados: number; completados: number }>();
  for (const fila of filas) {
    const g = grupos.get(fila.habito_id) ?? { programados: 0, completados: 0 };
    g.programados++;
    if (fila.completado) g.completados++;
    grupos.set(fila.habito_id, g);
  }
  return [...grupos.entries()]
    .sort(([a], [b]) => a - b)
    .map(([habito_id, g]) => ({ habito_id, ...g, tasa: fraccion(g.completados, g.programados) }));
}

/** Cumplimiento por día de la semana (siempre 7 elementos, de domingo a sábado). */
export function cumplimientoPorDiaSemana(
  filas: readonly Pick<CumplimientoHabito, "fecha" | "completado">[],
): (CumplimientoAgrupado & { dia: DiaSemana; nombre: string })[] {
  const dias = NOMBRES_DIAS.map((nombre, dia) => ({
    dia: dia as DiaSemana,
    nombre,
    programados: 0,
    completados: 0,
  }));
  for (const fila of filas) {
    const d = dias[diaSemana(fila.fecha)]!;
    d.programados++;
    if (fila.completado) d.completados++;
  }
  return dias.map((d) => ({ ...d, tasa: fraccion(d.completados, d.programados) }));
}

/** Minutos y cantidad de actividades por categoría, de mayor a menor tiempo. */
export function minutosPorCategoria(
  actividades: readonly Pick<Actividad, "categoria_id" | "minutos">[],
): { categoria_id: number | null; minutos: number; actividades: number }[] {
  const grupos = new Map<number | null, { minutos: number; actividades: number }>();
  for (const a of actividades) {
    const g = grupos.get(a.categoria_id) ?? { minutos: 0, actividades: 0 };
    g.minutos += a.minutos ?? 0;
    g.actividades++;
    grupos.set(a.categoria_id, g);
  }
  return [...grupos.entries()]
    .map(([categoria_id, g]) => ({ categoria_id, ...g }))
    .sort((a, b) => b.minutos - a.minutos || b.actividades - a.actividades);
}

/** Promedio del ánimo (1..5) con un decimal, o null si no hay registros. */
export function promedioAnimo(estados: readonly Pick<EstadoAnimo, "nivel">[]): number | null {
  if (estados.length === 0) return null;
  const suma = estados.reduce((total, e) => total + e.nivel, 0);
  return Math.round((suma / estados.length) * 10) / 10;
}

/** Intensidad para el mapa de calor: 0 (nada o sin hábitos) a 4 (100 %). */
export type NivelIntensidad = 0 | 1 | 2 | 3 | 4;

/** Convierte un porcentaje de cumplimiento (0..1) en un nivel del mapa de calor. */
export function nivelIntensidad(porcentaje: number | null): NivelIntensidad {
  if (porcentaje === null || porcentaje <= 0) return 0;
  if (porcentaje < 0.4) return 1;
  if (porcentaje < 0.7) return 2;
  if (porcentaje < 1) return 3;
  return 4;
}
