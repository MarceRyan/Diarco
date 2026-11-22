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

/** Tic corto de cuenta regresiva (el último, más agudo). */
export function tocarTic(ultimo = false) {
  if (!contexto) return;
  const t = contexto.currentTime;
  const osc = contexto.createOscillator();
  const volumen = contexto.createGain();
  osc.type = "triangle";
  osc.frequency.value = ultimo ? 1320 : 880;
  volumen.gain.setValueAtTime(0, t);
  volumen.gain.linearRampToValueAtTime(0.18, t + 0.005);
  volumen.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  osc.connect(volumen).connect(contexto.destination);
  osc.start(t);
  osc.stop(t + 0.15);
}

/** Ruido en bucle: marrón (grave, para el fuego) o rosa (más parejo, para la lluvia). */
function bufferRuido(ctx: AudioContext, tipo: "marron" | "rosa", segundos = 4): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * segundos, ctx.sampleRate);
  const d = buffer.getChannelData(0);
  let ultimo = 0;
  let [b0, b1, b2, b3, b4, b5, b6] = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    if (tipo === "marron") {
      ultimo = (ultimo + 0.02 * w) / 1.02;
      d[i] = ultimo * 3.5;
    } else {
      // Ruido rosa (filtro de Paul Kellet).
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  }
  return buffer;
}

/** Fuente de ruido en bucle → filtros → volumen. */
function capa(ctx: AudioContext, salida: AudioNode, tipo: "marron" | "rosa", filtros: [BiquadFilterType, number, number?][], volumen: number) {
  const fuente = ctx.createBufferSource();
  fuente.buffer = bufferRuido(ctx, tipo);
  fuente.loop = true;
  let nodo: AudioNode = fuente;
  for (const [t, frecuencia, q] of filtros) {
    const f = ctx.createBiquadFilter();
    f.type = t;
    f.frequency.value = frecuencia;
    if (q) f.Q.value = q;
    nodo = nodo.connect(f);
  }
  const g = ctx.createGain();
  g.gain.value = volumen;
  nodo.connect(g).connect(salida);
  fuente.start();
  return { fuente, volumen: g };
}

/** Golpecitos cortos al azar (chasquidos de leña o gotas en el vidrio). */
function golpes(
  ctx: AudioContext,
  salida: AudioNode,
  o: { cada: number; prob: number; dur: number; filtro: BiquadFilterType; desde: number; hasta: number; vol: [number, number]; curva?: number },
) {
  const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * o.dur), ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** (o.curva ?? 3);
  const id = setInterval(() => {
    if (Math.random() > o.prob) return;
    const s = ctx.createBufferSource();
    s.buffer = b;
    s.playbackRate.value = 0.7 + Math.random() * 0.8;
    const f = ctx.createBiquadFilter();
    f.type = o.filtro;
    f.frequency.value = o.desde + Math.random() * (o.hasta - o.desde);
    const g = ctx.createGain();
    g.gain.value = o.vol[0] + Math.random() * (o.vol[1] - o.vol[0]);
    s.connect(f).connect(g).connect(salida);
    s.start();
  }, o.cada);
  return () => clearInterval(id);
}

/**
 * Empieza un sonido ambiente; devuelve la función para detenerlo.
 *  - fogata: "chimenea cálida", rumor grave que respira con pocos chasquidos suaves.
 *  - lluvia: "lluvia en la ventana", lluvia de fondo con gotas que golpean el vidrio.
 */
export function iniciarAmbiente(tipo: Exclude<Ambiente, "apagado">): () => void {
  if (!contexto) return () => {};
  const ctx = contexto;
  const salida = ctx.createGain();
  salida.gain.setValueAtTime(0, ctx.currentTime);
  salida.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5); // entra suave
  salida.connect(ctx.destination);

  const fuentes: AudioBufferSourceNode[] = [];
  const limpiezas: (() => void)[] = [];

  if (tipo === "fogata") {
    const rumor = capa(ctx, salida, "marron", [["lowpass", 260]], 0.9);
    fuentes.push(rumor.fuente);
    // El fuego "respira": el volumen sube y baja lento (ciclo de 7 s).
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 1 / 7;
    const profundidad = ctx.createGain();
    profundidad.gain.value = 0.15;
    rumor.volumen.gain.value = 0.85;
    lfo.connect(profundidad).connect(rumor.volumen.gain);
    lfo.start();
    limpiezas.push(() => lfo.stop());
    limpiezas.push(golpes(ctx, salida, { cada: 180, prob: 0.25, dur: 0.025, filtro: "bandpass", desde: 900, hasta: 2200, vol: [0.03, 0.1] }));
  } else {
    fuentes.push(capa(ctx, salida, "rosa", [["bandpass", 1500, 0.5]], 0.25).fuente);
    limpiezas.push(golpes(ctx, salida, { cada: 45, prob: 0.55, dur: 0.018, filtro: "bandpass", desde: 1800, hasta: 4500, vol: [0.04, 0.16], curva: 4 }));
    limpiezas.push(golpes(ctx, salida, { cada: 300, prob: 0.4, dur: 0.05, filtro: "lowpass", desde: 500, hasta: 1100, vol: [0.08, 0.2], curva: 6 }));
  }

  return () => {
    limpiezas.forEach((f) => f());
    const t = ctx.currentTime;
    salida.gain.cancelScheduledValues(t);
    salida.gain.setValueAtTime(salida.gain.value, t);
    salida.gain.linearRampToValueAtTime(0, t + 0.6);
    setTimeout(() => {
      fuentes.forEach((f) => {
        try {
          f.stop();
        } catch {
          // ya estaba detenida
        }
      });
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
    new Notification(titulo, { body: cuerpo, icon: "/chispa-192.png", tag: "diarco-enfoque" });
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
