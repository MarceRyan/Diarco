"use client";

import {
  diaSemana,
  distribuirBloques,
  horaActual,
  horaAMinutos,
  inicioSemana,
  minutosAHora,
  rangoHorasDia,
  sumarDias,
  type BloqueHorario,
  type Categoria,
} from "@diarco/shared";
import { useBloques, useCategorias, useHoy, useZonaHoraria } from "@diarco/shared/hooks";
import { CalendarDays, CalendarRange, Plus } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Boton } from "@/components/ui/boton";
import { Dialogo } from "@/components/ui/dialogo";
import { CargandoLista, claseTarjeta, Encabezado, MensajeError } from "@/components/ui/estados";
import { duracion, horaCorta } from "@/lib/formato";
import { FormularioBloque } from "./formulario-bloque";

const NOMBRES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** Alto en píxeles de una hora en la línea de tiempo. */
const PX_POR_HORA = 64;
/** Alto mínimo de un bloque para que se pueda tocar y leer (44 px de objetivo táctil). */
const ALTO_MINIMO = 48;

type Edicion = { bloque?: BloqueHorario; dia: number; inicio?: string } | null;
type Vista = "semana" | "dia";

const CLAVE_VISTA = "diarco-horario-vista";

// La última vista usada se recuerda en este navegador (preferencia personal).
// Si el almacenamiento está bloqueado, se recuerda solo en memoria durante la visita.
let vistaEnMemoria: Vista = "semana";
const oyentesVista = new Set<() => void>();
function leerVista(): Vista {
  try {
    return localStorage.getItem(CLAVE_VISTA) === "dia" ? "dia" : "semana";
  } catch {
    return vistaEnMemoria;
  }
}
function guardarVista(vista: Vista) {
  vistaEnMemoria = vista;
  try {
    localStorage.setItem(CLAVE_VISTA, vista);
  } catch {
    // Sin almacenamiento: vale solo para esta visita.
  }
  oyentesVista.forEach((avisar) => avisar());
}
function suscribirVista(avisar: () => void) {
  oyentesVista.add(avisar);
  return () => oyentesVista.delete(avisar);
}

/** Minutos que suman los bloques de una lista. */
const minutosDe = (lista: BloqueHorario[]) => lista.reduce((t, b) => t + horaAMinutos(b.fin) - horaAMinutos(b.inicio), 0);

