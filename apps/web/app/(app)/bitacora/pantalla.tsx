"use client";

import { compararFechas, esFechaValida, fechaEnZona, minutosPorCategoria, rutinaTocaba, sumarDias, type Actividad } from "@diarco/shared";
import {
  useActividades,
  useCategorias,
  useHabitos,
  useHoy,
  useMarcarRutina,
  useNotasDia,
  useRutinaHechas,
  useRutinas,
  useZonaHoraria,
} from "@diarco/shared/hooks";
import { CalendarDays, Check, ChevronLeft, ChevronRight, NotebookPen, Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChipCategoria } from "@/components/categorias";
import { NotaHabito } from "@/components/nota-habito";
import { Boton } from "@/components/ui/boton";
import { Dialogo } from "@/components/ui/dialogo";
import { CargandoLista, claseTarjeta, Encabezado, EstadoVacio, MensajeError } from "@/components/ui/estados";
import { cuandoFue, duracion, fechaLarga, horaCorta } from "@/lib/formato";
import { FormularioActividad } from "./formulario-actividad";

type Edicion = { actividad?: Actividad } | null;

/** La rutina de ese día: qué tareas hiciste y cuáles no (tocables para corregir). */
function RutinaDelDia({ fecha, hoy }: { fecha: string; hoy: string }) {
  const zona = useZonaHoraria();
  const { data: rutinas = [] } = useRutinas();
  const { data: hechas } = useRutinaHechas(fecha);
  const marcar = useMarcarRutina();
  if (!hechas) return null;
  const futuro = compararFechas(fecha, hoy) > 0;
  // Las que tocaban ese día, más las que hiciste aunque no tocaran.
  const delDia = rutinas.filter(
    (r) => hechas.has(r.id) || (r.activo && rutinaTocaba(r, fecha, fechaEnZona(new Date(r.creado_en), zona))),
  );
  if (delDia.length === 0) return null;
  const cuantas = delDia.filter((r) => hechas.has(r.id)).length;

  return (
    <section aria-labelledby="titulo-rutina-dia" className={`${claseTarjeta} p-4`}>
      <h2 id="titulo-rutina-dia" className="mb-3 flex items-center justify-between gap-2 font-titulo text-xl font-bold">
        Rutina
        <span className="text-sm font-extrabold text-texto-suave tabular-nums">
          {cuantas} de {delDia.length}
        </span>
      </h2>
      <ul className="flex flex-wrap gap-2">
        {delDia.map((r) => {
          const hecha = hechas.has(r.id);
          return (
            <li key={r.id}>
              <button
                type="button"
                disabled={futuro}
                aria-pressed={hecha}
                onClick={() => marcar.mutate({ rutinaId: r.id, fecha, hecha: !hecha })}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-b-4 px-3 font-bold transition-transform duration-100 active:translate-y-[2px] active:border-b-2 disabled:opacity-60 ${
                  hecha ? "border-verde/50 bg-verde-suave text-verde-texto" : "border-borde-fuerte bg-tarjeta text-texto-suave"
                }`}
              >
                <span aria-hidden>{r.icono}</span>
                {r.nombre}
                {hecha && <Check className="size-4" strokeWidth={3.5} aria-hidden />}
                <span className="sr-only">{hecha ? ": hecha. Toca para desmarcar." : ": sin marcar. Toca si la hiciste."}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {cuantas < delDia.length && !futuro && fecha !== hoy && (
        <p className="mt-2 text-sm text-texto-suave">¿Hiciste alguna y olvidaste marcarla? Tócala.</p>
      )}
    </section>
  );
}

/** Hábitos cumplidos ese día, con su nota de "qué hiciste" (editable desde aquí). */
function HabitosDelDia({ fecha, hoy }: { fecha: string; hoy: string }) {
  const { data: notas } = useNotasDia(fecha);
  const { data: habitos = [] } = useHabitos();
  if (!notas || notas.size === 0) return null;
  const cumplidos = habitos.filter((h) => notas.has(h.id));
  if (cumplidos.length === 0) return null;

  return (
    <section aria-labelledby="titulo-habitos-dia" className={`${claseTarjeta} p-4`}>
      <h2 id="titulo-habitos-dia" className="mb-3 flex items-center gap-2 font-titulo text-xl font-bold">
        <span className="flex size-7 items-center justify-center rounded-full bg-verde text-white" aria-hidden>
          <Check className="size-4" strokeWidth={3.5} />
        </span>
        {cumplidos.length === 1 ? "Cumpliste 1 hábito" : `Cumpliste ${cumplidos.length} hábitos`}
      </h2>
      <ul className="space-y-3">
        {cumplidos.map((h) => (
          <li key={h.id} className="space-y-1">
            <p className="flex items-center gap-2 font-bold">
              <span className="text-xl" aria-hidden>
                {h.icono}
              </span>
              {h.nombre}
            </p>
            <NotaHabito habito={h} fecha={fecha} nota={notas.get(h.id)} cuando={fecha === hoy ? undefined : cuandoFue(fecha, hoy)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PantallaBitacora() {
  const hoy = useHoy();
  // ?fecha=AAAA-MM-DD abre un día concreto (por ejemplo, desde el horario); nunca un día futuro.
  const fechaUrl = useSearchParams().get("fecha");
  const [fecha, setFecha] = useState(() =>
    fechaUrl && esFechaValida(fechaUrl) && compararFechas(fechaUrl, hoy) <= 0 ? fechaUrl : hoy,
  );
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

      {/* Escritorio: día y actividades a la izquierda; resumen y hábitos cumplidos a la derecha */}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0">
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

        </div>
        <aside aria-label="Tiempo y hábitos del día" className="min-w-0 space-y-5 xl:sticky xl:top-10">
          {totalMinutos > 0 && (
            <section aria-label="Resumen del día" className="rounded-[20px] border-2 border-b-4 border-violeta-labio bg-violeta p-4 text-sobre-violeta">
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

          <HabitosDelDia fecha={fecha} hoy={hoy} />
          <RutinaDelDia fecha={fecha} hoy={hoy} />
        </aside>
      </div>

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
