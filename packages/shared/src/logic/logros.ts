/**
 * Logros: catálogo (fuente de verdad) y reglas para saber cuáles corresponden.
 *
 * Cada logro mide UNA métrica del historial y tiene una meta numérica; así el
 * progreso ("12 de 21") y la evaluación usan exactamente la misma regla.
 * La tabla `logros` se llena con una migración GENERADA a partir de este
 * catálogo (scripts/generar-logros.ts); una prueba verifica que coincidan.
 */
import type { Fecha } from "../types";
import { inicioSemana, maximoDiasConsecutivos, diaSemana, sumarDias } from "./fechas";
import { calcularRachaGeneral, type DiaResumen } from "./rachas";

// -----------------------------------------------------------------------------
// Métricas y grupos
// -----------------------------------------------------------------------------

/** Lo que mide cada logro. */
export type MetricaLogro =
  | "racha_habito" // mejor racha de cualquier hábito
  | "racha_general" // mejor racha general (≥ 70 % de hábitos)
  | "completados" // hábitos marcados en toda la historia
  | "dias_perfectos" // días seguidos con el 100 % de los hábitos
  | "dias_activos" // días distintos con al menos un hábito marcado
  | "findes_perfectos" // fines de semana con todos los hábitos cumplidos
  | "actividades" // actividades anotadas en la bitácora
  | "horas_registradas" // horas registradas en la bitácora
  | "bitacora_seguidos" // días seguidos anotando en la bitácora
  | "madrugador" // actividades anotadas antes de las 7:00
  | "noctambulo" // actividades anotadas desde las 22:00
  | "animo_seguidos" // días seguidos registrando el ánimo
  | "animo_registros" // estados de ánimo registrados
  | "habitos_creados"
  | "habitos_activos"
  | "categorias"
  | "bloques"
  | "horas_planificadas" // horas por semana organizadas en el horario
  | "notas" // notas de "qué hiciste" en hábitos cumplidos
  | "semana_variada"; // categorías distintas usadas en una misma semana

export type GrupoLogro = "rachas" | "constancia" | "bitacora" | "animo" | "organizacion" | "especiales";

export const GRUPOS_LOGRO: { id: GrupoLogro; nombre: string }[] = [
  { id: "rachas", nombre: "Rachas" },
  { id: "constancia", nombre: "Constancia" },
  { id: "bitacora", nombre: "Bitácora" },
  { id: "animo", nombre: "Ánimo" },
  { id: "organizacion", nombre: "Organización" },
  { id: "especiales", nombre: "Especiales" },
];

export interface DefinicionLogro<C extends string = string> {
  codigo: C;
  nombre: string;
  descripcion: string;
  grupo: GrupoLogro;
  metrica: MetricaLogro;
  meta: number;
}

/** Ayudante que conserva el código literal para el tipo CodigoLogro. */
function logro<C extends string>(
  codigo: C,
  nombre: string,
  descripcion: string,
  grupo: GrupoLogro,
  metrica: MetricaLogro,
  meta: number,
): DefinicionLogro<C> {
  return { codigo, nombre, descripcion, grupo, metrica, meta };
}

const dias = (n: number) => `${n} ${n === 1 ? "día" : "días"}`;

