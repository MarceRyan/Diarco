"use client";

import { CATALOGO_LOGROS, GRUPOS_LOGRO, progresoLogros, type GrupoLogro, type ProgresoLogro } from "@diarco/shared";
import { useContextoLogros, useLogros, useTotalesLogros } from "@diarco/shared/hooks";
import {
  CheckCheck,
  Flame,
  LayoutGrid,
  Lock,
  NotebookPen,
  Smile,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Chispa } from "@/components/chispa";
import { CargandoLista, claseTarjeta, Encabezado, MensajeError } from "@/components/ui/estados";

const formatoFecha = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" });

const ICONO_GRUPO: Record<GrupoLogro, LucideIcon> = {
  rachas: Flame,
  constancia: CheckCheck,
  bitacora: NotebookPen,
  animo: Smile,
  organizacion: LayoutGrid,
  especiales: Sparkles,
};

type FiltroEstado = "todas" | "ganadas" | "pendientes";

/** Logro listo para mostrar: catálogo + fecha de obtención + progreso. */
interface LogroVista {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  grupo: GrupoLogro;
  obtenido_en: string | null;
  progreso: ProgresoLogro | undefined;
}

const claseChip =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-b-4 border-borde bg-tarjeta px-4 font-extrabold text-texto-suave transition-transform duration-100 active:translate-y-[2px] active:border-b-2 aria-pressed:border-amarillo-labio aria-pressed:bg-amarillo aria-pressed:text-[#2a2342]";

export function PantallaLogros() {
  const logros = useLogros();
  const contexto = useContextoLogros();
  const [grupo, setGrupo] = useState<GrupoLogro | "todos">("todos");
  const [estado, setEstado] = useState<FiltroEstado>("todas");

  const totales = useTotalesLogros();

  // El catálogo vive en el código (siempre completo); la base solo dice cuáles ganaste.
  const vista = useMemo<LogroVista[] | undefined>(() => {
    if (!logros.data) return undefined;
    const progreso = new Map((contexto ? progresoLogros(contexto) : []).map((p) => [p.codigo as string, p]));
    const enBase = new Map(logros.data.map((l) => [l.codigo, l]));
    return CATALOGO_LOGROS.map((l, i) => {
      const fila = enBase.get(l.codigo);
      return {
        id: fila?.id ?? -(i + 1), // sin fila en la base: no se puede registrar aún
        codigo: l.codigo,
        nombre: l.nombre,
        descripcion: l.descripcion,
        grupo: l.grupo,
        obtenido_en: fila?.obtenido_en ?? null,
        progreso: progreso.get(l.codigo),
      };
    });
  }, [logros.data, contexto]);

  if (logros.isPending) return <CargandoLista filas={5} alto="h-24" />;
  if (logros.error || !vista) return <MensajeError error={logros.error} onReintentar={() => logros.refetch()} />;

  // La base está desactualizada si le faltan logros del catálogo o la función de totales.
  const faltanEnBase = vista.filter((l) => l.id < 0).length;
  const baseDesactualizada = faltanEnBase > 0 || Boolean(totales.error);

  const ganadas = vista.filter((l) => l.obtenido_en);
  const total = vista.length;
  // Los 3 pendientes más cerca de cumplirse (con algo de avance).
  const casi = vista
    .filter((l) => !l.obtenido_en && l.progreso && l.progreso.valor > 0)
    .sort((a, b) => b.progreso!.valor / b.progreso!.meta - a.progreso!.valor / a.progreso!.meta)
    .slice(0, 3);

  const visibles = vista.filter(
    (l) =>
      (grupo === "todos" || l.grupo === grupo) &&
      (estado === "todas" || (estado === "ganadas" ? l.obtenido_en : !l.obtenido_en)),
  );
  const gruposVisibles = GRUPOS_LOGRO.filter((g) => visibles.some((l) => l.grupo === g.id));

  return (
    <>
      <Encabezado titulo="Tus logros" subtitulo="Cada medalla es una prueba de tu constancia." />

      <div className="space-y-8">
        {baseDesactualizada && (
          <div role="alert" className="rounded-[20px] border-2 border-mandarina/50 bg-mandarina-suave p-4">
            <p className="font-titulo text-xl font-bold">Tu base de datos necesita actualizarse</p>
            <p className="mt-1 text-texto-suave">
              {faltanEnBase > 0
                ? `Faltan ${faltanEnBase} logros en la base, así que todavía no se pueden ganar.`
                : "Falta la función que cuenta tu historial, así que no se ve el progreso."}{" "}
              Aplica las migraciones nuevas desde la carpeta del proyecto:
            </p>
            <code className="mt-2 block rounded-xl bg-tarjeta px-3 py-2 text-sm font-bold">pnpm exec supabase db push --remote</code>
          </div>
        )}

        {/* Resumen con Chispa y avance por grupo */}
        <section className={`${claseTarjeta} grid gap-5 bg-amarillo-suave p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]`} aria-label="Resumen de logros">
          <div className="flex items-center gap-4">
            <Chispa estado={ganadas.length > 0 ? "celebrando" : "feliz"} tamano={76} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-titulo text-3xl font-extrabold text-amarillo-texto">
                {ganadas.length} de {total} medallas
              </p>
              <p className="font-bold">
                {ganadas.length === 0
                  ? "Marca tu primer hábito en Hoy para ganar «Primer paso»."
                  : ganadas.length === total
                    ? "¡Las tienes todas! Eres una leyenda."
                    : "¡Vas muy bien! Cada día suma."}
              </p>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-tarjeta" aria-hidden>
                <div className="h-full rounded-full bg-amarillo" style={{ width: `${(ganadas.length / total) * 100}%` }} />
              </div>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Medallas por grupo">
            {GRUPOS_LOGRO.map((g) => {
              const Icono = ICONO_GRUPO[g.id];
              const delGrupo = vista.filter((l) => l.grupo === g.id);
              return (
                <li key={g.id} className="flex items-center gap-2 rounded-2xl bg-tarjeta px-3 py-2">
                  <Icono className="size-5 shrink-0 text-amarillo-texto" strokeWidth={2.5} aria-hidden />
                  <span className="min-w-0 flex-1 truncate font-bold">{g.nombre}</span>
                  <span className="font-extrabold tabular-nums text-texto-suave">
                    {delGrupo.filter((l) => l.obtenido_en).length}/{delGrupo.length}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Los más cercanos */}
        {casi.length > 0 && (
          <section aria-labelledby="titulo-casi">
            <h2 id="titulo-casi" className="mb-3 font-titulo text-2xl font-bold">
              ¡Casi lo tienes!
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {casi.map((l) => (
                <TarjetaLogro key={l.id} logro={l} />
              ))}
            </ul>
          </section>
        )}

        {/* Filtros */}
        <div className="space-y-3">
          <div role="group" aria-label="Filtrar por grupo" className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={grupo === "todos"} onClick={() => setGrupo("todos")} className={claseChip}>
              Todos
            </button>
            {GRUPOS_LOGRO.map((g) => {
              const Icono = ICONO_GRUPO[g.id];
              return (
                <button key={g.id} type="button" aria-pressed={grupo === g.id} onClick={() => setGrupo(g.id)} className={claseChip}>
                  <Icono className="size-4" strokeWidth={2.5} aria-hidden />
                  {g.nombre}
                </button>
              );
            })}
          </div>
          <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
            {(
              [
                { id: "todas", nombre: "Todas" },
                { id: "ganadas", nombre: `Ganadas (${ganadas.length})` },
                { id: "pendientes", nombre: `Por ganar (${total - ganadas.length})` },
              ] as const
            ).map((e) => (
              <button key={e.id} type="button" aria-pressed={estado === e.id} onClick={() => setEstado(e.id)} className={claseChip}>
                {e.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Medallas agrupadas */}
        {visibles.length === 0 ? (
          <p className={`${claseTarjeta} p-5 text-center text-texto-suave`}>
            {estado === "ganadas" ? "Aún no ganas medallas en este grupo. ¡Ya llegarán!" : "No hay medallas con estos filtros."}
          </p>
        ) : (
          gruposVisibles.map((g) => {
            const Icono = ICONO_GRUPO[g.id];
            const lista = visibles.filter((l) => l.grupo === g.id);
            return (
              <section key={g.id} aria-labelledby={`grupo-${g.id}`}>
                <h2 id={`grupo-${g.id}`} className="mb-3 flex items-center gap-2 font-titulo text-2xl font-bold">
                  <Icono className="size-6 text-amarillo-texto" strokeWidth={2.5} aria-hidden />
                  {g.nombre}
                  <span className="text-base text-texto-suave">
                    {lista.filter((l) => l.obtenido_en).length}/{lista.length}
                  </span>
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {lista.map((l) => (
                    <TarjetaLogro key={l.id} logro={l} />
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </>
  );
}

function TarjetaLogro({ logro }: { logro: LogroVista }) {
  const ganada = logro.obtenido_en !== null;
  const Icono = ICONO_GRUPO[logro.grupo];
  const p = logro.progreso;
  const porcentaje = p ? Math.round((p.valor / p.meta) * 100) : 0;

  return (
    <li className={`${claseTarjeta} flex items-center gap-4 p-4`}>
      <span
        aria-hidden
        className={`relative flex size-16 shrink-0 items-center justify-center rounded-full border-b-4 ${
          ganada ? "border-amarillo-labio bg-amarillo text-[#2a2342]" : "border-borde-fuerte bg-superficie-2 text-texto-suave"
        }`}
      >
        <Icono className="size-7" strokeWidth={2.5} />
        {!ganada && (
          <span className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-tarjeta ring-2 ring-borde-fuerte">
            <Lock className="size-3.5" strokeWidth={3} />
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-titulo text-xl leading-tight font-bold">{logro.nombre}</p>
        <p className="text-texto-suave">{logro.descripcion}</p>
        {ganada ? (
          <p className="mt-1 text-sm font-extrabold text-amarillo-texto">{formatoFecha.format(new Date(logro.obtenido_en!))}</p>
        ) : (
          p && (
            <div className="mt-2 flex items-center gap-2">
              <div
                className="h-3 flex-1 overflow-hidden rounded-full bg-superficie-2"
                role="progressbar"
                aria-valuenow={p.valor}
                aria-valuemin={0}
                aria-valuemax={p.meta}
                aria-label={`Progreso de ${logro.nombre}`}
              >
                <div className="h-full rounded-full bg-amarillo" style={{ width: `${porcentaje}%` }} />
              </div>
              <span className="shrink-0 text-sm font-extrabold text-texto-suave tabular-nums">
                {p.valor}/{p.meta}
              </span>
            </div>
          )
        )}
      </div>
    </li>
  );
}
