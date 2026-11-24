"use client";

import type { Rutina } from "@diarco/shared";
import { useRutinas } from "@diarco/shared/hooks";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Boton } from "@/components/ui/boton";
import { Dialogo } from "@/components/ui/dialogo";
import { CargandoLista, claseTarjeta, MensajeError } from "@/components/ui/estados";
import { describirDias } from "@/lib/formato";
import { TiraRutina } from "@/components/tira-rutina";
import { FormularioRutina } from "./formulario-rutina";

type Edicion = { modo: "nuevo" } | { modo: "editar"; rutina: Rutina } | null;

/** Tu rutina: tareas que se repiten sin hora ni racha, debajo de los hábitos. */
export function SeccionRutina() {
  const rutinas = useRutinas();
  const [edicion, setEdicion] = useState<Edicion>(null);

  return (
    <section id="rutina" aria-labelledby="titulo-rutina" className="scroll-mt-24">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="titulo-rutina" className="font-titulo text-2xl font-bold">
            Tu rutina
          </h2>
          <p className="text-texto-suave">Tareas de cada día sin hora ni racha: tender la cama, lavar los platos…</p>
        </div>
        <Boton variante="secundario" onClick={() => setEdicion({ modo: "nuevo" })}>
          <Plus className="size-5" strokeWidth={3} aria-hidden />
          Nueva tarea
        </Boton>
      </div>

      {rutinas.isPending ? (
        <CargandoLista filas={2} alto="h-16" />
      ) : rutinas.error ? (
        <MensajeError error={rutinas.error} onReintentar={() => rutinas.refetch()} />
      ) : rutinas.data.length === 0 ? (
        <button
          type="button"
          onClick={() => setEdicion({ modo: "nuevo" })}
          className={`${claseTarjeta} flex w-full items-center gap-3 border-dashed p-4 text-left text-texto-suave hover:border-borde-fuerte hover:text-texto`}
        >
          <span className="text-2xl" aria-hidden>
            🛏️
          </span>
          <span>Agrega tu primera tarea, como «Tender la cama». Aparecerá en Hoy los días que elijas.</span>
        </button>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rutinas.data.map((r) => (
            <li key={r.id} className={`${claseTarjeta} space-y-3 p-4 ${r.activo ? "" : "opacity-70"}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden>
                  {r.icono}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{r.nombre}</span>
                  <span className="block truncate text-sm text-texto-suave">{r.activo ? describirDias(r.dias_semana) : "En pausa"}</span>
                </span>
                <Boton variante="fantasma" icono aria-label={`Editar ${r.nombre}`} onClick={() => setEdicion({ modo: "editar", rutina: r })}>
                  <Pencil className="size-5" strokeWidth={2.5} aria-hidden />
                </Boton>
              </div>
              {/* Historial: últimos 7 días, tocables para corregir olvidos */}
              {r.activo && <TiraRutina rutina={r} />}
            </li>
          ))}
        </ul>
      )}

      <Dialogo
        abierto={edicion !== null}
        onCerrar={() => setEdicion(null)}
        titulo={edicion?.modo === "editar" ? "Editar tarea de la rutina" : "Nueva tarea de la rutina"}
      >
        {edicion && (
          <FormularioRutina
            key={edicion.modo === "editar" ? edicion.rutina.id : "nuevo"}
            rutina={edicion.modo === "editar" ? edicion.rutina : undefined}
            onListo={() => setEdicion(null)}
          />
        )}
      </Dialogo>
    </section>
  );
}
