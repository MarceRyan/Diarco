/**
 * Utilidades de fechas de calendario.
 *
 * Diarco trabaja con fechas de calendario ("2026-11-19"), no con instantes.
 * Se representan como texto ISO `AAAA-MM-DD` y se calculan siempre en la zona
 * horaria del usuario. Internamente se operan en UTC puro para que los cambios
 * de horario de verano o la zona del dispositivo nunca desplacen un día.
 */
import { ZONA_HORARIA_POR_DEFECTO } from "../constantes";
import type { DiaSemana, Fecha } from "../types";

const MS_POR_DIA = 86_400_000;
const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Convierte una fecha `AAAA-MM-DD` a milisegundos UTC (medianoche). Lanza si es inválida. */
function aMs(fecha: Fecha): number {
  const partes = PATRON_FECHA.exec(fecha);
  if (!partes) throw new RangeError(`Fecha inválida: "${fecha}"`);
  const [, a, m, d] = partes;
  const ms = Date.UTC(Number(a), Number(m) - 1, Number(d));
  if (aFecha(ms) !== fecha) throw new RangeError(`Fecha inválida: "${fecha}"`);
  return ms;
}

/** Convierte milisegundos UTC a `AAAA-MM-DD`. */
function aFecha(ms: number): Fecha {
  return new Date(ms).toISOString().slice(0, 10);
}

/** true si el texto es una fecha de calendario real con formato `AAAA-MM-DD`. */
export function esFechaValida(fecha: string): fecha is Fecha {
  try {
    aMs(fecha);
    return true;
  } catch {
    return false;
  }
}

/** true si la zona horaria IANA existe (ej. "America/Lima"). */
export function esZonaHorariaValida(zona: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}

/**
 * Fecha de calendario de un instante en una zona horaria.
 * @example fechaEnZona(new Date("2026-11-20T03:00:00Z"), "America/Lima") // "2026-11-19"
 */
export function fechaEnZona(instante: Date, zona: string = ZONA_HORARIA_POR_DEFECTO): Fecha {
  // en-CA formatea como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instante);
}

/** Fecha de hoy en la zona horaria del usuario. */
export function fechaHoy(zona: string = ZONA_HORARIA_POR_DEFECTO, ahora: Date = new Date()): Fecha {
  return fechaEnZona(ahora, zona);
}

/** Hora actual "HH:MM" en la zona del usuario (para el atajo "Ahora"). */
export function horaActual(zona: string = ZONA_HORARIA_POR_DEFECTO, ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: zona,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(ahora);
}

/** Suma (o resta, con n negativo) días a una fecha. */
export function sumarDias(fecha: Fecha, dias: number): Fecha {
  return aFecha(aMs(fecha) + dias * MS_POR_DIA);
}

/** Días transcurridos de `desde` a `hasta` (negativo si hasta es anterior). */
export function diferenciaDias(desde: Fecha, hasta: Fecha): number {
  return Math.round((aMs(hasta) - aMs(desde)) / MS_POR_DIA);
}

/** Día de la semana: 0 = domingo … 6 = sábado (igual que en la base de datos). */
export function diaSemana(fecha: Fecha): DiaSemana {
  return new Date(aMs(fecha)).getUTCDay() as DiaSemana;
}

/** Lunes de la semana a la que pertenece la fecha (semanas de lunes a domingo). */
export function inicioSemana(fecha: Fecha): Fecha {
  const dia = diaSemana(fecha);
  const desdeLunes = (dia + 6) % 7; // lunes → 0, domingo → 6
  return sumarDias(fecha, -desdeLunes);
}

/** Lista de fechas consecutivas entre `desde` y `hasta`, ambas incluidas. */
export function rangoFechas(desde: Fecha, hasta: Fecha): Fecha[] {
  const total = diferenciaDias(desde, hasta);
  const fechas: Fecha[] = [];
  for (let i = 0; i <= total; i++) fechas.push(sumarDias(desde, i));
  return fechas;
}

/** Compara dos fechas ISO (sirve para ordenar). */
export function compararFechas(a: Fecha, b: Fecha): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Racha más larga de días de calendario consecutivos presentes en la lista.
 * Útil para logros como "bitácora 7 días seguidos". Ignora duplicados.
 */
export function maximoDiasConsecutivos(fechas: Iterable<Fecha>): number {
  const unicas = [...new Set(fechas)].sort(compararFechas);
  let maximo = 0;
  let actual = 0;
  let anterior: Fecha | undefined;
  for (const fecha of unicas) {
    actual = anterior !== undefined && diferenciaDias(anterior, fecha) === 1 ? actual + 1 : 1;
    maximo = Math.max(maximo, actual);
    anterior = fecha;
  }
  return maximo;
}
