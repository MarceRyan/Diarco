/**
 * Formato de fechas y horas para mostrar en pantalla (es).
 * Las fechas `AAAA-MM-DD` se formatean en UTC para que no se desplacen de día.
 */
import type { Fecha } from "@diarco/shared";

const aDate = (fecha: Fecha) => new Date(`${fecha}T00:00:00Z`);

const formatoLargo = new Intl.DateTimeFormat("es", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** "jueves, 19 de noviembre" */
export function fechaLarga(fecha: Fecha): string {
  return formatoLargo.format(aDate(fecha));
}

const formatoCorto = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: "UTC" });

/** "19 nov" */
export function fechaCorta(fecha: Fecha): string {
  return formatoCorto.format(aDate(fecha)).replace(".", "");
}

/** 0.756 → "76 %" */
export function porcentaje(fraccion: number): string {
  return `${Math.round(fraccion * 100)} %`;
}

/** "08:00:00" → "08:00" */
export function horaCorta(hora: string): string {
  return hora.slice(0, 5);
}

/** 135 → "2 h 15 min" */
export function duracion(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

const NOMBRES_DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** [1,2,3,4,5] → "Lun a Vie"; todos → "Todos los días". */
export function describirDias(dias: readonly number[]): string {
  const set = new Set(dias);
  if (set.size === 7) return "Todos los días";
  if (set.size === 5 && [1, 2, 3, 4, 5].every((d) => set.has(d))) return "Lun a Vie";
  if (set.size === 2 && set.has(0) && set.has(6)) return "Fines de semana";
  // Orden de lunes a domingo.
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => set.has(d)).map((d) => NOMBRES_DIAS[d]).join(", ");
}
