"use client";

import { compararFechas, esFechaValida, minutosPorCategoria, sumarDias, type Actividad } from "@diarco/shared";
import { useActividades, useCategorias, useHoy } from "@diarco/shared/hooks";
import { CalendarDays, ChevronLeft, ChevronRight, NotebookPen, Plus } from "lucide-react";
import { useState } from "react";
import { ChipCategoria } from "@/components/categorias";
import { Boton } from "@/components/ui/boton";
import { Dialogo } from "@/components/ui/dialogo";
import { CargandoLista, claseTarjeta, Encabezado, EstadoVacio, MensajeError } from "@/components/ui/estados";
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
  const esAyer = fecha === sumarDias(hoy, -1);
  const totalMinutos = (actividades.data ?? []).reduce((t, a) => t + (a.minutos ?? 0), 0);
  const porCategoria = minutosPorCategoria(actividades.data ?? []).filter((g) => g.minutos > 0);

  const botonNuevo = (
    <Boton onClick={() => setEdicion({})}>
      <Plus className="size-5" strokeWidth={3} aria-hidden />
      Anotar algo
    </Boton>
  );

  return (
    <>
      <Encabezado titulo="Tu bitácora" subtitulo="Lo que hiciste, día a día." accion={botonNuevo} />

      {/* Navegación entre días */}
      <div className="mb-6 flex items-center gap-2">
        <Boton variante="secundario" icono aria-label="Día anterior" onClick={() => setFecha(sumarDias(fecha, -1))}>
          <ChevronLeft className="size-6" strokeWidth={3} aria-hidden />
        </Boton>
        <label className="relative flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-borde bg-tarjeta px-3 font-extrabold">
          <CalendarDays className="size-5 text-violeta-texto" strokeWidth={2.5} aria-hidden />
          <span aria-hidden className="first-letter:uppercase">
            {esHoy ? "Hoy" : esAyer ? "Ayer" : fechaLarga(fecha)}
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
          <ChevronRight className="size-6" strokeWidth={3} aria-hidden />
        </Boton>
      </div>
      {!esHoy && (
        <button type="button" onClick={() => setFecha(hoy)} className="-mt-3 mb-4 min-h-11 font-extrabold text-violeta-texto">
          Volver a hoy
        </button>
      )}

      {actividades.isPending ? (
        <CargandoLista filas={3} alto="h-20" />
      ) : actividades.error ? (
        <MensajeError error={actividades.error} onReintentar={() => actividades.refetch()} />
      ) : actividades.data.length === 0 ? (
        <EstadoVacio
          icono={<NotebookPen className="size-7" strokeWidth={2.5} />}
          titulo={esHoy ? "¿Qué hiciste hoy?" : "Este día quedó en blanco"}
          descripcion="Anota lo que haces: trabajo, estudio, ejercicio o un buen momento. Con el tiempo verás en qué se te va el día."
          accion={botonNuevo}
        />
      ) : (
        <>
          {totalMinutos > 0 && (
            <section aria-label="Resumen del día" className="mb-5 rounded-[20px] border-2 border-b-4 border-violeta-labio bg-violeta p-4 text-sobre-violeta">
              <p className="font-bold opacity-90">{esHoy ? "Hoy registraste" : "Ese día registraste"}</p>
              <p className="font-titulo text-4xl font-extrabold">{duracion(totalMinutos)}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {porCategoria.map((g) => {
                  const categoria = categorias.find((c) => c.id === g.categoria_id);
                  return (
                    <li key={g.categoria_id ?? "sin"} className="inline-flex items-center gap-1.5 rounded-full bg-white/18 px-3 py-1 text-sm font-bold">
                      <span className="size-2.5 rounded-full ring-2 ring-white/60" style={{ backgroundColor: categoria?.color ?? "#9a93b0" }} aria-hidden />
                      {categoria?.nombre ?? "Sin categoría"} · {duracion(g.minutos)}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Línea de tiempo del día */}
          <ol className="relative space-y-3 pl-7">
            <span className="absolute top-3 bottom-3 left-[9px] w-1 rounded-full bg-borde" aria-hidden />
            {actividades.data.map((a) => {
              const categoria = categorias.find((c) => c.id === a.categoria_id);
              return (
                <li key={a.id} className="relative">
                  <span
                    className="absolute top-5 -left-7 size-5 rounded-full border-4 border-fondo"
                    style={{ backgroundColor: categoria?.color ?? "var(--borde-fuerte)" }}
                    aria-hidden
                  />
                  <button
                    type="button"
                    onClick={() => setEdicion({ actividad: a })}
                    className={`${claseTarjeta} flex w-full flex-col gap-1.5 p-4 text-left transition-transform duration-100 hover:border-borde-fuerte active:translate-y-[2px] active:border-b-2`}
                  >
                    <span className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-extrabold text-texto-suave tabular-nums">{a.hora ? horaCorta(a.hora) : "Sin hora"}</span>
                      {categoria && <ChipCategoria categoria={categoria} />}
                      {a.minutos !== null && (
                        <span className="rounded-full bg-violeta-suave px-2 py-0.5 font-extrabold text-violeta-texto">{duracion(a.minutos)}</span>
                      )}
                    </span>
                    <span className="block text-lg font-bold break-words">{a.descripcion}</span>
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
        titulo={edicion?.actividad ? "Editar actividad" : "¿Qué hiciste?"}
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