// -----------------------------------------------------------------------------
// Catálogo (109 logros). Los 9 primeros son los originales: sus códigos no cambian.
// -----------------------------------------------------------------------------
export const CATALOGO_LOGROS = [
  // Originales
  logro("primer_paso", "Primer paso", "Completa un hábito por primera vez.", "constancia", "completados", 1),
  logro("racha_3", "Calentando motores", "Alcanza una racha de 3 días.", "rachas", "racha_habito", 3),
  logro("racha_7", "Una semana entera", "Alcanza una racha de 7 días.", "rachas", "racha_habito", 7),
  logro("racha_21", "Hábito formado", "Alcanza una racha de 21 días.", "rachas", "racha_habito", 21),
  logro("racha_30", "Un mes imparable", "Alcanza una racha de 30 días.", "rachas", "racha_habito", 30),
  logro("racha_100", "Leyenda", "Alcanza una racha de 100 días.", "rachas", "racha_habito", 100),
  logro("semana_perfecta", "Semana perfecta", "Cumple el 100 % de tus hábitos programados durante 7 días seguidos.", "constancia", "dias_perfectos", 7),
  logro("bitacora_constante", "Bitácora constante", "Registra actividades 7 días seguidos.", "bitacora", "bitacora_seguidos", 7),
  logro("buen_animo", "Buen ánimo", "Registra tu estado de ánimo 14 días seguidos.", "animo", "animo_seguidos", 14),

  // Rachas de un hábito
  logro("racha_2", "Chispa encendida", `Alcanza una racha de ${dias(2)} en un hábito.`, "rachas", "racha_habito", 2),
  logro("racha_5", "Cinco seguidos", `Alcanza una racha de ${dias(5)} en un hábito.`, "rachas", "racha_habito", 5),
  logro("racha_10", "Diez de diez", `Alcanza una racha de ${dias(10)} en un hábito.`, "rachas", "racha_habito", 10),
  logro("racha_14", "Dos semanas firmes", `Alcanza una racha de ${dias(14)} en un hábito.`, "rachas", "racha_habito", 14),
  logro("racha_45", "Mes y medio", `Alcanza una racha de ${dias(45)} en un hábito.`, "rachas", "racha_habito", 45),
  logro("racha_50", "Medio centenar", `Alcanza una racha de ${dias(50)} en un hábito.`, "rachas", "racha_habito", 50),
  logro("racha_60", "Dos meses en llamas", `Alcanza una racha de ${dias(60)} en un hábito.`, "rachas", "racha_habito", 60),
  logro("racha_75", "Tres cuartos de cien", `Alcanza una racha de ${dias(75)} en un hábito.`, "rachas", "racha_habito", 75),
  logro("racha_90", "Un trimestre entero", `Alcanza una racha de ${dias(90)} en un hábito.`, "rachas", "racha_habito", 90),
  logro("racha_120", "Cuatro meses de fuego", `Alcanza una racha de ${dias(120)} en un hábito.`, "rachas", "racha_habito", 120),
  logro("racha_150", "Fogata eterna", `Alcanza una racha de ${dias(150)} en un hábito.`, "rachas", "racha_habito", 150),
  logro("racha_180", "Medio año sin parar", `Alcanza una racha de ${dias(180)} en un hábito.`, "rachas", "racha_habito", 180),
  logro("racha_200", "Doscientos", `Alcanza una racha de ${dias(200)} en un hábito.`, "rachas", "racha_habito", 200),
  logro("racha_250", "Imparable", `Alcanza una racha de ${dias(250)} en un hábito.`, "rachas", "racha_habito", 250),
  logro("racha_300", "Volcán", `Alcanza una racha de ${dias(300)} en un hábito.`, "rachas", "racha_habito", 300),
  logro("racha_365", "Un año entero", `Alcanza una racha de ${dias(365)} en un hábito.`, "rachas", "racha_habito", 365),

  // Racha general (días con ≥ 70 % de los hábitos)
  logro("general_3", "Buen arranque", `Logra una racha general de ${dias(3)}.`, "rachas", "racha_general", 3),
  logro("general_7", "Semana redonda", `Logra una racha general de ${dias(7)}.`, "rachas", "racha_general", 7),
  logro("general_14", "Quincena brillante", `Logra una racha general de ${dias(14)}.`, "rachas", "racha_general", 14),
  logro("general_21", "Tres semanas en ritmo", `Logra una racha general de ${dias(21)}.`, "rachas", "racha_general", 21),
  logro("general_30", "Mes en equilibrio", `Logra una racha general de ${dias(30)}.`, "rachas", "racha_general", 30),
  logro("general_60", "Vida en orden", `Logra una racha general de ${dias(60)}.`, "rachas", "racha_general", 60),
  logro("general_90", "Temporada completa", `Logra una racha general de ${dias(90)}.`, "rachas", "racha_general", 90),
  logro("general_180", "Medio año en ritmo", `Logra una racha general de ${dias(180)}.`, "rachas", "racha_general", 180),
  logro("general_365", "Año de oro", `Logra una racha general de ${dias(365)}.`, "rachas", "racha_general", 365),

  // Hábitos marcados en total
  logro("completados_10", "Diez marcas", "Marca 10 hábitos cumplidos.", "constancia", "completados", 10),
  logro("completados_25", "Cuarto de cien", "Marca 25 hábitos cumplidos.", "constancia", "completados", 25),
  logro("completados_50", "Cincuenta checks", "Marca 50 hábitos cumplidos.", "constancia", "completados", 50),
  logro("completados_100", "Centenario", "Marca 100 hábitos cumplidos.", "constancia", "completados", 100),
  logro("completados_200", "Doble centenario", "Marca 200 hábitos cumplidos.", "constancia", "completados", 200),
  logro("completados_300", "Trescientos", "Marca 300 hábitos cumplidos.", "constancia", "completados", 300),
  logro("completados_500", "Medio millar", "Marca 500 hábitos cumplidos.", "constancia", "completados", 500),
  logro("completados_750", "Setecientos cincuenta", "Marca 750 hábitos cumplidos.", "constancia", "completados", 750),
  logro("completados_1000", "Mil veces sí", "Marca 1000 hábitos cumplidos.", "constancia", "completados", 1000),
  logro("completados_1500", "Mil quinientos", "Marca 1500 hábitos cumplidos.", "constancia", "completados", 1500),
  logro("completados_2000", "Maestría", "Marca 2000 hábitos cumplidos.", "constancia", "completados", 2000),

  // Días perfectos, días activos y fines de semana
  logro("perfecto_3", "Tres días impecables", `Cumple el 100 % de tus hábitos ${dias(3)} seguidos.`, "constancia", "dias_perfectos", 3),
  logro("perfecto_14", "Quincena impecable", `Cumple el 100 % de tus hábitos ${dias(14)} seguidos.`, "constancia", "dias_perfectos", 14),
  logro("perfecto_30", "Mes impecable", `Cumple el 100 % de tus hábitos ${dias(30)} seguidos.`, "constancia", "dias_perfectos", 30),
  logro("dias_7", "Una semana activa", "Marca al menos un hábito en 7 días distintos.", "constancia", "dias_activos", 7),
  logro("dias_30", "Treinta días activos", "Marca al menos un hábito en 30 días distintos.", "constancia", "dias_activos", 30),
  logro("dias_100", "Cien días activos", "Marca al menos un hábito en 100 días distintos.", "constancia", "dias_activos", 100),
  logro("dias_365", "Un año de días activos", "Marca al menos un hábito en 365 días distintos.", "constancia", "dias_activos", 365),
  logro("finde_1", "Finde productivo", "Cumple todos tus hábitos de un fin de semana.", "constancia", "findes_perfectos", 1),
  logro("finde_4", "Mes de findes", "Cumple todos tus hábitos en 4 fines de semana.", "constancia", "findes_perfectos", 4),

  // Bitácora
  logro("actividades_1", "Primera anotación", "Anota tu primera actividad en la bitácora.", "bitacora", "actividades", 1),
  logro("actividades_10", "Diario en marcha", "Anota 10 actividades en la bitácora.", "bitacora", "actividades", 10),
  logro("actividades_25", "Cronista", "Anota 25 actividades en la bitácora.", "bitacora", "actividades", 25),
  logro("actividades_50", "Narrador del día", "Anota 50 actividades en la bitácora.", "bitacora", "actividades", 50),
  logro("actividades_100", "Cien recuerdos", "Anota 100 actividades en la bitácora.", "bitacora", "actividades", 100),
  logro("actividades_250", "Archivista", "Anota 250 actividades en la bitácora.", "bitacora", "actividades", 250),
  logro("actividades_500", "Biógrafo de tu vida", "Anota 500 actividades en la bitácora.", "bitacora", "actividades", 500),
  logro("actividades_1000", "Enciclopedia personal", "Anota 1000 actividades en la bitácora.", "bitacora", "actividades", 1000),
  logro("horas_1", "Primera hora", "Registra 1 hora de actividades.", "bitacora", "horas_registradas", 1),
  logro("horas_10", "Diez horas bien usadas", "Registra 10 horas de actividades.", "bitacora", "horas_registradas", 10),
  logro("horas_25", "Veinticinco horas", "Registra 25 horas de actividades.", "bitacora", "horas_registradas", 25),
  logro("horas_50", "Cincuenta horas", "Registra 50 horas de actividades.", "bitacora", "horas_registradas", 50),
  logro("horas_100", "Cien horas", "Registra 100 horas de actividades.", "bitacora", "horas_registradas", 100),
  logro("horas_250", "Experto en tu tiempo", "Registra 250 horas de actividades.", "bitacora", "horas_registradas", 250),
  logro("horas_500", "Quinientas horas", "Registra 500 horas de actividades.", "bitacora", "horas_registradas", 500),
  logro("bitacora_3", "Tres días anotando", `Registra actividades ${dias(3)} seguidos.`, "bitacora", "bitacora_seguidos", 3),
  logro("bitacora_14", "Dos semanas de diario", `Registra actividades ${dias(14)} seguidos.`, "bitacora", "bitacora_seguidos", 14),
  logro("bitacora_30", "Mes documentado", `Registra actividades ${dias(30)} seguidos.`, "bitacora", "bitacora_seguidos", 30),
  logro("bitacora_60", "Escritor constante", `Registra actividades ${dias(60)} seguidos.`, "bitacora", "bitacora_seguidos", 60),
  logro("bitacora_100", "Cien páginas de vida", `Registra actividades ${dias(100)} seguidos.`, "bitacora", "bitacora_seguidos", 100),
  logro("madrugador_1", "Madrugador", "Anota una actividad antes de las 7:00.", "bitacora", "madrugador", 1),
  logro("madrugador_10", "Amanecer habitual", "Anota 10 actividades antes de las 7:00.", "bitacora", "madrugador", 10),
  logro("noctambulo_1", "Noctámbulo", "Anota una actividad a partir de las 22:00.", "bitacora", "noctambulo", 1),
  logro("noctambulo_10", "Búho nocturno", "Anota 10 actividades a partir de las 22:00.", "bitacora", "noctambulo", 10),

  // Ánimo
  logro("animo_3", "Me escucho", `Registra tu ánimo ${dias(3)} seguidos.`, "animo", "animo_seguidos", 3),
  logro("animo_7", "Una semana sintiendo", `Registra tu ánimo ${dias(7)} seguidos.`, "animo", "animo_seguidos", 7),
  logro("animo_30", "Mes consciente", `Registra tu ánimo ${dias(30)} seguidos.`, "animo", "animo_seguidos", 30),
  logro("animo_60", "Termómetro interior", `Registra tu ánimo ${dias(60)} seguidos.`, "animo", "animo_seguidos", 60),
  logro("animo_100", "Corazón atento", `Registra tu ánimo ${dias(100)} seguidos.`, "animo", "animo_seguidos", 100),
  logro("animo_total_10", "Diez emociones", "Registra tu ánimo 10 veces.", "animo", "animo_registros", 10),
  logro("animo_total_50", "Cincuenta sentires", "Registra tu ánimo 50 veces.", "animo", "animo_registros", 50),
  logro("animo_total_100", "Cien estados", "Registra tu ánimo 100 veces.", "animo", "animo_registros", 100),
  logro("animo_total_365", "Un año de emociones", "Registra tu ánimo 365 veces.", "animo", "animo_registros", 365),

  // Organización
  logro("habitos_1", "Primer hábito", "Crea tu primer hábito.", "organizacion", "habitos_creados", 1),
  logro("habitos_3", "Trío de hábitos", "Crea 3 hábitos.", "organizacion", "habitos_creados", 3),
  logro("habitos_5", "Mano completa", "Crea 5 hábitos.", "organizacion", "habitos_creados", 5),
  logro("habitos_10", "Coleccionista de hábitos", "Crea 10 hábitos.", "organizacion", "habitos_creados", 10),
  logro("activos_3", "Malabarista", "Ten 3 hábitos activos a la vez.", "organizacion", "habitos_activos", 3),
  logro("activos_5", "Multitarea", "Ten 5 hábitos activos a la vez.", "organizacion", "habitos_activos", 5),
  logro("activos_8", "Director de orquesta", "Ten 8 hábitos activos a la vez.", "organizacion", "habitos_activos", 8),
  logro("categorias_1", "Todo en su lugar", "Crea tu primera categoría.", "organizacion", "categorias", 1),
  logro("categorias_3", "Cajones ordenados", "Crea 3 categorías.", "organizacion", "categorias", 3),
  logro("categorias_5", "Arcoíris organizado", "Crea 5 categorías.", "organizacion", "categorias", 5),
  logro("bloques_1", "Primer bloque", "Agrega tu primer bloque al horario.", "organizacion", "bloques", 1),
  logro("bloques_5", "Agenda en forma", "Agrega 5 bloques al horario.", "organizacion", "bloques", 5),
  logro("bloques_10", "Semana armada", "Agrega 10 bloques al horario.", "organizacion", "bloques", 10),
  logro("bloques_20", "Arquitecto del tiempo", "Agrega 20 bloques al horario.", "organizacion", "bloques", 20),
  logro("plan_10", "Diez horas con plan", "Organiza 10 horas por semana en tu horario.", "organizacion", "horas_planificadas", 10),
  logro("plan_20", "Veinte horas con plan", "Organiza 20 horas por semana en tu horario.", "organizacion", "horas_planificadas", 20),
  logro("plan_40", "Semana completa", "Organiza 40 horas por semana en tu horario.", "organizacion", "horas_planificadas", 40),

  // Especiales
  logro("notas_1", "Querido diario", "Escribe tu primera nota de «¿qué hiciste?».", "especiales", "notas", 1),
  logro("notas_10", "Buen narrador", "Escribe 10 notas de «¿qué hiciste?».", "especiales", "notas", 10),
  logro("notas_50", "Memorias", "Escribe 50 notas de «¿qué hiciste?».", "especiales", "notas", 50),
  logro("notas_100", "Autobiografía", "Escribe 100 notas de «¿qué hiciste?».", "especiales", "notas", 100),
  logro("variedad_5", "Vida variada", "Anota actividades de 5 categorías distintas en una misma semana.", "especiales", "semana_variada", 5),
] as const;

