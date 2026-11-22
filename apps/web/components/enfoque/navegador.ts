/**
 * Ayudas del navegador para el Modo enfoque: sonidos generados con Web Audio
 * (sin descargar archivos), notificaciones, pantalla completa y mantener la
 * pantalla encendida. Todo es "mejor esfuerzo": si el navegador no lo permite,
 * la sesión funciona igual.
 */
"use client";

import type { Ambiente } from "./estado";

// --- Audio --------------------------------------------------------------------
let contexto: AudioContext | null = null;

/** Crea o reanuda el audio. Llamarlo en un clic (los navegadores lo exigen). */
export function activarAudio() {
  try {
    contexto ??= new AudioContext();
    if (contexto.state === "suspended") void contexto.resume();
  } catch {
    contexto = null;
  }
}

/** Campana suave de dos notas (fin de sesión o de descanso). */
export function tocarCampana(alegre = true) {
  if (!contexto) return;
  const ahora = contexto.currentTime;
  const notas = alegre ? [659.25, 987.77] : [523.25, 392];
  notas.forEach((frecuencia, i) => {
    const osc = contexto!.createOscillator();
    const volumen = contexto!.createGain();
    osc.type = "sine";
    osc.frequency.value = frecuencia;
    const inicio = ahora + i * 0.22;
    volumen.gain.setValueAtTime(0, inicio);
    volumen.gain.linearRampToValueAtTime(0.25, inicio + 0.02);
    volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + 1.6);
    osc.connect(volumen).connect(contexto!.destination);
    osc.start(inicio);
    osc.stop(inicio + 1.7);
  });
}

/** Ruido marrón (grave y suave), base de la lluvia y la fogata. */
function bufferRuido(ctx: AudioContext, segundos = 3): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * segundos, ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  let ultimo = 0;
  for (let i = 0; i < datos.length; i++) {
    const blanco = Math.random() * 2 - 1;
    ultimo = (ultimo + 0.02 * blanco) / 1.02;
    datos[i] = ultimo * 3.5;
  }
  return buffer;
}

/** Empieza un sonido ambiente; devuelve la función para detenerlo. */
export function iniciarAmbiente(tipo: Exclude<Ambiente, "apagado">): () => void {
  if (!contexto) return () => {};
  const ctx = contexto;
  const salida = ctx.createGain();
  salida.gain.setValueAtTime(0, ctx.currentTime);
  salida.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5); // entra suave
  salida.connect(ctx.destination);

  const fuente = ctx.createBufferSource();
  fuente.buffer = bufferRuido(ctx);
  fuente.loop = true;
  const filtro = ctx.createBiquadFilter();
  const base = ctx.createGain();

  let chispazos: ReturnType<typeof setInterval> | null = null;
  if (tipo === "lluvia") {
    filtro.type = "bandpass";
    filtro.frequency.value = 1100;
    filtro.Q.value = 0.4;
    base.gain.value = 0.9;
  } else {
    filtro.type = "lowpass";
    filtro.frequency.value = 420;
    base.gain.value = 0.7;
    // Crepitar: chasquidos cortos y agudos al azar.
    const chasquido = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
    const d = chasquido.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
    chispazos = setInterval(() => {
      if (Math.random() > 0.45) return;
      const s = ctx.createBufferSource();
      s.buffer = chasquido;
      const g = ctx.createGain();
      g.gain.value = 0.05 + Math.random() * 0.18;
      const alto = ctx.createBiquadFilter();
      alto.type = "highpass";
      alto.frequency.value = 1200 + Math.random() * 2500;
      s.connect(alto).connect(g).connect(salida);
      s.start();
    }, 110);
  }
  fuente.connect(filtro).connect(base).connect(salida);
  fuente.start();

  return () => {
    if (chispazos) clearInterval(chispazos);
    const t = ctx.currentTime;
    salida.gain.cancelScheduledValues(t);
    salida.gain.setValueAtTime(salida.gain.value, t);
    salida.gain.linearRampToValueAtTime(0, t + 0.6);
    setTimeout(() => {
      try {
        fuente.stop();
      } catch {
        // ya estaba detenida
      }
      salida.disconnect();
    }, 700);
  };
}

// --- Notificaciones -----------------------------------------------------------
/** Pide permiso para avisar al terminar (solo la primera vez, en un clic). */
export function pedirPermisoNotificaciones() {
  try {
    if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission();
  } catch {
    // Navegador sin notificaciones.
  }
}

export function notificar(titulo: string, cuerpo: string) {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    // Si la pestaña está a la vista no hace falta: ya se ve la celebración.
    if (document.visibilityState === "visible") return;
    new Notification(titulo, { body: cuerpo, icon: "/favicon.ico", tag: "diarco-enfoque" });
  } catch {
    // En algunos móviles solo se puede notificar con service worker: se omite.
  }
}

// --- Pantalla completa --------------------------------------------------------
export function entrarPantallaCompleta() {
  try {
    if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => {});
  } catch {
    // No disponible (p. ej. iPhone): la vista ocupa toda la ventana igual.
  }
}

export function salirPantallaCompleta() {
  try {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  } catch {
    // Nada que hacer.
  }
}

// --- Pantalla encendida -------------------------------------------------------
/** Pide que la pantalla no se apague; devuelve la función para liberarlo. */
export async function mantenerPantallaEncendida(): Promise<() => void> {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    const bloqueo = await nav.wakeLock?.request("screen");
    return () => void bloqueo?.release().catch(() => {});
  } catch {
    return () => {};
  }
}
