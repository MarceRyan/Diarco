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
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
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

export function PantallaHorario() {
  const hoy = useHoy();
  const bloques = useBloques();
  const { data: categorias = [] } = useCategorias();
  const [dia, setDia] = useState<number>(() => diaSemana(hoy));
  const [edicion, setEdicion] = useState<Edicion>(null);

  const delDia = (d: number) => bloques.data?.filter((b) => b.dias_semana.includes(d)) ?? [];
  const categoriaDe = (b: BloqueHorario) => categorias.find((c) => c.id === b.categoria_id);
  const bloquesDia = delDia(dia);
  const minutosDia = bloquesDia.reduce((t, b) => t + horaAMinutos(b.fin) - horaAMinutos(b.inicio), 0);

  return (
    <>
      <Encabezado
        titulo="Tu semana"
        subtitulo="Toca un día para ver su agenda; toca una hora libre para agregar algo."
        accion={
          <Boton onClick={() => setEdicion({ dia })}>
            <Plus className="size-5" strokeWidth={3} aria-hidden />
            Agregar bloque
          </Boton>
        }
      />

      {bloques.isPending ? (
        <CargandoLista filas={4} alto="h-20" />
      ) : bloques.error ? (
        <MensajeError error={bloques.error} onReintentar={() => bloques.refetch()} />
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
