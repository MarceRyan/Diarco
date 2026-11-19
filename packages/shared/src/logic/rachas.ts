/**
 * Cálculo de rachas.
 *
 * Reglas (ver CLAUDE.md):
 *  - Solo cuentan los días programados; los demás ni suman ni rompen.
 *  - Si hoy aún no se cumplió, la racha se cuenta hasta ayer: hoy queda
 *    "pendiente" y solo se rompe al terminar el día.
 *  - Protector: cada semana (lunes a domingo) se pueden fallar N días
 *    programados sin romper la racha. Un día protegido no suma, solo la
 *    mantiene. Si la racha está en 0 no se gasta protector.
 *  - Racha general: días con al menos 70 % de los hábitos programados
 *    cumplidos. Los días sin hábitos programados se saltan.
 *
 * La historia se recorre en orden cronológico, así la racha que se muestra hoy
 * es exactamente la de ayer más lo de hoy: nunca cambia hacia atrás.
 */
import {
  HITOS_RACHA,
  PROTECTORES_POR_DEFECTO,
  UMBRAL_RACHA_GENERAL,
} from "../constantes";
import type { Fecha, ResumenDia } from "../types";
import { compararFechas, diaSemana, inicioSemana, rangoFechas } from "./fechas";

/** Cómo quedó un día respecto a la racha. */
export type EstadoDia = "cumplido" | "fallado" | "pendiente" | "no_aplica";

interface ResultadoRecorrido {
  actual: number;
  maxima: number;
  /** Protectores gastados por semana (clave: lunes de la semana). */
  protectoresUsados: Map<Fecha, number>;
}

/**
 * Motor común: recorre las fechas en orden y aplica las reglas de racha.
 * @param fechas fechas consecutivas en orden ascendente
 * @param evaluar estado de cada fecha
 * @param protectoresPorSemana días que se pueden fallar por semana (0 = ninguno)
 */
function recorrerRacha(
  fechas: readonly Fecha[],
  evaluar: (fecha: Fecha) => EstadoDia,
  protectoresPorSemana: number,
): ResultadoRecorrido {
  let actual = 0;
  let maxima = 0;
  const protectoresUsados = new Map<Fecha, number>();

  for (const fecha of fechas) {
    const estado = evaluar(fecha);

    if (estado === "cumplido") {
      actual++;
      maxima = Math.max(maxima, actual);
    } else if (estado === "fallado" && actual > 0) {
      const semana = inicioSemana(fecha);
      const usados = protectoresUsados.get(semana) ?? 0;
      if (usados < protectoresPorSemana) {
        protectoresUsados.set(semana, usados + 1); // se salva la racha
      } else {
        actual = 0; // se rompe
      }
    }
    // "pendiente" y "no_aplica" no cambian nada.
  }

  return { actual, maxima, protectoresUsados };
}

// -----------------------------------------------------------------------------
// Racha de un hábito
// -----------------------------------------------------------------------------

export interface EntradaRachaHabito {
  /** Días programados: 0 = domingo … 6 = sábado. */
  diasSemana: readonly number[];
  /** Primer día que cuenta: fecha de creación del hábito (en la zona del usuario). */
  desde: Fecha;
  /** Fechas en que se completó. Se ignoran las de días no programados, previas a `desde` o futuras. */
  completados: Iterable<Fecha>;
  /** Hoy en la zona del usuario (ver fechaHoy). */
  hoy: Fecha;
  /** Protectores por semana del perfil. Por defecto 1. */
  protectoresPorSemana?: number;
}

export interface RachaHabito {
  /** Racha vigente (si hoy está pendiente, cuenta hasta ayer). */
  actual: number;
  /** Mejor racha de la historia. */
  maxima: number;
  programadoHoy: boolean;
  completadoHoy: boolean;
  /** Hay racha que perder y hoy toca pero aún no se marcó (para el aviso de las 9 p. m.). */
  enRiesgo: boolean;
  /** Protectores gastados en la semana actual. */
  protectoresUsadosSemana: number;
  /** Protectores que quedan en la semana actual. */
  protectoresRestantesSemana: number;
}

