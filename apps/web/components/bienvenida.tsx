"use client";

import { MAX_SUGERENCIAS, SUGERENCIAS_HABITOS } from "@diarco/shared";
import { useCrearHabitos } from "@diarco/shared/hooks";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Chispa } from "./chispa";
import { Boton } from "./ui/boton";
import { claseTarjeta, MensajeError } from "./ui/estados";

type Sugerencia = (typeof SUGERENCIAS_HABITOS)[number];

const FRECUENCIAS = [
  { id: "todos", titulo: "Todos los días", detalle: "Lo ideal para crear la costumbre", dias: [0, 1, 2, 3, 4, 5, 6] },
  { id: "semana", titulo: "De lunes a viernes", detalle: "Y los fines de semana descansas", dias: [1, 2, 3, 4, 5] },
] as const;

/**
 * Primera experiencia: Chispa ayuda a crear los primeros hábitos en dos pasos.
 * Se muestra en Hoy mientras el usuario no tenga ningún hábito.
 */
export function Bienvenida({ nombre }: { nombre?: string }) {
  const crear = useCrearHabitos();
  const [paso, setPaso] = useState<1 | 2>(1);
  const [elegidos, setElegidos] = useState<Sugerencia[]>([]);

  const alternar = (s: Sugerencia) =>
    setElegidos((lista) =>
      lista.includes(s) ? lista.filter((x) => x !== s) : lista.length < MAX_SUGERENCIAS ? [...lista, s] : lista,
    );

  function terminar(dias: readonly number[]) {
    // Una sola petición: al existir hábitos, Hoy reemplaza esta bienvenida por la lista para marcar.
    crear.mutate(
      elegidos.map((s) => ({
        nombre: s.nombre,
        icono: s.icono,
        color: s.color,
        meta: s.meta,
        dias_semana: [...dias],
        activo: true,
      })),
    );
  }
  const creando = crear.isPending;

  return (
    <section aria-labelledby="titulo-bienvenida" className={`${claseTarjeta} overflow-hidden`}>
      <div className="flex items-center gap-4 bg-mandarina-suave px-5 py-5 sm:px-6">
        <Chispa estado="feliz" tamano={84} className="shrink-0" />
        <div>
          <h2 id="titulo-bienvenida" className="font-titulo text-3xl leading-tight font-extrabold text-mandarina-texto">
            {nombre ? `¡Hola, ${nombre}! Soy Chispa` : "¡Hola! Soy Chispa"}
          </h2>
          <p className="mt-1 font-bold">
            {paso === 1
              ? "Voy a contar tus días seguidos. ¿Con qué quieres empezar? Elige hasta 3."
              : "¡Buena elección! ¿Cuándo los quieres hacer?"}
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {/* Indicador de pasos */}
        <div className="flex items-center gap-2" aria-label={`Paso ${paso} de 2`}>
          {[1, 2].map((n) => (
            <span key={n} className={`h-2.5 flex-1 rounded-full ${n <= paso ? "bg-mandarina" : "bg-superficie-2"}`} />
          ))}
        </div>

        {crear.error && <MensajeError error={crear.error} />}

        {paso === 1 ? (
          <>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Hábitos sugeridos">
              {SUGERENCIAS_HABITOS.map((s) => {
                const elegido = elegidos.includes(s);
                const lleno = !elegido && elegidos.length >= MAX_SUGERENCIAS;
                return (
                  <li key={s.nombre}>
                    <button
                      type="button"
                      aria-pressed={elegido}
                      disabled={lleno}
                      onClick={() => alternar(s)}
                      className="relative flex min-h-28 w-full flex-col items-center justify-center gap-1 rounded-[20px] border-2 border-b-4 border-borde bg-tarjeta p-3 text-center transition-transform duration-100 active:translate-y-[2px] active:border-b-2 disabled:opacity-40 aria-pressed:border-verde-labio aria-pressed:bg-verde-suave"
                    >
                      {elegido && (
                        <span className="absolute top-2 right-2 flex size-6 animate-pop items-center justify-center rounded-full bg-verde text-white" aria-hidden>
                          <Check className="size-4" strokeWidth={3.5} />
                        </span>
                      )}
                      <span className="text-3xl" aria-hidden>
                        {s.icono}
                      </span>
                      <span className="font-titulo text-lg leading-tight font-bold">{s.nombre}</span>
                      <span className="text-xs font-bold text-texto-suave">{s.meta}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
              <Link href="/habitos" className="min-h-11 content-center font-extrabold text-violeta-texto">
                Prefiero crear el mío
              </Link>
              <Boton grande disabled={elegidos.length === 0} onClick={() => setPaso(2)} className="w-full sm:w-auto">
                {elegidos.length === 0 ? "Elige al menos uno" : `Continuar con ${elegidos.length}`}
              </Boton>
            </div>
          </>
        ) : (
          <>
            <p className="flex flex-wrap gap-2" aria-label="Hábitos elegidos">
              {elegidos.map((s) => (
                <span key={s.nombre} className="inline-flex items-center gap-1.5 rounded-full bg-verde-suave px-3 py-1 font-bold text-verde-texto">
                  <span aria-hidden>{s.icono}</span>
                  {s.nombre}
                </span>
              ))}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {FRECUENCIAS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  disabled={creando}
                  onClick={() => terminar(f.dias)}
                  className="flex min-h-20 flex-col items-start justify-center rounded-[20px] border-2 border-b-4 border-borde bg-tarjeta px-5 py-3 text-left transition-transform duration-100 hover:border-violeta/50 active:translate-y-[2px] active:border-b-2 disabled:opacity-50"
                >
                  <span className="font-titulo text-xl font-bold">{f.titulo}</span>
                  <span className="text-texto-suave">{f.detalle}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <Boton variante="fantasma" onClick={() => setPaso(1)} disabled={creando}>
                <ArrowLeft className="size-5" strokeWidth={2.5} aria-hidden />
                Volver
              </Boton>
              {creando && (
                <p role="status" className="font-extrabold text-texto-suave">
                  Preparando tus hábitos…
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