export type CodigoLogro = (typeof CATALOGO_LOGROS)[number]["codigo"];

export const CODIGOS_LOGRO: CodigoLogro[] = CATALOGO_LOGROS.map((l) => l.codigo);

/** Definición de un logro por su código (o undefined si no existe). */
export function definicionLogro(codigo: string): DefinicionLogro | undefined {
  return CATALOGO_LOGROS.find((l) => l.codigo === codigo);
}

// -----------------------------------------------------------------------------
// Contexto y evaluación
// -----------------------------------------------------------------------------

/** Conteos de toda la historia (RPC totales_logros). */
export interface TotalesLogros {
  completados: number;
  dias_activos: number;
  actividades: number;
  minutos_registrados: number;
  actividades_madrugada: number;
  actividades_noche: number;
  animo_registros: number;
  habitos_creados: number;
  habitos_activos: number;
  categorias: number;
  bloques: number;
  minutos_planificados: number;
  notas: number;
}

export interface ContextoLogros {
  hoy: Fecha;
  /** Mayor racha máxima entre todos los hábitos. */
  mejorRacha: number;
  /** Mejor racha general de la historia consultada. */
  mejorRachaGeneral: number;
  /** Resumen diario de la historia consultada. */
  resumenDiario: readonly DiaResumen[];
  /** Actividades recientes (para días seguidos y variedad semanal). */
  actividades: readonly { fecha: Fecha; categoria_id: number | null }[];
  /** Fechas recientes con estado de ánimo registrado. */
  fechasAnimo: Iterable<Fecha>;
  totales: TotalesLogros;
}

