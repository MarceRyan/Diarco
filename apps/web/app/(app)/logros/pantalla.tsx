"use client";

import { DIAS_BITACORA_CONSTANTE, DIAS_BUEN_ANIMO, maximoDiasConsecutivos } from "@diarco/shared";
import { DIAS_REVISION_LOGROS, useActividadesRango, useAnimoRango, useLogros, useRachas, useRango } from "@diarco/shared/hooks";
import { Award, Lock } from "lucide-react";
import { CargandoLista, Encabezado, MensajeError } from "@/components/ui/estados";

const formatoFecha = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" });

export function PantallaLogros() {
  const logros = useLogros();
  const { data: rachas } = useRachas();
  const { desde, hasta } = useRango(DIAS_REVISION_LOGROS);
  const { data: actividades } = useActividadesRango(desde, hasta);
  const { data: animo } = useAnimoRango(desde, hasta);

  /** Progreso medible de cada logro pendiente: [valor actual, meta]. */
  const progreso = (codigo: string): [number, number] | null => {
    if (!rachas) return null;
    const mejor = Math.max(0, ...[...rachas.porHabito.values()].map((r) => r.maxima));
    const racha = /^racha_(\d+)$/.exec(codigo);
    if (racha) return [mejor, Number(racha[1])];
    if (codigo === "bitacora_constante" && actividades)
      return [maximoDiasConsecutivos(actividades.map((a) => a.fecha)), DIAS_BITACORA_CONSTANTE];
    if (codigo === "buen_animo" && animo) return [maximoDiasConsecutivos(animo.map((a) => a.fecha)), DIAS_BUEN_ANIMO];
    return null;
  };

  const obtenidos = logros.data?.filter((l) => l.obtenido_en) ?? [];
  const pendientes = logros.data?.filter((l) => !l.obtenido_en) ?? [];

  return (
    <>
      <Encabezado
        titulo="Logros"
        subtitulo={logros.data ? `${obtenidos.length} de ${logros.data.length} desbloqueados` : undefined}
      />

      {logros.isPending ? (
        <CargandoLista filas={5} />
      ) : logros.error ? (
        <MensajeError error={logros.error} onReintentar={() => logros.refetch()} />
      ) : (
        <div className="space-y-8">
          {obtenidos.length === 0 && (
            <p className="rounded-2xl border border-dashed border-borde p-4 text-sm text-texto-suave">
              Aún no tienes logros. Marca tu primer hábito en <strong>Hoy</strong> para desbloquear «Primer paso».
            </p>
          )}

          {obtenidos.length > 0 && (
            <section aria-labelledby="titulo-obtenidos">
              <h2 id="titulo-obtenidos" className="mb-3 font-titulo text-lg font-semibold">
                Desbloqueados
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {obtenidos.map((l) => (
                  <li key={l.id} className="flex gap-4 rounded-2xl bg-mandarina-suave p-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-fondo text-mandarina-texto" aria-hidden>
                      <Award className="size-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold">{l.nombre}</p>
                      <p className="text-sm text-texto-suave">{l.descripcion}</p>
                      <p className="mt-1 text-xs text-texto-suave">
                        Obtenido el {formatoFecha.format(new Date(l.obtenido_en!))}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pendientes.length > 0 && (
            <section aria-labelledby="titulo-pendientes">
              <h2 id="titulo-pendientes" className="mb-3 font-titulo text-lg font-semibold">
                Por desbloquear
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {pendientes.map((l) => {
                  const p = progreso(l.codigo);
                  const porcentaje = p ? Math.min(100, Math.round((p[0] / p[1]) * 100)) : null;
                  return (
                    <li key={l.id} className="flex gap-4 rounded-2xl border border-borde p-4">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-superficie text-texto-suave" aria-hidden>
                        <Lock className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{l.nombre}</p>
                        <p className="text-sm text-texto-suave">{l.descripcion}</p>
                        {p && porcentaje !== null && (
                          <div className="mt-2">
                            <div
                              className="h-1.5 overflow-hidden rounded-full bg-violeta-suave"
                              role="progressbar"
                              aria-valuenow={Math.min(p[0], p[1])}
                              aria-valuemin={0}
                              aria-valuemax={p[1]}
                              aria-label={`Progreso de ${l.nombre}`}
                            >
                              <div className="h-full rounded-full bg-violeta" style={{ width: `${porcentaje}%` }} />
                            </div>
                            <p className="mt-1 text-xs text-texto-suave">
                              {Math.min(p[0], p[1])} de {p[1]} días
                            </p>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  );
}
