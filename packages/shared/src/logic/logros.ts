/**
 * Logros: qué logros corresponden a un usuario según su historial.
 *
 * Los códigos deben coincidir con el catálogo de la tabla `logros`
 * (supabase/seed.sql); una prueba verifica que estén sincronizados.
 */
import { HITOS_RACHA } from "../constantes";
import type { Fecha } from "../types";
import { maximoDiasConsecutivos } from "./fechas";
import { calcularRachaGeneral, type DiaResumen } from "./rachas";

export const CODIGOS_LOGRO = [
  "primer_paso",
  "racha_3",
  "racha_7",
  "racha_21",
  "racha_30",
  "racha_100",
  "semana_perfecta",
  "bitacora_constante",
  "buen_animo",
] as const;

export type CodigoLogro = (typeof CODIGOS_LOGRO)[number];

/** Días seguidos necesarios para los logros de constancia. */
export const DIAS_SEMANA_PERFECTA = 7;
export const DIAS_BITACORA_CONSTANTE = 7;
export const DIAS_BUEN_ANIMO = 14;

export interface ContextoLogros {
  /** Total de registros de hábitos completados en toda la historia. */
  totalCompletados: number;
  /** Mayor racha máxima entre todos los hábitos (ver calcularRachaHabito). */
  mejorRacha: number;
  /** Resumen diario del periodo evaluado (RPC resumen_diario). */
  resumenDiario: readonly DiaResumen[];
  /** Fechas con al menos una actividad en la bitácora. */
  fechasActividades: Iterable<Fecha>;
  /** Fechas con estado de ánimo registrado. */
  fechasAnimo: Iterable<Fecha>;
  hoy: Fecha;
}

/** Todos los logros que el usuario cumple con su historial actual. */
export function evaluarLogros(ctx: ContextoLogros): CodigoLogro[] {
  const logros: CodigoLogro[] = [];

  if (ctx.totalCompletados >= 1) logros.push("primer_paso");

  for (const hito of HITOS_RACHA) {
    if (ctx.mejorRacha >= hito) logros.push(`racha_${hito}`);
  }

  // Semana perfecta: racha de días con el 100 % de los hábitos cumplidos.
  const rachaPerfecta = calcularRachaGeneral({ dias: ctx.resumenDiario, hoy: ctx.hoy, umbral: 1 });
  if (rachaPerfecta.maxima >= DIAS_SEMANA_PERFECTA) logros.push("semana_perfecta");

  if (maximoDiasConsecutivos(ctx.fechasActividades) >= DIAS_BITACORA_CONSTANTE) {
    logros.push("bitacora_constante");
  }

  if (maximoDiasConsecutivos(ctx.fechasAnimo) >= DIAS_BUEN_ANIMO) logros.push("buen_animo");

  return logros;
}

/** Logros que se acaban de ganar: los que cumple y aún no tiene registrados. */
export function nuevosLogros(ctx: ContextoLogros, obtenidos: Iterable<string>): CodigoLogro[] {
  const yaObtenidos = new Set(obtenidos);
  return evaluarLogros(ctx).filter((codigo) => !yaObtenidos.has(codigo));
}
