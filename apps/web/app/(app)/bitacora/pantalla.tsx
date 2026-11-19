"use client";

import { compararFechas, esFechaValida, minutosPorCategoria, sumarDias, type Actividad } from "@diarco/shared";
import { useActividades, useCategorias, useHoy } from "@diarco/shared/hooks";
import { ChevronLeft, ChevronRight, NotebookPen, Plus } from "lucide-react";
import { useState } from "react";
import { ChipCategoria } from "@/components/categorias";
import { Boton } from "@/components/ui/boton";
import { Dialogo } from "@/components/ui/dialogo";
import { CargandoLista, Encabezado, EstadoVacio, MensajeError } from "@/components/ui/estados";
import { duracion, fechaLarga, horaCorta } from "@/lib/formato";
import { FormularioActividad } from "./formulario-actividad";

type Edicion = { actividad?: Actividad } | null;

export function PantallaBitacora() {
  const hoy = useHoy();
  const [fecha, setFecha] = useState(hoy);
  const actividades = useActividades(fecha);
  const { data: categorias = [] } = useCategorias();
  const [edicion, setEdicion] = useState<Edicion>(null);

  const esHoy = fecha === hoy;
  const totalMinutos = (actividades.data ?? []).reduce((t, a) => t + (a.minutos ?? 0), 0);
  const porCategoria = minutosPorCategoria(actividades.data ?? []).filter((g) => g.minutos > 0);

  const botonNuevo = (
    <Boton onClick={() => setEdicion({})}>
      <Plus className="size-4" aria-hidden />
      Actividad
    </Boton>
  );

  return (
    <>
      <Encabezado titulo="Bitácora" subtitulo="Lo que hiciste, día a día." accion={botonNuevo} />

      {/* Navegación entre días */}
      <div className="mb-6 flex items-center gap-2">
        <Boton variante="secundario" icono aria-label="Día anterior" onClick={() => setFecha(sumarDias(fecha, -1))}>
          <ChevronLeft className="size-5" aria-hidden />
        </Boton>
        <label className="relative flex min-h-11 flex-1 items-center justify-center rounded-xl border border-borde px-3 text-sm font-medium first-letter:uppercase">
          <span aria-hidden className="first-letter:uppercase">
            {esHoy ? "Hoy" : fechaLarga(fecha)}
          </span>
          <span className="sr-only">Elegir fecha</span>
          <input
            type="date"
            value={fecha}
            max={hoy}
            onChange={(e) => esFechaValida(e.target.value) && setFecha(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <Boton
          variante="secundario"
          icono
          aria-label="Día siguiente"
          disabled={compararFechas(fecha, hoy) >= 0}
          onClick={() => setFecha(sumarDias(fecha, 1))}
        >
          <ChevronRight className="size-5" aria-hidden />
        </Boton>
        {!esHoy && (
          <Boton variante="fantasma" onClick={() => setFecha(hoy)}>
            Hoy
          </Boton>
        )}
      </div>

      {actividades.isPending ? (
        <CargandoLista filas={3} />
      ) : actividades.error ? (
        <MensajeError error={actividades.error} onReintentar={() => actividades.refetch()} />
      ) : actividades.data.length === 0 ? (
        <EstadoVacio
          icono={<NotebookPen className="size-6" />}
          titulo={esHoy ? "¿Qué hiciste hoy?" : "Sin actividades este día"}
          descripcion="Anota lo que haces: trabajo, estudio, ejercicio o un buen momento. Con el tiempo verás en qué se va tu tiempo."
          accion={botonNuevo}
        />
      ) : (
        <>
          {totalMinutos > 0 && (
            <section aria-label="Resumen del día" className="mb-4 rounded-2xl bg-violeta-suave p-4">
              <p className="text-sm text-texto-suave">Tiempo registrado</p>
              <p className="font-titulo text-2xl font-bold text-violeta">{duracion(totalMinutos)}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {porCategoria.map((g) => {
                  const categoria = categorias.find((c) => c.id === g.categoria_id);
                  return (
                    <li key={g.categoria_id ?? "sin"} className="text-xs text-texto-suave">
                      <ChipCategoria categoria={categoria ?? { nombre: "Sin categoría", color: "#868e96" }} />{" "}
                      {duracion(g.minutos)}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          <ol className="space-y-2">
            {actividades.data.map((a) => {
              const categoria = categorias.find((c) => c.id === a.categoria_id);
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setEdicion({ actividad: a })}
                    className="flex w-full gap-4 rounded-2xl border border-borde p-4 text-left transition hover:bg-superficie"
                  >
                    <span className="w-12 shrink-0 pt-0.5 text-sm font-medium tabular-nums text-texto-suave">
                      {a.hora ? horaCorta(a.hora) : "—"}
                    </span>
                    <span className="min-w-0 flex-1 space-y-1.5">
                      <span className="block break-words">{a.descripcion}</span>
                      <span className="flex flex-wrap items-center gap-2 text-xs text-texto-suave">
                        {categoria && <ChipCategoria categoria={categoria} />}
                        {a.minutos && <span>{duracion(a.minutos)}</span>}
                      </span>
                    </span>
                    <span className="sr-only">Editar</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </>
      )}

      <Dialogo
        abierto={edicion !== null}
        onCerrar={() => setEdicion(null)}
        titulo={edicion?.actividad ? "Editar actividad" : "Nueva actividad"}
      >
        {edicion && (
          <FormularioActividad
            key={edicion.actividad?.id ?? `nueva-${fecha}`}
            actividad={edicion.actividad}
            fecha={fecha}
            onListo={() => setEdicion(null)}
          />
        )}
      </Dialogo>
    </>
  );
}
