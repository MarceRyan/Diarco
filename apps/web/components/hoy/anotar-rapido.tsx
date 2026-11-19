"use client";

import { horaActual } from "@diarco/shared";
import { useCrearActividad, useHoy, useZonaHoraria } from "@diarco/shared/hooks";
import { NotebookPen } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { claseTarjeta } from "@/components/ui/estados";

/** Anota algo en la bitácora con la hora actual, sin salir de Hoy. */
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
    <section aria-labelledby="titulo-anotar" className={`${claseTarjeta} p-4`}>
      <h2 id="titulo-anotar" className="mb-3 flex items-center gap-2 font-titulo text-xl font-bold">
        <NotebookPen className="size-5 text-violeta-texto" strokeWidth={2.5} aria-hidden />
        Anotar rápido
      </h2>
      <form onSubmit={anotar} className="flex gap-2">
        <label htmlFor="anotar-rapido" className="sr-only">
          ¿Qué estás haciendo?
        </label>
        <input
          id="anotar-rapido"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAnotado(null);
          }}
          maxLength={500}
          placeholder="¿Qué estás haciendo?"
          className="min-h-12 min-w-0 flex-1 rounded-2xl border-2 border-borde bg-superficie px-4 font-semibold placeholder:font-medium placeholder:text-texto-suave/80 focus:border-violeta focus:bg-tarjeta focus:outline-none"
        />
        <Boton type="submit" cargando={crear.isPending} disabled={!texto.trim()}>
          Anotar
        </Boton>
      </form>
      <p className="mt-2 min-h-5 text-sm font-bold" aria-live="polite">
        {crear.error ? (
          <span className="text-peligro-texto">¡Uy! {crear.error.message}</span>
        ) : anotado ? (
          <span className="text-verde-texto">
            ¡Anotado a las {anotado}! 📝{" "}
            <Link href="/bitacora" className="text-violeta-texto underline underline-offset-4">
              Ver bitácora
            </Link>
          </span>
        ) : (
          <span className="text-texto-suave">Se guarda en tu bitácora con la hora actual.</span>
        )}
      </p>
    </section>
  );
}