/** Fines de semana (sábado + domingo) con hábitos programados y todos cumplidos. */
export function contarFindesPerfectos(dias: readonly DiaResumen[]): number {
  const porFecha = new Map(dias.map((d) => [d.fecha, d]));
  let findes = 0;
  for (const d of dias) {
    if (diaSemana(d.fecha) !== 6) continue;
    const domingo = porFecha.get(sumarDias(d.fecha, 1));
    const programados = d.programados + (domingo?.programados ?? 0);
    const completados = d.completados + (domingo?.completados ?? 0);
    if (programados > 0 && completados === programados) findes++;
  }
  return findes;
}

/** Mayor cantidad de categorías distintas usadas en una misma semana (lunes a domingo). */
export function maximoCategoriasEnUnaSemana(actividades: readonly { fecha: Fecha; categoria_id: number | null }[]): number {
  const porSemana = new Map<Fecha, Set<number>>();
  for (const a of actividades) {
    if (a.categoria_id === null) continue;
    const semana = inicioSemana(a.fecha);
    const set = porSemana.get(semana) ?? new Set<number>();
    set.add(a.categoria_id);
    porSemana.set(semana, set);
  }
  return Math.max(0, ...[...porSemana.values()].map((s) => s.size));
}

/** Valor actual de cada métrica según el historial. */
export function medirLogros(ctx: ContextoLogros): Record<MetricaLogro, number> {
  const t = ctx.totales;
  return {
    racha_habito: ctx.mejorRacha,
    racha_general: ctx.mejorRachaGeneral,
    completados: t.completados,
    dias_perfectos: calcularRachaGeneral({ dias: ctx.resumenDiario, hoy: ctx.hoy, umbral: 1 }).maxima,
    dias_activos: t.dias_activos,
    findes_perfectos: contarFindesPerfectos(ctx.resumenDiario),
    actividades: t.actividades,
    horas_registradas: Math.floor(t.minutos_registrados / 60),
    bitacora_seguidos: maximoDiasConsecutivos(ctx.actividades.map((a) => a.fecha)),
    madrugador: t.actividades_madrugada,
    noctambulo: t.actividades_noche,
    animo_seguidos: maximoDiasConsecutivos(ctx.fechasAnimo),
    animo_registros: t.animo_registros,
    habitos_creados: t.habitos_creados,
    habitos_activos: t.habitos_activos,
    categorias: t.categorias,
    bloques: t.bloques,
    horas_planificadas: Math.floor(t.minutos_planificados / 60),
    notas: t.notas,
    semana_variada: maximoCategoriasEnUnaSemana(ctx.actividades),
  };
}

export interface ProgresoLogro {
  codigo: CodigoLogro;
  /** Valor actual, sin pasar de la meta. */
  valor: number;
  meta: number;
  cumplido: boolean;
}

/** Progreso de todos los logros del catálogo (misma regla que la evaluación). */
export function progresoLogros(ctx: ContextoLogros): ProgresoLogro[] {
  const medidas = medirLogros(ctx);
  return CATALOGO_LOGROS.map((l) => {
    const actual = medidas[l.metrica];
    return { codigo: l.codigo, valor: Math.min(actual, l.meta), meta: l.meta, cumplido: actual >= l.meta };
  });
}

/** Todos los logros que el usuario cumple con su historial actual. */
export function evaluarLogros(ctx: ContextoLogros): CodigoLogro[] {
  return progresoLogros(ctx)
    .filter((p) => p.cumplido)
    .map((p) => p.codigo);
}

/** Logros que se acaban de ganar: los que cumple y aún no tiene registrados. */
export function nuevosLogros(ctx: ContextoLogros, obtenidos: Iterable<string>): CodigoLogro[] {
  const yaObtenidos = new Set(obtenidos);
  return evaluarLogros(ctx).filter((codigo) => !yaObtenidos.has(codigo));
}
