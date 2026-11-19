"use client";

import { horaActual } from "@diarco/shared";
import { useCrearActividad, useHoy, useZonaHoraria } from "@diarco/shared/hooks";
import { NotebookPen } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";

/**
 * Anota algo en la bitácora con la hora actual, sin salir de Hoy.
 * Va dentro de la tarjeta "Tu día", debajo de la agenda.
 */
export function AnotarRapido() {
  const hoy = useHoy();
  const zona = useZonaHoraria();
  const crear = useCrearActividad();
  const [texto, setTexto] = useState("");
  const [anotado, setAnotado] = useState<string | null>(null);

  function anotar(evento: FormEvent) {
    evento.preventDefault();
    const descripcion = texto.trim();
    if (!descripcion) return;
    const hora = horaActual(zona);
    crear.mutate(
      { fecha: hoy, hora, descripcion: descripcion.slice(0, 500), minutos: null, categoria_id: null },
      {
        onSuccess: () => {
          setTexto("");
          setAnotado(hora);
        },
      },
    );
  }

  return (
    <div>
      <form onSubmit={anotar} className="flex gap-2">
        <label htmlFor="anotar-rapido" className="sr-only">
          ¿Qué estás haciendo? Se guarda en tu bitácora con la hora actual
        </label>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violeta-suave text-violeta-texto" aria-hidden>
          <NotebookPen className="size-5" strokeWidth={2.5} />
        </span>
        <input
          id="anotar-rapido"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAnotado(null);
          }}
          maxLength={500}
          placeholder="¿Qué estás haciendo? Anótalo…"
          className="min-h-12 min-w-0 flex-1 rounded-2xl border-2 border-borde bg-superficie px-4 font-semibold placeholder:font-medium placeholder:text-texto-suave/80 focus:border-violeta focus:bg-tarjeta focus:outline-none"
        />
        <Boton type="submit" cargando={crear.isPending} disabled={!texto.trim()}>
          Anotar
        </Boton>
      </form>
      {(crear.error || anotado) && (
        <p className="mt-2 pl-14 text-sm font-bold" aria-live="polite">
          {crear.error ? (
            <span className="text-peligro-texto">¡Uy! {crear.error.message}</span>
          ) : (
            <span className="text-verde-texto">
              ¡Anotado a las {anotado}! 📝{" "}
              <Link href="/bitacora" className="text-violeta-texto underline underline-offset-4">
                Ver bitácora
              </Link>
            </span>
          )}
        </p>
      )}
    </div>
  );
}
