/**
 * Historial reciente de un hábito, para mostrar y corregir los últimos días
 * (por ejemplo, marcar ayer si se olvidó).
 */
import type { Fecha } from "../types";
import { compararFechas, diaSemana, sumarDias } from "./fechas";

/**
 * - cumplido: programado y marcado.
 * - pendiente: es hoy, programado y aún sin marcar.
 * - fallado: programado, ya pasó y no se marcó (se puede corregir).
 * - libre: no estaba programado ese día (no se puede marcar).
 * - antes: anterior a la creación del hábito (no se puede marcar).
 */
export type EstadoDiaHabito = "cumplido" | "pendiente" | "fallado" | "libre" | "antes";

export interface DiaHistorial {
  fecha: Fecha;
  estado: EstadoDiaHabito;
  /** true si el usuario puede marcar o desmarcar ese día. */
  marcable: boolean;
}

export interface EntradaHistorial {
  diasSemana: readonly number[];
  /** Primer día del hábito (creación, en la zona del usuario). */
  desde: Fecha;
  completados: ReadonlySet<Fecha>;
  hoy: Fecha;
  /** Cuántos días mostrar terminando en hoy. Por defecto 7. */
  dias?: number;
}

/** Los últimos `dias` días del hábito, del más antiguo a hoy. */
export function historialReciente(entrada: EntradaHistorial): DiaHistorial[] {
  const { diasSemana, desde, completados, hoy, dias = 7 } = entrada;
  const programados = new Set(diasSemana);

  return Array.from({ length: dias }, (_, i) => {
    const fecha = sumarDias(hoy, i - (dias - 1));
    let estado: EstadoDiaHabito;
    if (compararFechas(fecha, desde) < 0) estado = "antes";
    else if (!programados.has(diaSemana(fecha))) estado = "libre";
    else if (completados.has(fecha)) estado = "cumplido";
    else estado = fecha === hoy ? "pendiente" : "fallado";
    return { fecha, estado, marcable: estado !== "antes" && estado !== "libre" };
  });
}

/** Hábitos que ayer tocaban y quedaron sin marcar (para ofrecer corregirlos). */
export function pendientesDeAyer(
  habitos: readonly { id: number; diasSemana: readonly number[]; desde: Fecha; completados: ReadonlySet<Fecha> }[],
  hoy: Fecha,
): number[] {
  const ayer = sumarDias(hoy, -1);
  return habitos
    .filter((h) => {
      const [dia] = historialReciente({ ...h, hoy: ayer, dias: 1 });
      return dia?.estado === "pendiente"; // visto desde "ayer", sin marcar = pendiente
    })
    .map((h) => h.id);
}
