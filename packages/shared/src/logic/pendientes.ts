/**
 * Rutina y pendientes.
 *  - Rutina: tareas que se repiten ciertos días, sin hora ni racha.
 *  - Pendientes: cosas de una sola vez, con fecha opcional. Un pendiente sin
 *    hacer cuya fecha ya pasó queda "atrasado" y sigue apareciendo en Hoy
 *    hasta que se marque.
 */
import type { Fecha, Pendiente, Rutina } from "../types";
import { compararFechas, diaSemana, diferenciaDias, sumarDias } from "./fechas";

/** Tareas de la rutina que tocan en una fecha (activas y programadas ese día). */
export function rutinasDelDia(rutinas: readonly Rutina[], fecha: Fecha): Rutina[] {
  const dia = diaSemana(fecha);
  return rutinas.filter((r) => r.activo && r.dias_semana.includes(dia));
}

/**
 * ¿La tarea tocaba ese día? Programada ese día de la semana y ya existía
 * (`creadaEl`: fecha de creación en la zona del usuario).
 */
export function rutinaTocaba(rutina: { dias_semana: readonly number[] }, fecha: Fecha, creadaEl: Fecha): boolean {
  return rutina.dias_semana.includes(diaSemana(fecha)) && compararFechas(fecha, creadaEl) >= 0;
}

export interface DiasDeRutina {
  id: number;
  /** Días del periodo en que se hizo. */
  hechos: number;
  /** Días del periodo en que tocaba (programada y ya creada). */
  tocaban: number;
}

/**
 * Cuántos días se hizo cada tarea de la rutina en un periodo y cuántos tocaba.
 * También cuenta los días en que hiciste al menos una tarea.
 */
export function diasDeRutina(entrada: {
  rutinas: readonly { id: number; dias_semana: readonly number[]; creadaEl: Fecha }[];
  hechas: ReadonlyMap<number, ReadonlySet<Fecha>>;
  desde: Fecha;
  hasta: Fecha;
}): { porRutina: DiasDeRutina[]; diasConRutina: number } {
  const { rutinas, hechas, desde, hasta } = entrada;
  const fechas: Fecha[] = [];
  for (let f = desde; compararFechas(f, hasta) <= 0; f = sumarDias(f, 1)) fechas.push(f);

  const conAlguna = new Set<Fecha>();
  const porRutina = rutinas.map((r) => {
    const delaRutina = hechas.get(r.id);
    let hechos = 0;
    let tocaban = 0;
    for (const f of fechas) {
      const hecha = delaRutina?.has(f) ?? false;
      // Un día en que la hiciste cuenta aunque no tocara (por ejemplo, si cambiaste sus días):
      // así nunca hay más días hechos que días posibles.
      if (hecha || rutinaTocaba(r, f, r.creadaEl)) tocaban++;
      if (hecha) {
        hechos++;
        conAlguna.add(f);
      }
    }
    return { id: r.id, hechos, tocaban };
  });
  return { porRutina, diasConRutina: conAlguna.size };
}

export interface GruposPendientes {
  /** Sin hacer y con fecha anterior a hoy (el más antiguo primero). */
  atrasados: Pendiente[];
  /** Sin hacer, para hoy (primero los que tienen hora, en orden). */
  hoy: Pendiente[];
  /** Sin hacer, para mañana. */
  manana: Pendiente[];
  /** Sin hacer, después de mañana, agrupados por fecha. */
  proximos: { fecha: Fecha; pendientes: Pendiente[] }[];
  /** Sin hacer y sin fecha. */
  algunDia: Pendiente[];
  /** Hechos (el más reciente primero). */
  hechos: Pendiente[];
}

/** Orden dentro de un día: con hora primero (de más temprano a más tarde), luego por creación. */
function ordenDelDia(a: Pendiente, b: Pendiente): number {
  if (a.hora && b.hora) return a.hora.localeCompare(b.hora) || a.creado_en.localeCompare(b.creado_en);
  if (a.hora) return -1;
  if (b.hora) return 1;
  return a.creado_en.localeCompare(b.creado_en);
}

function ordenPorFecha(a: Pendiente, b: Pendiente): number {
  return compararFechas(a.fecha!, b.fecha!) || ordenDelDia(a, b);
}

/** Reparte los pendientes en los grupos que muestra la app. */
export function agruparPendientes(pendientes: readonly Pendiente[], hoy: Fecha): GruposPendientes {
  const manana = sumarDias(hoy, 1);
  const grupos: GruposPendientes = { atrasados: [], hoy: [], manana: [], proximos: [], algunDia: [], hechos: [] };
  const porFecha = new Map<Fecha, Pendiente[]>();

  for (const p of pendientes) {
    if (p.hecho_en) grupos.hechos.push(p);
    else if (!p.fecha) grupos.algunDia.push(p);
    else if (compararFechas(p.fecha, hoy) < 0) grupos.atrasados.push(p);
    else if (p.fecha === hoy) grupos.hoy.push(p);
    else if (p.fecha === manana) grupos.manana.push(p);
    else {
      const lista = porFecha.get(p.fecha);
      if (lista) lista.push(p);
      else porFecha.set(p.fecha, [p]);
    }
  }

  grupos.atrasados.sort(ordenPorFecha);
  grupos.hoy.sort(ordenDelDia);
  grupos.manana.sort(ordenDelDia);
  grupos.algunDia.sort((a, b) => a.creado_en.localeCompare(b.creado_en));
  grupos.hechos.sort((a, b) => compararFechas(b.hecho_en!, a.hecho_en!) || b.creado_en.localeCompare(a.creado_en));
  grupos.proximos = [...porFecha.entries()]
    .sort(([a], [b]) => compararFechas(a, b))
    .map(([fecha, lista]) => ({ fecha, pendientes: lista.sort(ordenDelDia) }));
  return grupos;
}

/** Días de atraso de una fecha respecto a hoy (0 si es hoy o futura). */
export function diasDeAtraso(fecha: Fecha, hoy: Fecha): number {
  return Math.max(0, diferenciaDias(fecha, hoy));
}
