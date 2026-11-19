/**
 * Chispa crece contigo: todo lo que haces le da leña, y con la leña acumulada
 * pasa por 10 etapas. Nunca se apaga ni retrocede: la leña cuenta toda tu historia.
 * También: estación del año (para su ropa) y cosecha semanal (álbum de semanas).
 */
import type { Fecha } from "../types";
import { compararFechas, diferenciaDias, inicioSemana, sumarDias } from "./fechas";
import { cumpleUmbral, type DiaResumen } from "./rachas";

// -----------------------------------------------------------------------------
// Leña y etapas
// -----------------------------------------------------------------------------

/** Leña de toda la historia: 1 por hábito cumplido, por día con ánimo y por actividad. */
export function lenaTotal(totales: { completados: number; animo_registros: number; actividades: number }): number {
  return totales.completados + totales.animo_registros + totales.actividades;
}

export const ETAPAS_CHISPA = [
  { nombre: "Chispita", desde: 0 },
  { nombre: "Llamita", desde: 10 },
  { nombre: "Fueguito", desde: 30 },
  { nombre: "Fogata", desde: 70 },
  { nombre: "Hoguera", desde: 140 },
  { nombre: "Gran hoguera", desde: 250 },
  { nombre: "Llama dorada", desde: 400 },
  { nombre: "Llama azul", desde: 600 },
  { nombre: "Volcán", desde: 900 },
  { nombre: "Estrella", desde: 1300 },
] as const;

export interface EtapaChispa {
  /** 1 a 10 */
  numero: number;
  nombre: string;
  /** Leña con la que empezó esta etapa. */
  desde: number;
  /** Leña de la siguiente etapa (null en la última). */
  siguiente: { nombre: string; desde: number } | null;
  /** Avance hacia la siguiente etapa, 0..1 (1 en la última). */
  progreso: number;
}

/** Etapa de Chispa según la leña acumulada. */
export function etapaChispa(lena: number): EtapaChispa {
  let i = 0;
  while (i + 1 < ETAPAS_CHISPA.length && lena >= ETAPAS_CHISPA[i + 1]!.desde) i++;
  const actual = ETAPAS_CHISPA[i]!;
  const proxima = ETAPAS_CHISPA[i + 1];
  return {
    numero: i + 1,
    nombre: actual.nombre,
    desde: actual.desde,
    siguiente: proxima ? { nombre: proxima.nombre, desde: proxima.desde } : null,
    progreso: proxima ? (lena - actual.desde) / (proxima.desde - actual.desde) : 1,
  };
}

/** Días sin cuidar a Chispa desde la última fecha con leña (null si nunca hubo). */
export function diasSinLena(fechasConLena: Iterable<Fecha>, hoy: Fecha): number | null {
  let ultima: Fecha | null = null;
  for (const f of fechasConLena) {
    if (compararFechas(f, hoy) <= 0 && (ultima === null || compararFechas(f, ultima) > 0)) ultima = f;
  }
  return ultima === null ? null : diferenciaDias(ultima, hoy);
}

/** Días sin leña a partir de los cuales Chispa se ve dormida (nunca se apaga). */
export const DIAS_PARA_DORMIR = 3;

// -----------------------------------------------------------------------------
// Estaciones
// -----------------------------------------------------------------------------

export type Estacion = "primavera" | "verano" | "otono" | "invierno";

/** Zonas horarias del hemisferio sur con las que se invierten las estaciones. */
const ZONAS_SUR = [
  "America/Lima",
  "America/Santiago",
  "America/Argentina/",
  "America/Buenos_Aires",
  "America/Montevideo",
  "America/Asuncion",
  "America/La_Paz",
  "America/Sao_Paulo",
  "America/Punta_Arenas",
  "Australia/",
  "Pacific/Auckland",
  "Africa/Johannesburg",
  "Antarctica/",
];

export function esHemisferioSur(zona: string): boolean {
  return ZONAS_SUR.some((z) => (z.endsWith("/") ? zona.startsWith(z) : zona === z));
}

/** Estación del año (por meses) en el hemisferio de la zona horaria del usuario. */
export function estacionDelAno(fecha: Fecha, zona: string): Estacion {
  const mes = Number(fecha.slice(5, 7)); // 1..12
  const norte: Estacion = mes >= 3 && mes <= 5 ? "primavera" : mes >= 6 && mes <= 8 ? "verano" : mes >= 9 && mes <= 11 ? "otono" : "invierno";
  if (!esHemisferioSur(zona)) return norte;
  const opuesta: Record<Estacion, Estacion> = { primavera: "otono", verano: "invierno", otono: "primavera", invierno: "verano" };
  return opuesta[norte];
}

// -----------------------------------------------------------------------------
// Cosecha semanal
// -----------------------------------------------------------------------------

export interface Cosecha {
  /** Lunes de la semana. */
  semana: Fecha;
  enCurso: boolean;
  lena: number;
  /** Fracción de hábitos programados cumplidos (null si no hubo). */
  cumplimiento: number | null;
  /** Días que sumaron a la racha general (≥ 70 %). */
  diasQueSumaron: number;
  /** Día con más hábitos cumplidos (null si ninguno). */
  mejorDia: Fecha | null;
}

/** Álbum de las últimas `semanas` semanas (de la más reciente a la más antigua). */
export function cosechasSemanales(entrada: {
  dias: readonly DiaResumen[];
  fechasAnimo: Iterable<Fecha>;
  actividades: readonly { fecha: Fecha }[];
  hoy: Fecha;
  semanas?: number;
}): Cosecha[] {
  const { dias, hoy, semanas = 8 } = entrada;
  const porFecha = new Map(dias.map((d) => [d.fecha, d]));
  const animo = new Set(entrada.fechasAnimo);
  const actividadesPorFecha = new Map<Fecha, number>();
  for (const a of entrada.actividades) actividadesPorFecha.set(a.fecha, (actividadesPorFecha.get(a.fecha) ?? 0) + 1);

  const lunesActual = inicioSemana(hoy);
  return Array.from({ length: semanas }, (_, s) => {
    const lunes = sumarDias(lunesActual, -7 * s);
    let lena = 0;
    let programados = 0;
    let completados = 0;
    let diasQueSumaron = 0;
    let mejorDia: Fecha | null = null;
    let mejorCantidad = 0;
    for (let i = 0; i < 7; i++) {
      const fecha = sumarDias(lunes, i);
      if (compararFechas(fecha, hoy) > 0) break;
      const dia = porFecha.get(fecha);
      if (dia) {
        programados += dia.programados;
        completados += dia.completados;
        lena += dia.completados;
        if (cumpleUmbral(dia)) diasQueSumaron++;
        if (dia.completados > mejorCantidad) {
          mejorCantidad = dia.completados;
          mejorDia = fecha;
        }
      }
      if (animo.has(fecha)) lena++;
      lena += actividadesPorFecha.get(fecha) ?? 0;
    }
    return {
      semana: lunes,
      enCurso: s === 0,
      lena,
      cumplimiento: programados > 0 ? completados / programados : null,
      diasQueSumaron,
      mejorDia,
    };
  });
}
