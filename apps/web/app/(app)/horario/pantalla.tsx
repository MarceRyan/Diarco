"use client";

import {
  diaSemana,
  distribuirBloques,
  horaActual,
  horaAMinutos,
  inicioSemana,
  minutosAHora,
  minutosPlanificadosPorCategoria,
  minutosPorCategoria,
  ULTIMO_MINUTO_DEL_DIA,
  rangoHorasDia,
  sumarDias,
  type BloqueHorario,
  type Categoria,
} from "@diarco/shared";
import { useActividadesRango, useBloques, useCategorias, useHoy, useZonaHoraria } from "@diarco/shared/hooks";
import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, NotebookPen, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BarrasHorizontales } from "@/components/graficos";
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
  const router = useRouter();
  const bloques = useBloques();
  const { data: categorias = [] } = useCategorias();
  // En el servidor siempre "semana"; en el navegador, la última vista usada.
  const vista = useSyncExternalStore(suscribirVista, leerVista, () => "semana" as Vista);
  const cambiarVista = guardarVista;
  const [dia, setDia] = useState<number>(() => diaSemana(hoy));
  const [edicion, setEdicion] = useState<Edicion>(null);
  // Semana visible: 0 = esta semana, -1 = la anterior, 1 = la siguiente…
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [verBitacora, setVerBitacora] = useState(true);

  const lunes = inicioSemana(sumarDias(hoy, desplazamiento * 7));
  const domingo = sumarDias(lunes, 6);
  const esEstaSemana = desplazamiento === 0;
  const actividades = useActividadesRango(lunes, domingo);

  const delDia = (d: number) => bloques.data?.filter((b) => b.dias_semana.includes(d)) ?? [];
  const categoriaDe = (b: { categoria_id: number | null }) => categorias.find((c) => c.id === b.categoria_id);
  const bloquesDia = delDia(dia);
  const minutosDia = minutosDe(bloquesDia);
  // Total semanal: un bloque de lunes a viernes cuenta 5 veces.
  const totalSemana = (bloques.data ?? []).reduce((t, b) => t + b.dias_semana.length, 0);
  const minutosSemana = (bloques.data ?? []).reduce(
    (t, b) => t + (horaAMinutos(b.fin) - horaAMinutos(b.inicio)) * b.dias_semana.length,
    0,
  );
  const verDiaEnBitacora = (fecha: string) => router.push(`/bitacora?fecha=${fecha}`);

  return (
    <>
      <Encabezado
        titulo="Tu semana"
        subtitulo={
          totalSemana === 0
            ? "Toca cualquier hora para agregar tu primer bloque."
            : `${totalSemana} ${totalSemana === 1 ? "bloque" : "bloques"} por semana · ${duracion(minutosSemana)} organizadas`
        }
        accion={
          <Boton onClick={() => setEdicion({ dia })}>
            <Plus className="size-5" strokeWidth={3} aria-hidden />
            Agregar bloque
          </Boton>
        }
      />

      {/* Controles: vista, semana visible y capa de bitácora */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Vista del horario" className="inline-flex gap-1 rounded-2xl border-2 border-borde bg-tarjeta p-1">
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

        {vista === "semana" && (
          <>
            <div className="inline-flex items-center gap-1 rounded-2xl border-2 border-borde bg-tarjeta p-1" role="group" aria-label="Cambiar de semana">
              <Boton variante="fantasma" icono aria-label="Semana anterior" onClick={() => setDesplazamiento((n) => n - 1)}>
                <ChevronLeft className="size-5" strokeWidth={3} aria-hidden />
              </Boton>
              <span className="min-w-36 text-center font-extrabold tabular-nums" aria-live="polite">
                {rangoSemana(lunes, domingo)}
              </span>
              <Boton variante="fantasma" icono aria-label="Semana siguiente" onClick={() => setDesplazamiento((n) => n + 1)}>
                <ChevronRight className="size-5" strokeWidth={3} aria-hidden />
              </Boton>
            </div>
            {!esEstaSemana && (
              <Boton variante="secundario" onClick={() => setDesplazamiento(0)}>
                Esta semana
              </Boton>
            )}
            <button
              type="button"
              aria-pressed={verBitacora}
              onClick={() => setVerBitacora((v) => !v)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-dashed border-violeta/60 px-4 font-extrabold text-texto-suave transition-colors aria-pressed:border-solid aria-pressed:bg-violeta-suave aria-pressed:text-violeta-texto"
            >
              <NotebookPen className="size-4" strokeWidth={2.5} aria-hidden />
              Mi bitácora
            </button>
          </>
        )}
      </div>

      {bloques.isPending ? (
        <CargandoLista filas={4} alto="h-20" />
      ) : bloques.error ? (
        <MensajeError error={bloques.error} onReintentar={() => bloques.refetch()} />
      ) : (
        // En escritorio, la cuadrícula ocupa el espacio y a la derecha va el resumen de la semana.
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          {vista === "semana" ? (
            <VistaSemana
              hoy={hoy}
              lunes={lunes}
              delDia={delDia}
              todos={bloques.data}
              actividades={verBitacora ? (actividades.data ?? []) : []}
              categoriaDe={categoriaDe}
              onVerDia={(d) => {
                setDia(d);
                cambiarVista("dia");
              }}
              onVerBitacora={verDiaEnBitacora}
              onEditar={(bloque, d) => setEdicion({ bloque, dia: d })}
              onNuevo={(d, inicio) => setEdicion({ dia: d, inicio })}
            />
          ) : (
            <div className="min-w-0 space-y-5">
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

          <PanelSemana
            hoy={hoy}
            esEstaSemana={esEstaSemana}
            bloques={bloques.data}
            actividades={actividades.data ?? []}
            categorias={categorias}
            onVerBitacora={() => verDiaEnBitacora(esEstaSemana ? hoy : domingo)}
          />
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

const formatoDiaMes = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: "UTC" });

/** "16 – 22 nov" (o "29 dic – 4 ene" si cruza de mes). */
function rangoSemana(lunes: string, domingo: string): string {
  const [d1, m1] = formatoDiaMes.format(new Date(`${lunes}T00:00:00Z`)).replace(".", "").split(" ");
  const fin = formatoDiaMes.format(new Date(`${domingo}T00:00:00Z`)).replace(".", "");
  return m1 && fin.endsWith(m1) ? `${d1} – ${fin}` : `${d1} ${m1 ?? ""} – ${fin}`;
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
  lunes,
  delDia,
  todos,
  actividades,
  categoriaDe,
  onVerDia,
  onVerBitacora,
  onEditar,
  onNuevo,
}: {
  hoy: string;
  /** Lunes de la semana que se muestra. */
  lunes: string;
  delDia: (d: number) => BloqueHorario[];
  todos: BloqueHorario[];
  /** Actividades de la bitácora de esa semana (capa "lo que hiciste"). */
  actividades: ActividadSemana[];
  categoriaDe: (b: { categoria_id: number | null }) => Categoria | undefined;
  onVerDia: (d: number) => void;
  onVerBitacora: (fecha: string) => void;
  onEditar: (b: BloqueHorario, d: number) => void;
  onNuevo: (d: number, inicio: string) => void;
}) {
  const ahora = useMinutoActual();
  const fechas = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));

  // Actividades con hora, convertidas en intervalos (si no tienen minutos, 30 min visuales).
  const conHora = actividades
    .filter((a) => a.hora)
    .map((a) => {
      const inicio = horaAMinutos(a.hora!);
      return { ...a, inicioTxt: horaCorta(a.hora!), finTxt: minutosAHora(Math.min(inicio + (a.minutos ?? 30), ULTIMO_MINUTO_DEL_DIA)) };
    });
  const [desde, hasta] = rangoHorasDia([...todos, ...conHora.map((a) => ({ inicio: a.inicioTxt, fin: a.finTxt }))]);
  const horas = Array.from({ length: hasta - desde }, (_, i) => desde + i);
  const y = (minutos: number) => (minutos / 60 - desde) * PX_SEMANA;

  // En pantallas angostas, al abrir se desliza hasta el día de hoy para que quede a la vista.
  const desplazable = useRef<HTMLDivElement>(null);
  const columnaHoy = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const contenedor = desplazable.current;
    const hoyEl = columnaHoy.current;
    if (!contenedor) return;
    if (!hoyEl || contenedor.scrollWidth <= contenedor.clientWidth) {
      contenedor.scrollLeft = 0;
      return;
    }
    const margenHoras = 56; // ancho de la columna de horas fija
    const asomar = 28; // deja ver un poco del día anterior para que se note que se puede deslizar
    const distancia = hoyEl.getBoundingClientRect().left - contenedor.getBoundingClientRect().left;
    contenedor.scrollLeft = Math.max(0, contenedor.scrollLeft + distancia - margenHoras - asomar);
  }, [hoy, lunes]);

  return (
    <section aria-label="Horario de la semana" className={`${claseTarjeta} min-w-0 overflow-hidden`}>
      {/* En pantallas angostas la cuadrícula se desliza de lado; la columna de horas queda fija */}
      <div ref={desplazable} className="overflow-x-auto">
        <div className="min-w-[44rem]">
          {/* Cabecera: cada día abre su vista en detalle; "+N" lleva a lo anotado sin hora */}
          <div className={`grid ${COLUMNAS} border-b-2 border-borde`}>
            <span className="sticky left-0 z-10 bg-tarjeta" aria-hidden />
            {fechas.map((fecha) => {
              const d = diaSemana(fecha);
              const esHoy = fecha === hoy;
              const cantidad = delDia(d).length;
              const sinHora = actividades.filter((a) => a.fecha === fecha && !a.hora).length;
              return (
                <div key={fecha} ref={esHoy ? columnaHoy : undefined} className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => onVerDia(d)}
                    aria-label={`Ver ${NOMBRES[d]} ${Number(fecha.slice(8))} en detalle: ${cantidad} ${cantidad === 1 ? "bloque" : "bloques"}`}
                    className="group flex min-h-16 w-full flex-col items-center justify-center gap-0.5 py-2 transition-colors hover:bg-superficie"
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
                  {sinHora > 0 && (
                    <button
                      type="button"
                      onClick={() => onVerBitacora(fecha)}
                      className="mb-1.5 inline-flex min-h-7 items-center gap-1 rounded-full border-2 border-dashed border-violeta/60 px-2 text-[11px] font-extrabold text-violeta-texto"
                      aria-label={`${sinHora} ${sinHora === 1 ? "actividad" : "actividades"} sin hora el ${NOMBRES[d]}. Ver en la bitácora`}
                    >
                      <NotebookPen className="size-3" strokeWidth={2.5} aria-hidden />+{sinHora}
                    </button>
                  )}
                </div>
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

            {/* Un día por columna: plan (relleno) + bitácora (punteado) */}
            {fechas.map((fecha) => {
              const d = diaSemana(fecha);
              const esHoy = fecha === hoy;
              const elementos = distribuirBloques([
                ...delDia(d).map((b) => ({ inicio: b.inicio, fin: b.fin, tipo: "bloque" as const, bloque: b })),
                ...conHora
                  .filter((a) => a.fecha === fecha)
                  .map((a) => ({ inicio: a.inicioTxt, fin: a.finTxt, tipo: "actividad" as const, actividad: a })),
              ]);
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

                  {elementos.map(({ bloque: el, inicio, fin, carril, carriles }) => {
                    const alto = Math.max(((fin - inicio) / 60) * PX_SEMANA, ALTO_MINIMO_SEMANA) - 2;
                    const posicion = {
                      top: y(inicio) + 1,
                      height: alto,
                      left: `calc(${(carril / carriles) * 100}% + 2px)`,
                      width: `calc(${100 / carriles}% - 4px)`,
                    };

                    if (el.tipo === "actividad") {
                      const a = el.actividad;
                      return (
                        <button
                          key={`a-${a.id}`}
                          type="button"
                          onClick={() => onVerBitacora(fecha)}
                          aria-label={`Hiciste: ${a.descripcion}, a las ${a.inicioTxt}${a.minutos ? `, ${duracion(a.minutos)}` : ""}. Ver en la bitácora`}
                          className="absolute flex flex-col justify-start overflow-hidden rounded-xl border-2 border-dashed border-violeta/70 bg-tarjeta/90 px-1.5 py-1 text-left text-violeta-texto transition-transform duration-100 hover:z-[1] active:translate-y-px"
                          style={posicion}
                        >
                          <span className="flex w-full items-start gap-1 text-left">
                            <NotebookPen className="mt-0.5 size-3 shrink-0" strokeWidth={2.5} aria-hidden />
                            <span className="line-clamp-2 flex-1 text-xs leading-tight font-extrabold">{a.descripcion}</span>
                          </span>
                        </button>
                      );
                    }

                    const b = el.bloque;
                    const categoria = categoriaDe(b);
                    const color = categoria?.color ?? "#2f9ff0";
                    return (
                      <button
                        key={`b-${b.id}`}
                        type="button"
                        onClick={() => onEditar(b, d)}
                        aria-label={`${b.titulo}, ${NOMBRES[d]} de ${horaCorta(b.inicio)} a ${horaCorta(b.fin)}. Editar`}
                        className="absolute flex flex-col justify-start overflow-hidden rounded-xl border-2 border-b-[3px] px-1.5 py-1 text-left transition-transform duration-100 hover:z-[1] hover:brightness-[1.03] active:translate-y-px"
                        style={{
                          ...posicion,
                          backgroundColor: `color-mix(in oklab, ${color} 18%, var(--tarjeta))`,
                          borderColor: `color-mix(in oklab, ${color} 50%, var(--tarjeta))`,
                        }}
                      >
                        <span className="line-clamp-2 text-xs leading-tight font-extrabold">{b.titulo}</span>
                        {alto >= 40 && (
                          <span className="truncate text-[11px] font-bold text-texto-suave tabular-nums">
                            {horaCorta(b.inicio)}–{horaCorta(b.fin)}
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

// -----------------------------------------------------------------------------
// Panel lateral: resumen de la semana (a la derecha en escritorio, debajo en móvil)
// -----------------------------------------------------------------------------
type ActividadSemana = {
  id: number;
  fecha: string;
  hora: string | null;
  descripcion: string;
  categoria_id: number | null;
  minutos: number | null;
};

export function PanelSemana({
  hoy,
  esEstaSemana,
  bloques,
  actividades,
  categorias,
  onVerBitacora,
}: {
  hoy: string;
  esEstaSemana: boolean;
  bloques: BloqueHorario[];
  actividades: ActividadSemana[];
  categorias: Categoria[];
  onVerBitacora: () => void;
}) {
  const ahora = useMinutoActual();
  const nombreDe = (id: number | null) => categorias.find((c) => c.id === id);
  const plan = minutosPlanificadosPorCategoria(bloques);
  const hecho = minutosPorCategoria(actividades).filter((c) => c.minutos > 0);
  const totalHecho = hecho.reduce((t, c) => t + c.minutos, 0);

  // Lo que toca ahora o a continuación (solo en la semana actual).
  const deHoy = bloques
    .filter((b) => b.dias_semana.includes(diaSemana(hoy)))
    .sort((a, b) => horaAMinutos(a.inicio) - horaAMinutos(b.inicio));
  const enCurso = ahora === null ? undefined : deHoy.find((b) => horaAMinutos(b.inicio) <= ahora && ahora < horaAMinutos(b.fin));
  const siguiente = ahora === null ? undefined : deHoy.find((b) => horaAMinutos(b.inicio) > ahora);

  const etiqueta = (id: number | null) => {
    const c = nombreDe(id);
    return (
      <span className="inline-flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: c?.color ?? "#9a93b0" }} aria-hidden />
        {c?.nombre ?? "Sin categoría"}
      </span>
    );
  };

  return (
    <aside aria-label="Resumen de la semana" className="grid content-start gap-5 sm:grid-cols-2 xl:grid-cols-1">
      {esEstaSemana && (
        <section className={`${claseTarjeta} bg-cielo-suave p-4`}>
          <h2 className="mb-1 font-titulo text-xl font-bold">Ahora mismo</h2>
          {ahora === null ? (
            <p className="text-texto-suave">…</p>
          ) : enCurso ? (
            <p className="font-bold">
              Estás en <span className="text-cielo-texto">{enCurso.titulo}</span> hasta las {horaCorta(enCurso.fin)}.
              {siguiente && (
                <span className="block font-medium text-texto-suave">
                  Después: {siguiente.titulo} · {horaCorta(siguiente.inicio)}
                </span>
              )}
            </p>
          ) : siguiente ? (
            <p className="font-bold">
              Siguiente: <span className="text-cielo-texto">{siguiente.titulo}</span> a las {horaCorta(siguiente.inicio)}.
            </p>
          ) : (
            <p className="font-bold">No te queda nada agendado hoy. ¡Tiempo libre! 🎉</p>
          )}
        </section>
      )}

      <section className={`${claseTarjeta} p-4`}>
        <h2 className="mb-3 font-titulo text-xl font-bold">Tu plan semanal</h2>
        {plan.length === 0 ? (
          <p className="text-texto-suave">Aún no tienes bloques. Toca una hora en la cuadrícula para empezar.</p>
        ) : (
          <BarrasHorizontales
            max={plan[0]!.minutos}
            filas={plan.map((c) => ({ id: c.categoria_id ?? "sin", etiqueta: etiqueta(c.categoria_id), valor: c.minutos, texto: duracion(c.minutos) }))}
          />
        )}
      </section>

      <section className={`${claseTarjeta} p-4`}>
        <h2 className="mb-1 font-titulo text-xl font-bold">Lo que registraste</h2>
        {totalHecho === 0 ? (
          <p className="text-texto-suave">
            {actividades.length === 0 ? "Nada en la bitácora esta semana." : "Tus actividades no tienen minutos anotados."}{" "}
            <button type="button" onClick={onVerBitacora} className="font-extrabold text-violeta-texto underline underline-offset-4">
              Ir a la bitácora
            </button>
          </p>
        ) : (
          <>
            <p className="mb-3 font-bold text-texto-suave">
              {duracion(totalHecho)} en {actividades.length} {actividades.length === 1 ? "actividad" : "actividades"}
            </p>
            <BarrasHorizontales
              max={hecho[0]!.minutos}
              filas={hecho.map((c) => ({ id: c.categoria_id ?? "sin", etiqueta: etiqueta(c.categoria_id), valor: c.minutos, texto: duracion(c.minutos) }))}
            />
          </>
        )}
      </section>

      <section className={`${claseTarjeta} p-4`} aria-label="Leyenda">
        <p className="flex items-center gap-2 font-bold">
          <span className="h-5 w-8 rounded-md border-2 border-b-[3px] border-cielo/60 bg-cielo-suave" aria-hidden />
          Tu plan (bloques)
        </p>
        <p className="mt-2 flex items-center gap-2 font-bold">
          <span className="h-5 w-8 rounded-md border-2 border-dashed border-violeta/70" aria-hidden />
          Lo que hiciste (bitácora)
        </p>
      </section>
    </aside>
  );
}