/** Calcula la racha actual y máxima de un hábito. */
export function calcularRachaHabito(entrada: EntradaRachaHabito): RachaHabito {
  const { diasSemana, desde, hoy } = entrada;
  const protectores = entrada.protectoresPorSemana ?? PROTECTORES_POR_DEFECTO;
  const programados = new Set(diasSemana);
  const completados = new Set(entrada.completados);

  const esProgramado = (fecha: Fecha) => programados.has(diaSemana(fecha));

  const fechas = compararFechas(desde, hoy) <= 0 ? rangoFechas(desde, hoy) : [];
  const { actual, maxima, protectoresUsados } = recorrerRacha(
    fechas,
    (fecha) => {
      if (!esProgramado(fecha)) return "no_aplica";
      if (completados.has(fecha)) return "cumplido";
      return fecha === hoy ? "pendiente" : "fallado";
    },
    protectores,
  );

  const programadoHoy = fechas.length > 0 && esProgramado(hoy);
  const completadoHoy = programadoHoy && completados.has(hoy);
  const usadosSemana = protectoresUsados.get(inicioSemana(hoy)) ?? 0;

  return {
    actual,
    maxima,
    programadoHoy,
    completadoHoy,
    enRiesgo: programadoHoy && !completadoHoy && actual > 0,
    protectoresUsadosSemana: usadosSemana,
    protectoresRestantesSemana: Math.max(0, protectores - usadosSemana),
  };
}

// -----------------------------------------------------------------------------
// Racha general
// -----------------------------------------------------------------------------

/** Datos mínimos de un día (coincide con la RPC resumen_diario). */
export type DiaResumen = Pick<ResumenDia, "fecha" | "programados" | "completados">;

export interface EntradaRachaGeneral {
  /**
   * Resumen por día, idealmente sin huecos (resumen_diario devuelve todos los
   * días del rango). Un día que falte se trata como "sin hábitos programados".
   * La racha no puede ir más atrás que el primer día recibido.
   */
  dias: readonly DiaResumen[];
  hoy: Fecha;
  /** Fracción mínima de hábitos cumplidos (0..1). Por defecto 0.7. */
  umbral?: number;
}

export interface RachaGeneral {
  actual: number;
  maxima: number;
  /** Fracción cumplida hoy (0..1), o null si hoy no hay hábitos programados. */
  porcentajeHoy: number | null;
  cumpleHoy: boolean;
}

/** true si el día alcanza el umbral. Usa enteros para evitar errores de coma flotante. */
export function cumpleUmbral(
  dia: Pick<DiaResumen, "programados" | "completados">,
  umbral: number = UMBRAL_RACHA_GENERAL,
): boolean {
  if (dia.programados <= 0) return false;
  return dia.completados * 100 >= Math.round(umbral * 100) * dia.programados;
}

/** Calcula la racha general (días seguidos con ≥ 70 % de hábitos cumplidos). */
export function calcularRachaGeneral(entrada: EntradaRachaGeneral): RachaGeneral {
  const { hoy } = entrada;
  const umbral = entrada.umbral ?? UMBRAL_RACHA_GENERAL;
  const porFecha = new Map(entrada.dias.map((d) => [d.fecha, d]));

  const primera = [...porFecha.keys()].sort(compararFechas)[0];
  const fechas = primera !== undefined && compararFechas(primera, hoy) <= 0 ? rangoFechas(primera, hoy) : [];

  const { actual, maxima } = recorrerRacha(
    fechas,
    (fecha) => {
      const dia = porFecha.get(fecha);
      if (!dia || dia.programados === 0) return "no_aplica";
      if (cumpleUmbral(dia, umbral)) return "cumplido";
      return fecha === hoy ? "pendiente" : "fallado";
    },
    0, // la racha general no usa protector
  );

  const diaHoy = porFecha.get(hoy);
  const porcentajeHoy =
    diaHoy && diaHoy.programados > 0 ? diaHoy.completados / diaHoy.programados : null;

  return {
    actual,
    maxima,
    porcentajeHoy,
    cumpleHoy: diaHoy ? cumpleUmbral(diaHoy, umbral) : false,
  };
}

// -----------------------------------------------------------------------------
// Hitos (avisos al llegar a 3, 7, 21, 30 y 100)
// -----------------------------------------------------------------------------

/**
 * Hito alcanzado al pasar de `anterior` a `nueva`, o null si no se cruzó ninguno.
 * Si se cruzan varios a la vez, devuelve el mayor.
 * @example hitoAlcanzado(6, 7) // 7
 */
export function hitoAlcanzado(anterior: number, nueva: number): number | null {
  let alcanzado: number | null = null;
  for (const hito of HITOS_RACHA) {
    if (anterior < hito && nueva >= hito) alcanzado = hito;
  }
  return alcanzado;
}

/** Próximo hito por alcanzar, o null si ya se superaron todos. */
export function siguienteHito(racha: number): number | null {
  return HITOS_RACHA.find((hito) => hito > racha) ?? null;
}
