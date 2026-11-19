"use client";

import { horaActual } from "@diarco/shared";
import { useCrearActividad, useHoy, useZonaHoraria } from "@diarco/shared/hooks";
import { Pause, Play, Square, Timer } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { SelectorCategoria } from "@/components/categorias";
import { Chispa } from "@/components/chispa";
import { Confeti } from "@/components/confeti";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campos";
import { claseTarjeta, MensajeError } from "@/components/ui/estados";

const DURACIONES = [15, 25, 45, 60];
const CLAVE = "diarco-enfoque";

/** Sesión en curso. Se guarda en el navegador para sobrevivir a recargas y cambios de pantalla. */
interface Sesion {
  descripcion: string;
  minutos: number;
  categoria_id: number | null;
  fecha: string; // día en que empezó (zona del usuario)
  horaInicio: string; // "HH:MM"
  fin: number; // instante (ms) en que termina si no se pausa
  pausadoRestante: number | null; // ms que quedaban al pausar
}

// --- Almacenamiento de la sesión (una por navegador) ---------------------------
let sesionEnMemoria = ""; // respaldo si el almacenamiento está bloqueado
const oyentes = new Set<() => void>();
function leer(): string {
  try {
    return localStorage.getItem(CLAVE) ?? "";
  } catch {
    return sesionEnMemoria;
  }
}
function escribir(sesion: Sesion | null) {
  const valor = sesion ? JSON.stringify(sesion) : "";
  sesionEnMemoria = valor;
  try {
    if (sesion) localStorage.setItem(CLAVE, valor);
    else localStorage.removeItem(CLAVE);
  } catch {
    // Sin almacenamiento: la sesión vive solo mientras la pestaña esté abierta.
  }
  oyentes.forEach((avisar) => avisar());
}
function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  window.addEventListener("storage", avisar); // otra pestaña empezó o terminó una sesión
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("storage", avisar);
  };
}

const mmss = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

/**
 * Temporizador de enfoque: eliges en qué y cuánto tiempo; al terminar, Chispa
 * celebra y la sesión se anota sola en la Bitácora con su duración.
 */