export function PantallaHorario() {
  const hoy = useHoy();
  const bloques = useBloques();
  const { data: categorias = [] } = useCategorias();
  // En el servidor siempre "semana"; en el navegador, la última vista usada.
  const vista = useSyncExternalStore(suscribirVista, leerVista, () => "semana" as Vista);
  const cambiarVista = guardarVista;
  const [dia, setDia] = useState<number>(() => diaSemana(hoy));
  const [edicion, setEdicion] = useState<Edicion>(null);

  const delDia = (d: number) => bloques.data?.filter((b) => b.dias_semana.includes(d)) ?? [];
  const categoriaDe = (b: BloqueHorario) => categorias.find((c) => c.id === b.categoria_id);
  const bloquesDia = delDia(dia);
  const minutosDia = minutosDe(bloquesDia);
  // Total semanal: un bloque de lunes a viernes cuenta 5 veces.
  const totalSemana = (bloques.data ?? []).reduce((t, b) => t + b.dias_semana.length, 0);
  const minutosSemana = (bloques.data ?? []).reduce(
    (t, b) => t + (horaAMinutos(b.fin) - horaAMinutos(b.inicio)) * b.dias_semana.length,
    0,
  );

  return (
    <>
      <Encabezado
        titulo="Tu semana"
        subtitulo={
          totalSemana === 0
            ? "Toca cualquier hora para agregar tu primer bloque."
            : `${totalSemana} ${totalSemana === 1 ? "bloque" : "bloques"} esta semana · ${duracion(minutosSemana)} organizadas`
        }
        accion={
          <Boton onClick={() => setEdicion({ dia })}>
            <Plus className="size-5" strokeWidth={3} aria-hidden />
            Agregar bloque
          </Boton>
        }
      />

      {/* Cambio de vista: semana completa o un día en detalle */}
      <div role="group" aria-label="Vista del horario" className="mb-5 inline-flex gap-1 rounded-2xl border-2 border-borde bg-tarjeta p-1">
        {(
          [
            { valor: "semana", etiqueta: "Semana", Icono: CalendarRange },
            { valor: "dia", etiqueta: "Día", Icono: CalendarDays },
          ] as const
        ).map(({ valor, etiqueta, Icono }) => (
          <button
            key={valor}
            type="button"
            aria-pressed={vista === valor}
            onClick={() => cambiarVista(valor)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-extrabold text-texto-suave transition-colors aria-pressed:bg-cielo aria-pressed:text-white"
          >
            <Icono className="size-5" strokeWidth={2.5} aria-hidden />
            {etiqueta}
          </button>
        ))}
      </div>

      {bloques.isPending ? (
        <CargandoLista filas={4} alto="h-20" />
      ) : bloques.error ? (
        <MensajeError error={bloques.error} onReintentar={() => bloques.refetch()} />
      ) : vista === "semana" ? (
        <VistaSemana
          hoy={hoy}
          delDia={delDia}
          todos={bloques.data}
          categoriaDe={categoriaDe}
          onVerDia={(d) => {
            setDia(d);
            cambiarVista("dia");
          }}
          onEditar={(bloque, d) => setEdicion({ bloque, dia: d })}
          onNuevo={(d, inicio) => setEdicion({ dia: d, inicio })}
        />
      ) : (
        <div className="space-y-5">
          <SelectorSemana hoy={hoy} dia={dia} onElegir={setDia} delDia={delDia} categoriaDe={categoriaDe} />

          <section aria-labelledby="titulo-dia" className={`${claseTarjeta} p-4 sm:p-5`}>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="titulo-dia" className="font-titulo text-2xl font-bold">
                {NOMBRES[dia]}
                {dia === diaSemana(hoy) && <span className="ml-2 text-base text-cielo-texto">· hoy</span>}
              </h2>
              <p className="font-bold text-texto-suave">
                {bloquesDia.length === 0
                  ? "Día libre 🌤️"
                  : `${bloquesDia.length} ${bloquesDia.length === 1 ? "bloque" : "bloques"} · ${duracion(minutosDia)}`}
              </p>
            </div>
            {bloquesDia.length === 0 && (
              <p className="mb-4 rounded-2xl bg-cielo-suave px-4 py-3 font-bold text-cielo-texto">
                Nada agendado. Toca cualquier hora para agregar un bloque.
              </p>
            )}
            <LineaTiempo
              bloques={bloquesDia}
              categoriaDe={categoriaDe}
              esHoy={dia === diaSemana(hoy)}
              onEditar={(bloque) => setEdicion({ bloque, dia })}
              onNuevo={(inicio) => setEdicion({ dia, inicio })}
            />
          </section>
        </div>
      )}

      <Dialogo
        abierto={edicion !== null}
        onCerrar={() => setEdicion(null)}
        titulo={edicion?.bloque ? "Editar bloque" : "Nuevo bloque"}
      >
        {edicion && (
          <FormularioBloque
            key={edicion.bloque?.id ?? `nuevo-${edicion.dia}-${edicion.inicio ?? ""}`}
            bloque={edicion.bloque}
            diaInicial={edicion.dia}
            inicioInicial={edicion.inicio}
            onListo={() => setEdicion(null)}
          />
        )}
      </Dialogo>
    </>
  );
}

// -----------------------------------------------------------------------------
// Semana: 7 tarjetas de día con puntitos de sus bloques
// -----------------------------------------------------------------------------
export function SelectorSemana({
  hoy,
  dia,
  onElegir,
  delDia,
  categoriaDe,
}: {
  hoy: string;
  dia: number;
  onElegir: (d: number) => void;
  delDia: (d: number) => BloqueHorario[];
  categoriaDe: (b: BloqueHorario) => Categoria | undefined;
}) {
  const lunes = inicioSemana(hoy);
  const fechas = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));

  return (
    <div role="group" aria-label="Día de la semana" className="grid grid-cols-7 gap-1.5 sm:gap-2">
      {fechas.map((fecha) => {
        const d = diaSemana(fecha);
        const esHoy = fecha === hoy;
        const elegido = d === dia;
        const lista = delDia(d);
        return (
          <button
            key={fecha}
            type="button"
            aria-pressed={elegido}
            aria-label={`${NOMBRES[d]} ${Number(fecha.slice(8))}${esHoy ? ", hoy" : ""}: ${lista.length} ${lista.length === 1 ? "bloque" : "bloques"}`}
            onClick={() => onElegir(d)}
            className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-[18px] border-2 border-b-4 transition-transform duration-100 active:translate-y-[2px] active:border-b-2 ${
              elegido
                ? "border-cielo-labio bg-cielo text-white"
                : esHoy
                  ? "border-cielo/50 bg-cielo-suave text-cielo-texto"
                  : "border-borde bg-tarjeta text-texto-suave"
            }`}
          >
            <span className="text-xs font-extrabold">{CORTOS[d]}</span>
            <span className={`font-titulo text-2xl leading-none font-bold ${elegido ? "" : "text-texto"}`}>{Number(fecha.slice(8))}</span>
            <span className="flex h-2 gap-0.5" aria-hidden>
              {lista.slice(0, 4).map((b) => (
                <span
                  key={b.id}
                  className={`size-1.5 rounded-full ${elegido ? "ring-1 ring-white" : ""}`}
                  style={{ backgroundColor: categoriaDe(b)?.color ?? "var(--cielo)" }}
                />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Línea de tiempo del día
// -----------------------------------------------------------------------------
/** Minuto actual del día en la zona del usuario; null hasta montar (evita desajustes de hidratación). */
function useMinutoActual(): number | null {
  const zona = useZonaHoraria();
  const [ahora, setAhora] = useState<number | null>(null);
  useEffect(() => {
    const actualizar = () => setAhora(horaAMinutos(horaActual(zona)));
    actualizar();
    const t = setInterval(actualizar, 60_000);
    return () => clearInterval(t);
  }, [zona]);
  return ahora;
}

export function LineaTiempo({
  bloques,
  categoriaDe,
  esHoy,
  onEditar,
  onNuevo,
}: {
  bloques: BloqueHorario[];
  categoriaDe: (b: BloqueHorario) => Categoria | undefined;
  esHoy: boolean;
  onEditar: (b: BloqueHorario) => void;
  onNuevo: (inicio: string) => void;
}) {
  const ahora = useMinutoActual();
  const [desde, hasta] = rangoHorasDia(bloques);
  const horas = Array.from({ length: hasta - desde }, (_, i) => desde + i);
  const y = (minutos: number) => (minutos / 60 - desde) * PX_POR_HORA;
  const distribuidos = distribuirBloques(bloques);
  const mostrarAhora = esHoy && ahora !== null && ahora >= desde * 60 && ahora <= hasta * 60;

  return (
    <div className="relative" style={{ height: (hasta - desde) * PX_POR_HORA }}>
      {/* Filas de hora: cada una es un botón para agregar un bloque a esa hora */}
      {horas.map((h) => (
        <button
          key={h}
          type="button"
          onClick={() => onNuevo(minutosAHora(h * 60))}
          aria-label={`Agregar bloque a las ${minutosAHora(h * 60)}`}
          className="group absolute inset-x-0 flex items-start border-t-2 border-borde text-left"
          style={{ top: y(h * 60), height: PX_POR_HORA }}
        >
          <span className="w-14 shrink-0 -translate-y-2.5 bg-tarjeta pr-2 text-xs font-extrabold text-texto-suave tabular-nums">
            {minutosAHora(h * 60)}
          </span>
          <span className="mt-2 ml-2 hidden items-center gap-1 rounded-full bg-cielo-suave px-2.5 py-1 text-xs font-extrabold text-cielo-texto group-hover:inline-flex group-focus-visible:inline-flex">
            <Plus className="size-3.5" strokeWidth={3} aria-hidden />
            Agregar
          </span>
        </button>
      ))}

      {/* Bloques, del alto de su duración y lado a lado si se pisan */}
      <div className="pointer-events-none absolute inset-y-0 right-0 left-16">
        {distribuidos.map(({ bloque, inicio, fin, carril, carriles }) => {
          const categoria = categoriaDe(bloque);
          const color = categoria?.color ?? "#2f9ff0";
          const alto = Math.max(((fin - inicio) / 60) * PX_POR_HORA, ALTO_MINIMO) - 4;
          const corto = alto < 72;
          const angosto = carriles > 1;
          return (
            <button
              key={bloque.id}
              type="button"
              onClick={() => onEditar(bloque)}
              aria-label={`${bloque.titulo}, de ${horaCorta(bloque.inicio)} a ${horaCorta(bloque.fin)}${categoria ? `, ${categoria.nombre}` : ""}. Editar`}
              className="pointer-events-auto absolute flex flex-col justify-start overflow-hidden rounded-2xl border-2 border-b-4 px-3 py-1.5 text-left transition-transform duration-100 hover:brightness-[1.03] active:translate-y-[2px] active:border-b-2"
              style={{
                top: y(inicio) + 2,
                height: alto,
                left: `calc(${(carril / carriles) * 100}% + ${carril > 0 ? 3 : 0}px)`,
                width: `calc(${100 / carriles}% - ${carriles > 1 ? 3 : 0}px)`,
                backgroundColor: `color-mix(in oklab, ${color} 16%, var(--tarjeta))`,
                borderColor: `color-mix(in oklab, ${color} 45%, var(--tarjeta))`,
              }}
            >
              <span className={`flex gap-x-2 ${corto ? "items-center" : "flex-col"}`}>
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                  <span className="truncate font-titulo text-lg leading-tight font-bold">{bloque.titulo}</span>
                </span>
                {/* En carriles angostos y bloques cortos, el título tiene prioridad sobre la hora */}
                {!(corto && angosto) && (
                  <span className="truncate text-sm font-bold text-texto-suave tabular-nums">
                    {horaCorta(bloque.inicio)}–{horaCorta(bloque.fin)}
                    {!corto && !angosto && categoria ? ` · ${categoria.nombre}` : ""}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Línea de "ahora" */}
      {mostrarAhora && (
        <div className="pointer-events-none absolute right-0 left-12 flex items-center" style={{ top: y(ahora!) - 5 }} aria-hidden>
          <span className="size-2.5 rounded-full bg-mandarina ring-2 ring-tarjeta" />
          <span className="h-0.5 flex-1 bg-mandarina" />
          <span className="ml-1 rounded-full bg-mandarina px-2 py-0.5 text-[11px] font-extrabold text-white">Ahora</span>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Vista semanal: los 7 días en columnas, las horas en filas
// -----------------------------------------------------------------------------

/** Alto de una hora en la vista semanal (más compacta que la del día). */
const PX_SEMANA = 52;
/** Alto mínimo de un bloque en la vista semanal. */
const ALTO_MINIMO_SEMANA = 26;
const COLUMNAS = "grid-cols-[3.5rem_repeat(7,minmax(5.5rem,1fr))]";

export function VistaSemana({
  hoy,
  delDia,
  todos,
  categoriaDe,
  onVerDia,
  onEditar,
  onNuevo,
}: {
  hoy: string;
  delDia: (d: number) => BloqueHorario[];
  todos: BloqueHorario[];
  categoriaDe: (b: BloqueHorario) => Categoria | undefined;
  onVerDia: (d: number) => void;
  onEditar: (b: BloqueHorario, d: number) => void;
  onNuevo: (d: number, inicio: string) => void;
}) {
  const ahora = useMinutoActual();
  const [desde, hasta] = rangoHorasDia(todos);
  const horas = Array.from({ length: hasta - desde }, (_, i) => desde + i);
  const y = (minutos: number) => (minutos / 60 - desde) * PX_SEMANA;
  const lunes = inicioSemana(hoy);
  const fechas = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));

  // En pantallas angostas, al abrir se desliza hasta el día de hoy para que quede a la vista.
  const desplazable = useRef<HTMLDivElement>(null);
  const columnaHoy = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const contenedor = desplazable.current;
    const hoyEl = columnaHoy.current;
    if (!contenedor || !hoyEl || contenedor.scrollWidth <= contenedor.clientWidth) return;
    const margenHoras = 56; // ancho de la columna de horas fija
    const asomar = 28; // deja ver un poco del día anterior para que se note que se puede deslizar
    const distancia = hoyEl.getBoundingClientRect().left - contenedor.getBoundingClientRect().left;
    contenedor.scrollLeft = Math.max(0, contenedor.scrollLeft + distancia - margenHoras - asomar);
  }, [hoy]);

  return (
    <section aria-label="Horario de la semana" className={`${claseTarjeta} overflow-hidden`}>
      {/* En pantallas angostas la cuadrícula se desliza de lado; la columna de horas queda fija */}
      <div ref={desplazable} className="overflow-x-auto">
        <div className="min-w-[44rem]">
          {/* Cabecera: cada día abre su vista en detalle */}
          <div className={`grid ${COLUMNAS} border-b-2 border-borde`}>
            <span className="sticky left-0 z-10 bg-tarjeta" aria-hidden />
            {fechas.map((fecha) => {
              const d = diaSemana(fecha);
              const esHoy = fecha === hoy;
              const cantidad = delDia(d).length;
              return (
                <button
                  key={fecha}
                  ref={esHoy ? columnaHoy : undefined}
                  type="button"
                  onClick={() => onVerDia(d)}
                  aria-label={`Ver ${NOMBRES[d]} ${Number(fecha.slice(8))} en detalle: ${cantidad} ${cantidad === 1 ? "bloque" : "bloques"}`}
                  className="group flex min-h-16 flex-col items-center justify-center gap-0.5 py-2 transition-colors hover:bg-superficie"
                >
                  <span className={`text-xs font-extrabold ${esHoy ? "text-cielo-texto" : "text-texto-suave"}`}>{CORTOS[d]}</span>
                  <span
                    className={`flex size-9 items-center justify-center rounded-full font-titulo text-xl leading-none font-bold ${
                      esHoy ? "bg-cielo text-white" : "group-hover:bg-superficie-2"
                    }`}
                  >
                    {Number(fecha.slice(8))}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cuerpo */}
          <div className={`grid ${COLUMNAS}`} style={{ height: (hasta - desde) * PX_SEMANA + 8 }}>
            {/* Horas */}
            <div className="sticky left-0 z-10 bg-tarjeta" aria-hidden>
              <div className="relative h-full">
                {horas.map((h) => (
                  <span
                    key={h}
                    className="absolute right-2 text-[11px] font-extrabold text-texto-suave tabular-nums"
                    style={{ top: y(h * 60) + 2 }}
                  >
                    {minutosAHora(h * 60)}
                  </span>
                ))}
              </div>
            </div>

            {/* Un día por columna */}
            {fechas.map((fecha) => {
              const d = diaSemana(fecha);
              const esHoy = fecha === hoy;
              return (
                <div key={fecha} className={`relative border-l-2 border-borde ${esHoy ? "bg-cielo-suave/40" : ""}`}>
                  {horas.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => onNuevo(d, minutosAHora(h * 60))}
                      aria-label={`Agregar bloque el ${NOMBRES[d]} a las ${minutosAHora(h * 60)}`}
                      className="absolute inset-x-0 border-t-2 border-borde/70 transition-colors hover:bg-cielo-suave"
                      style={{ top: y(h * 60), height: PX_SEMANA }}
                    />
                  ))}

                  {distribuirBloques(delDia(d)).map(({ bloque, inicio, fin, carril, carriles }) => {
                    const categoria = categoriaDe(bloque);
                    const color = categoria?.color ?? "#2f9ff0";
                    const alto = Math.max(((fin - inicio) / 60) * PX_SEMANA, ALTO_MINIMO_SEMANA) - 2;
                    return (
                      <button
                        key={bloque.id}
                        type="button"
                        onClick={() => onEditar(bloque, d)}
                        aria-label={`${bloque.titulo}, ${NOMBRES[d]} de ${horaCorta(bloque.inicio)} a ${horaCorta(bloque.fin)}. Editar`}
                        className="absolute flex flex-col justify-start overflow-hidden rounded-xl border-2 border-b-[3px] px-1.5 py-1 text-left transition-transform duration-100 hover:z-[1] hover:brightness-[1.03] active:translate-y-px"
                        style={{
                          top: y(inicio) + 1,
                          height: alto,
                          left: `calc(${(carril / carriles) * 100}% + 2px)`,
                          width: `calc(${100 / carriles}% - 4px)`,
                          backgroundColor: `color-mix(in oklab, ${color} 18%, var(--tarjeta))`,
                          borderColor: `color-mix(in oklab, ${color} 50%, var(--tarjeta))`,
                        }}
                      >
                        <span className="line-clamp-2 text-xs leading-tight font-extrabold">{bloque.titulo}</span>
                        {alto >= 40 && (
                          <span className="truncate text-[11px] font-bold text-texto-suave tabular-nums">
                            {horaCorta(bloque.inicio)}–{horaCorta(bloque.fin)}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {esHoy && ahora !== null && ahora >= desde * 60 && ahora <= hasta * 60 && (
                    <div className="pointer-events-none absolute inset-x-0 z-[2] flex items-center" style={{ top: y(ahora) - 4 }} aria-hidden>
                      <span className="-ml-1 size-2 rounded-full bg-mandarina" />
                      <span className="h-0.5 flex-1 bg-mandarina" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
