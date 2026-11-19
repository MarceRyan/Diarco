/**
 * Ánimo con sentido: qué hábitos y qué situaciones (etiquetas) acompañan a tus
 * mejores y peores días. Compara el ánimo promedio de los días "con" frente a
 * los días "sin"; solo informa diferencias claras y con datos suficientes.
 */
import { ETIQUETAS_ANIMO, UMBRAL_RACHA_GENERAL } from "../constantes";
import type { Fecha } from "../types";
import { compararFechas, diaSemana, inicioSemana, sumarDias } from "./fechas";
import { cumpleUmbral, type DiaResumen } from "./rachas";

export interface Descubrimiento {
  tipo: "habito" | "etiqueta";
  /** id del hábito o de la etiqueta */
  clave: number | string;
  /** Ánimo promedio "con" menos ánimo promedio "sin" (en puntos de 1 a 5). */
  diferencia: number;
  diasCon: number;
  diasSin: number;
}

export interface EntradaDescubrimientos {
  animo: readonly { fecha: Fecha; nivel: number; etiquetas?: readonly string[] }[];
  /** Hábitos activos con sus días programados, primer día y fechas cumplidas. */
  habitos: readonly { id: number; diasSemana: readonly number[]; desde: Fecha; completados: ReadonlySet<Fecha> }[];
  /** Días mínimos en cada grupo (con y sin) para sacar una conclusión. Por defecto 3. */
  minimoDias?: number;
  /** Diferencia mínima, en puntos, para considerarla clara. Por defecto 0,5. */
  minimaDiferencia?: number;
}

const promedio = (valores: number[]) => valores.reduce((t, v) => t + v, 0) / valores.length;

/** Patrones claros entre tu ánimo y tus hábitos/etiquetas, de mayor a menor impacto. */
export function descubrimientosAnimo(entrada: EntradaDescubrimientos): Descubrimiento[] {
  const { animo, habitos, minimoDias = 3, minimaDiferencia = 0.5 } = entrada;
  const resultado: Descubrimiento[] = [];

  const comparar = (tipo: Descubrimiento["tipo"], clave: number | string, con: number[], sin: number[]) => {
    if (con.length < minimoDias || sin.length < minimoDias) return;
    const diferencia = Math.round((promedio(con) - promedio(sin)) * 10) / 10;
    if (Math.abs(diferencia) >= minimaDiferencia) {
      resultado.push({ tipo, clave, diferencia, diasCon: con.length, diasSin: sin.length });
    }
  };

  // Hábitos: solo cuentan los días en que el hábito estaba programado.
  for (const h of habitos) {
    const con: number[] = [];
    const sin: number[] = [];
    for (const a of animo) {
      if (compararFechas(a.fecha, h.desde) < 0 || !h.diasSemana.includes(diaSemana(a.fecha))) continue;
      (h.completados.has(a.fecha) ? con : sin).push(a.nivel);
    }
    comparar("habito", h.id, con, sin);
  }

  // Etiquetas: días con la etiqueta frente a días sin ella.
  for (const e of ETIQUETAS_ANIMO) {
    const con = animo.filter((a) => a.etiquetas?.includes(e.id)).map((a) => a.nivel);
    const sin = animo.filter((a) => !a.etiquetas?.includes(e.id)).map((a) => a.nivel);
    comparar("etiqueta", e.id, con, sin);
  }

  return resultado.sort((a, b) => Math.abs(b.diferencia) - Math.abs(a.diferencia));
}

/** Frase cercana para un descubrimiento. `nombreHabito` resuelve el nombre por id. */
export function textoDescubrimiento(d: Descubrimiento, nombreHabito: (id: number) => string | undefined): string {
  const puntos = Math.abs(d.diferencia).toFixed(1).replace(".", ",");
  const unidad = Math.abs(d.diferencia) === 1 ? "punto" : "puntos";
  if (d.tipo === "habito") {
    const nombre = nombreHabito(d.clave as number) ?? "ese hábito";
    return d.diferencia > 0
      ? `Los días que cumples «${nombre}», tu ánimo es ${puntos} ${unidad} más alto.`
      : `Los días que cumples «${nombre}», tu ánimo es ${puntos} ${unidad} más bajo. ¿Quizás te cuesta más de lo que parece?`;
  }
  const etiqueta = ETIQUETAS_ANIMO.find((e) => e.id === d.clave)?.nombre ?? String(d.clave);
  return d.diferencia > 0
    ? `Cuando hay «${etiqueta}» en tu día, tu ánimo sube ${puntos} ${unidad}.`
    : `Los días con «${etiqueta}», tu ánimo baja ${puntos} ${unidad}.`;
}

// -----------------------------------------------------------------------------
// Semana de racha (tira L–D)
// -----------------------------------------------------------------------------

/**
 * - cumplido: el día sumó a la racha general (≥ 70 %).
 * - pendiente: es hoy y aún no llega al 70 %.
 * - fallado: ya pasó y no llegó al 70 %.
 * - libre: no había hábitos programados (no rompe la racha).
 * - futuro: todavía no llega.
 */
export type EstadoDiaRacha = "cumplido" | "pendiente" | "fallado" | "libre" | "futuro";

/** Los 7 días (lunes a domingo) de la semana de `hoy` con su estado para la racha general. */
export function semanaDeRacha(
  dias: readonly DiaResumen[],
  hoy: Fecha,
  umbral: number = UMBRAL_RACHA_GENERAL,
): { fecha: Fecha; estado: EstadoDiaRacha }[] {
  const porFecha = new Map(dias.map((d) => [d.fecha, d]));
  const lunes = inicioSemana(hoy);
  return Array.from({ length: 7 }, (_, i) => {
    const fecha = sumarDias(lunes, i);
    if (compararFechas(fecha, hoy) > 0) return { fecha, estado: "futuro" as const };
    const dia = porFecha.get(fecha);
    if (!dia || dia.programados === 0) return { fecha, estado: "libre" as const };
    if (cumpleUmbral(dia, umbral)) return { fecha, estado: "cumplido" as const };
    return { fecha, estado: fecha === hoy ? ("pendiente" as const) : ("fallado" as const) };
  });
}
