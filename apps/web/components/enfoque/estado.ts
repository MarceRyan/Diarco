/**
 * Estado del Modo enfoque. Hay una sola sesión por navegador y se guarda en
 * localStorage: sobrevive a recargas y cambios de pantalla, y otras pestañas
 * se enteran (evento "storage").
 *
 * Fases: enfoque → fin_enfoque → descanso → fin_descanso → (otra sesión o salir).
 */
"use client";

import { useSyncExternalStore } from "react";

/** Lo que el usuario eligió: en qué, cuánto y con qué categoría. */
export interface Plan {
  descripcion: string;
  /** Duración elegida (en modo libre no se usa). */
  minutos: number;
  categoria_id: number | null;
  /** Cronómetro libre: cuenta hacia arriba hasta que lo detengas. */
  libre?: boolean;
}

interface Base {
  plan: Plan;
  /** Sesiones de enfoque terminadas seguidas (para el descanso largo cada 4). */
  ciclo: number;
  /** La pantalla completa está minimizada a una burbuja. */
  minimizada: boolean;
}

export interface EnCurso extends Base {
  fase: "enfoque" | "descanso";
  /** Minutos de esta fase (en descanso, los del descanso). */
  minutos: number;
  /** Día y hora en que empezó (zona del usuario), para la bitácora. */
  fecha: string;
  horaInicio: string;
  /** Instante (ms) en que termina si no se pausa. */
  fin: number;
  /** ms que quedaban al pausar (null si corre). */
  pausadoRestante: number | null;
  distracciones: number;
}

export interface FinEnfoque extends Base {
  fase: "fin_enfoque";
  minutosHechos: number;
  distracciones: number;
  terminoEn: number;
}

export interface FinDescanso extends Base {
  fase: "fin_descanso";
  terminoEn: number;
}

export type EstadoEnfoque = EnCurso | FinEnfoque | FinDescanso;

export const DURACIONES = [15, 25, 45, 60];
/** Límites de la duración que se escribe a mano ("Otro"). */
export const MINUTOS_MIN = 1;
export const MINUTOS_MAX = 180;
/** El cronómetro libre se cierra solo a las 4 h (por si olvidas detenerlo). */
export const LIMITE_LIBRE = 240;
/** En modo libre, la vela tarda esto en consumirse casi por completo. */
export const MINUTOS_VELA_LIBRE = 90;
export const DESCANSO_CORTO = 5;
export const DESCANSO_LARGO = 15;
/** Cada cuántas sesiones el descanso es largo. */
export const SESIONES_POR_DESCANSO_LARGO = 4;

export const minutosDescanso = (ciclo: number) =>
  ciclo > 0 && ciclo % SESIONES_POR_DESCANSO_LARGO === 0 ? DESCANSO_LARGO : DESCANSO_CORTO;

// --- Almacenamiento -----------------------------------------------------------
const CLAVE = "diarco-enfoque-v2";
let enMemoria = ""; // respaldo si el almacenamiento está bloqueado
const oyentes = new Set<() => void>();

function leer(): string {
  try {
    return localStorage.getItem(CLAVE) ?? "";
  } catch {
    return enMemoria;
  }
}

export function guardarEstado(estado: EstadoEnfoque | null) {
  const valor = estado ? JSON.stringify(estado) : "";
  enMemoria = valor;
  try {
    if (estado) localStorage.setItem(CLAVE, valor);
    else localStorage.removeItem(CLAVE);
    localStorage.removeItem("diarco-enfoque"); // formato anterior
  } catch {
    // Sin almacenamiento: la sesión vive mientras la pestaña esté abierta.
  }
  oyentes.forEach((avisar) => avisar());
}

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  window.addEventListener("storage", avisar);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("storage", avisar);
  };
}

function interpretar(crudo: string): EstadoEnfoque | null {
  if (!crudo) return null;
  try {
    const e = JSON.parse(crudo) as EstadoEnfoque;
    return e && typeof e === "object" && "fase" in e ? e : null;
  } catch {
    return null;
  }
}

/** Estado actual (null si no hay sesión). En el servidor siempre es null. */
export function useEstadoEnfoque(): EstadoEnfoque | null {
  const crudo = useSyncExternalStore(suscribir, leer, () => "");
  // useSyncExternalStore devuelve el mismo string mientras no cambie: se interpreta barato.
  return interpretar(crudo);
}

/** Lectura puntual fuera de React (en manejadores de eventos). */
export function estadoActual(): EstadoEnfoque | null {
  return interpretar(leer());
}

/** ms que quedan de una fase en curso. */
export function restante(e: EnCurso, ahora: number): number {
  return e.pausadoRestante ?? Math.max(0, e.fin - ahora);
}

/** ms transcurridos de una fase en curso. */
export function transcurrido(e: EnCurso, ahora: number): number {
  return e.minutos * 60_000 - restante(e, ahora);
}

/** La fase en curso es un cronómetro libre (cuenta hacia arriba). */
export const esLibre = (e: EnCurso) => e.fase === "enfoque" && e.plan.libre === true;

/** "MM:SS", o "H:MM:SS" desde la primera hora. */
export function reloj(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mmss = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return h > 0 ? `${h}:${mmss}` : mmss;
}

/** Lo que muestra el reloj: cuenta regresiva, o lo transcurrido en modo libre. */
export function tiempoVisible(e: EnCurso, ahora: number): string {
  return esLibre(e) ? reloj(Math.floor(transcurrido(e, ahora) / 1000) * 1000) : reloj(restante(e, ahora));
}

// --- Preferencia de sonido ambiente -------------------------------------------
export type Ambiente = "apagado" | "fogata" | "lluvia";
const CLAVE_AMBIENTE = "diarco-enfoque-ambiente";
const oyentesAmbiente = new Set<() => void>();

function leerAmbiente(): Ambiente {
  try {
    const v = localStorage.getItem(CLAVE_AMBIENTE);
    return v === "fogata" || v === "lluvia" ? v : "apagado";
  } catch {
    return "apagado";
  }
}

export function guardarAmbiente(a: Ambiente) {
  try {
    localStorage.setItem(CLAVE_AMBIENTE, a);
  } catch {
    // Se pierde al recargar, sin problema.
  }
  oyentesAmbiente.forEach((avisar) => avisar());
}

export function useAmbiente(): Ambiente {
  return useSyncExternalStore(
    (avisar) => {
      oyentesAmbiente.add(avisar);
      return () => oyentesAmbiente.delete(avisar);
    },
    leerAmbiente,
    () => "apagado",
  );
}
