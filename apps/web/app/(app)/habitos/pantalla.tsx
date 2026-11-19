"use client";

import type { Habito } from "@diarco/shared";
import { useHabitos, useRachas } from "@diarco/shared/hooks";
import { Pencil, Plus, Sparkles, Trophy } from "lucide-react";
import { useState } from "react";
import { InsigniaRacha } from "@/components/racha";
import { Boton } from "@/components/ui/boton";
import { Dialogo } from "@/components/ui/dialogo";
import { CargandoLista, Encabezado, EstadoVacio, MensajeError } from "@/components/ui/estados";
import { describirDias } from "@/lib/formato";
import { FormularioHabito } from "./formulario-habito";

type Edicion = { modo: "nuevo" } | { modo: "editar"; habito: Habito } | null;

export function PantallaHabitos() {
  const habitos = useHabitos();
  const { data: rachas } = useRachas();
  const [edicion, setEdicion] = useState<Edicion>(null);

  const botonNuevo = (
    <Boton onClick={() => setEdicion({ modo: "nuevo" })}>
      <Plus className="size-4" aria-hidden />
      Nuevo
    </Boton>
  );

  return (
    <>
      <Encabezado titulo="Hábitos" subtitulo="Lo que quieres repetir y en qué días." accion={botonNuevo} />

      {habitos.isPending ? (
        <CargandoLista filas={4} alto="h-20" />
      ) : habitos.error ? (
        <MensajeError error={habitos.error} onReintentar={() => habitos.refetch()} />
      ) : habitos.data.length === 0 ? (
        <EstadoVacio
          icono={<Sparkles className="size-6" />}
          titulo="Crea tu primer hábito"
          descripcion="Elige algo pequeño que quieras hacer cada día o algunos días de la semana. Cada día cumplido suma a tu racha."
          accion={botonNuevo}
        />
      ) : (
        <ul className="space-y-3">
          {habitos.data.map((habito) => {
            const racha = rachas?.porHabito.get(habito.id);
            return (
              <li
                key={habito.id}
                className={`flex items-center gap-4 rounded-2xl border border-borde bg-superficie p-4 ${
                  habito.activo ? "" : "opacity-60"
                }`}
              >
                <span
                  className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                  style={{ backgroundColor: `${habito.color}22` }}
                  aria-hidden
                >
                  {habito.icono}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{habito.nombre}</p>
                  <p className="truncate text-sm text-texto-suave">
                    {habito.activo ? describirDias(habito.dias_semana) : "Pausado"}
                    {habito.meta ? ` · ${habito.meta}` : ""}
                  </p>
                </div>
                {habito.activo && racha && (
                  <div className="flex flex-col items-end gap-0.5">
                    <InsigniaRacha dias={racha.actual} />
                    <span className="inline-flex items-center gap-1 text-xs text-texto-suave" title="Mejor racha">
                      <Trophy className="size-3" aria-hidden />
                      <span className="sr-only">Mejor racha:</span>
                      {racha.maxima}
                    </span>
                  </div>
                )}
                <Boton
                  variante="fantasma"
                  icono
                  aria-label={`Editar ${habito.nombre}`}
                  onClick={() => setEdicion({ modo: "editar", habito })}
                >
                  <Pencil className="size-4" aria-hidden />
                </Boton>
              </li>
            );
          })}
        </ul>
      )}

      <Dialogo
        abierto={edicion !== null}
        onCerrar={() => setEdicion(null)}
        titulo={edicion?.modo === "editar" ? "Editar hábito" : "Nuevo hábito"}
      >
        {edicion && (
          <FormularioHabito
            key={edicion.modo === "editar" ? edicion.habito.id : "nuevo"}
            habito={edicion.modo === "editar" ? edicion.habito : undefined}
            onListo={() => setEdicion(null)}
          />
        )}
      </Dialogo>
    </>
  );
}