export function Enfoque() {
  const hoy = useHoy();
  const zona = useZonaHoraria();
  const crear = useCrearActividad();
  const crudo = useSyncExternalStore(suscribir, leer, () => "");
  const sesion: Sesion | null = crudo ? (JSON.parse(crudo) as Sesion) : null;

  const [ahora, setAhora] = useState<number | null>(null);
  const [resultado, setResultado] = useState<{ minutos: number; descripcion: string } | null>(null);
  const [deteniendo, setDeteniendo] = useState(false);
  const titulo = useRef<string | null>(null);

  // Formulario
  const [descripcion, setDescripcion] = useState("");
  const [minutos, setMinutos] = useState(25);
  const [categoria, setCategoria] = useState<number | null>(null);
  const [error, setError] = useState<string>();

  /** Cierra la sesión y la anota en la bitácora (si hubo al menos 1 minuto). */
  function finalizar(s: Sesion, minutosHechos: number) {
    escribir(null);
    setDeteniendo(false);
    if (titulo.current !== null) document.title = titulo.current;
    if (minutosHechos < 1) return;
    crear.mutate({
      fecha: s.fecha,
      hora: s.horaInicio,
      descripcion: s.descripcion,
      minutos: minutosHechos,
      categoria_id: s.categoria_id,
    });
    setResultado({ minutos: minutosHechos, descripcion: s.descripcion });
  }

  // Reloj: avanza mientras haya una sesión corriendo; termina sola al llegar a cero.
  const corriendo = sesion !== null && sesion.pausadoRestante === null;
  useEffect(() => {
    if (!crudo) return;
    const s = JSON.parse(crudo) as Sesion;
    if (s.pausadoRestante !== null) return;
    titulo.current ??= document.title;
    const intervalo = setInterval(() => {
      const t = Date.now();
      setAhora(t);
      document.title = `⏱ ${mmss(s.fin - t)} · Diarco`;
      if (t >= s.fin) finalizar(s, s.minutos);
    }, 250);
    return () => clearInterval(intervalo);
    // finalizar usa solo setters estables y la mutación; se re-arma cuando cambia la sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crudo]);

  function empezar(evento: FormEvent) {
    evento.preventDefault();
    const texto = descripcion.trim();
    if (!texto) return setError("¿En qué te vas a enfocar?");
    setError(undefined);
    setResultado(null);
    escribir({
      descripcion: texto.slice(0, 500),
      minutos,
      categoria_id: categoria,
      fecha: hoy,
      horaInicio: horaActual(zona),
      fin: Date.now() + minutos * 60_000,
      pausadoRestante: null,
    });
  }

  const restante = !sesion
    ? 0
    : sesion.pausadoRestante !== null
      ? sesion.pausadoRestante
      : ahora === null
        ? sesion.minutos * 60_000
        : sesion.fin - ahora;
  const avance = sesion ? 1 - restante / (sesion.minutos * 60_000) : 0;
  const minutosHechos = sesion ? Math.floor((sesion.minutos * 60_000 - restante) / 60_000) : 0;

  return (
    <section aria-labelledby="titulo-enfoque" className={`${claseTarjeta} p-4`}>
      <h2 id="titulo-enfoque" className="mb-3 flex items-center gap-2 font-titulo text-xl font-bold">
        <Timer className="size-5 text-violeta-texto" strokeWidth={2.5} aria-hidden />
        Modo enfoque
      </h2>
      {crear.error && (
        <div className="mb-3">
          <MensajeError error={crear.error} />
        </div>
      )}

      {sesion ? (
        // --- Sesión en curso o en pausa ---
        <div className="space-y-3 text-center">
          <p className="truncate font-bold text-texto-suave">{sesion.descripcion}</p>
          <p className="font-titulo text-6xl leading-none font-extrabold tabular-nums" role="timer" aria-live="off">
            {mmss(restante)}
          </p>
          <div
            className="h-3 overflow-hidden rounded-full bg-superficie-2"
            role="progressbar"
            aria-valuenow={Math.round(avance * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Avance de la sesión"
          >
            <div className="h-full rounded-full bg-violeta transition-[width] duration-300" style={{ width: `${avance * 100}%` }} />
          </div>

          {deteniendo ? (
            <div className="space-y-2 rounded-2xl bg-superficie p-3">
              <p className="font-bold">
                {minutosHechos >= 1 ? `Llevas ${minutosHechos} min. ¿Los guardo en tu bitácora?` : "Aún no llegas a un minuto."}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {minutosHechos >= 1 && (
                  <Boton variante="exito" onClick={() => finalizar(sesion, minutosHechos)}>
                    Guardar {minutosHechos} min
                  </Boton>
                )}
                <Boton variante="secundario" onClick={() => finalizar(sesion, 0)}>
                  Descartar
                </Boton>
                <Boton variante="fantasma" onClick={() => setDeteniendo(false)}>
                  Seguir
                </Boton>
              </div>
            </div>
          ) : (
            <div className="flex justify-center gap-2">
              {corriendo ? (
                <Boton variante="secundario" onClick={() => escribir({ ...sesion, pausadoRestante: Math.max(0, sesion.fin - Date.now()) })}>
                  <Pause className="size-5" strokeWidth={2.5} aria-hidden />
                  Pausar
                </Boton>
              ) : (
                <Boton onClick={() => escribir({ ...sesion, fin: Date.now() + (sesion.pausadoRestante ?? 0), pausadoRestante: null })}>
                  <Play className="size-5" strokeWidth={2.5} aria-hidden />
                  Seguir
                </Boton>
              )}
              <Boton variante="fantasma" onClick={() => setDeteniendo(true)}>
                <Square className="size-4" strokeWidth={2.5} aria-hidden />
                Terminar
              </Boton>
            </div>
          )}
        </div>
      ) : resultado ? (
        // --- Recién terminada ---
        <div className="flex flex-col items-center gap-2 text-center" role="status">
          <div className="relative">
            <Chispa estado="celebrando" tamano={72} />
            <Confeti piezas={18} alcance={70} />
          </div>
          <p className="font-titulo text-2xl font-extrabold text-violeta-texto">¡{resultado.minutos} min de enfoque!</p>
          <p className="text-sm font-bold text-texto-suave">
            Lo anoté en tu{" "}
            <Link href="/bitacora" className="text-violeta-texto underline underline-offset-4">
              bitácora
            </Link>{" "}
            📓
          </p>
          <Boton onClick={() => setResultado(null)}>Otra sesión</Boton>
        </div>
      ) : (
        // --- Elegir sesión ---
        <form onSubmit={empezar} className="space-y-3" noValidate>
          <Campo
            etiqueta="¿En qué te vas a enfocar?"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej. Repasar para el examen"
            maxLength={500}
            error={error}
          />
          <fieldset>
            <legend className="mb-2 text-sm font-extrabold">¿Cuánto tiempo?</legend>
            <div className="flex flex-wrap gap-2">
              {DURACIONES.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={minutos === m}
                  onClick={() => setMinutos(m)}
                  className="inline-flex min-h-11 items-center rounded-full border-2 border-b-4 border-borde bg-tarjeta px-4 font-bold transition-transform duration-100 active:translate-y-[2px] active:border-b-2 aria-pressed:border-violeta aria-pressed:bg-violeta-suave aria-pressed:text-violeta-texto"
                >
                  {m} min
                </button>
              ))}
            </div>
          </fieldset>
          <SelectorCategoria valor={categoria} onCambiar={setCategoria} />
          <Boton type="submit" className="w-full">
            <Play className="size-5" strokeWidth={2.5} aria-hidden />
            Empezar
          </Boton>
        </form>
      )}
    </section>
  );
}
