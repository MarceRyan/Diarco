"use client";

import { DIAS_BITACORA_CONSTANTE, DIAS_BUEN_ANIMO, maximoDiasConsecutivos } from "@diarco/shared";
import { DIAS_REVISION_LOGROS, useActividadesRango, useAnimoRango, useLogros, useRachas, useRango } from "@diarco/shared/hooks";
import { Award, Lock } from "lucide-react";
import { Chispa } from "@/components/chispa";
import { CargandoLista, claseTarjeta, Encabezado, MensajeError } from "@/components/ui/estados";

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
  const total = logros.data?.length ?? 0;

  return (
    <>
      <Encabezado titulo="Tus logros" />

      {logros.isPending ? (
        <CargandoLista filas={5} alto="h-24" />
      ) : logros.error ? (
        <MensajeError error={logros.error} onReintentar={() => logros.refetch()} />
      ) : (
        <div className="space-y-8">
          {/* Resumen con Chispa */}
          <section className={`${claseTarjeta} flex items-center gap-4 bg-amarillo-suave p-5`} aria-label="Resumen de logros">
            <Chispa estado={obtenidos.length > 0 ? "celebrando" : "feliz"} tamano={72} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-titulo text-3xl font-extrabold text-amarillo-texto">
                {obtenidos.length} de {total} medallas
              </p>
              <p className="font-bold">
                {obtenidos.length === 0
                  ? "Marca tu primer hábito en Hoy para ganar «Primer paso»."
                  : obtenidos.length === total
                    ? "¡Las tienes todas! Eres una leyenda."
                    : "¡Vas muy bien! Sigue sumando días."}
              </p>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-tarjeta" aria-hidden>
                <div
                  className="h-full rounded-full bg-amarillo"
                  style={{ width: `${total > 0 ? (obtenidos.length / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </section>

          {obtenidos.length > 0 && (
            <section aria-labelledby="titulo-obtenidos">
              <h2 id="titulo-obtenidos" className="mb-3 font-titulo text-2xl font-bold">
                Ganadas
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {obtenidos.map((l) => (
                  <li key={l.id} className={`${claseTarjeta} flex items-center gap-4 p-4`}>
                    <Medalla ganada />
                    <div className="min-w-0">
                      <p className="font-titulo text-xl font-bold">{l.nombre}</p>
                      <p className="text-texto-suave">{l.descripcion}</p>
                      <p className="mt-1 text-sm font-extrabold text-amarillo-texto">
                        {formatoFecha.format(new Date(l.obtenido_en!))}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pendientes.length > 0 && (
            <section aria-labelledby="titulo-pendientes">
              <h2 id="titulo-pendientes" className="mb-3 font-titulo text-2xl font-bold">
                Por ganar
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {pendientes.map((l) => {
                  const p = progreso(l.codigo);
                  const porcentaje = p ? Math.min(100, Math.round((p[0] / p[1]) * 100)) : null;
                  return (
                    <li key={l.id} className={`${claseTarjeta} flex items-center gap-4 p-4`}>
                      <Medalla />
                      <div className="min-w-0 flex-1">
                        <p className="font-titulo text-xl font-bold">{l.nombre}</p>
                        <p className="text-texto-suave">{l.descripcion}</p>
                        {p && porcentaje !== null && (
                          <div className="mt-2 flex items-center gap-2">
                            <div
                              className="h-3 flex-1 overflow-hidden rounded-full bg-superficie-2"
                              role="progressbar"
                              aria-valuenow={Math.min(p[0], p[1])}
                              aria-valuemin={0}
                              aria-valuemax={p[1]}
                              aria-label={`Progreso de ${l.nombre}`}
                            >
                              <div className="h-full rounded-full bg-amarillo" style={{ width: `${porcentaje}%` }} />
                            </div>
                            <span className="shrink-0 text-sm font-extrabold text-texto-suave tabular-nums">
                              {Math.min(p[0], p[1])}/{p[1]}
                            </span>
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

/** Medalla redonda con labio: dorada si se ganó, gris con candado si no. */
function Medalla({ ganada = false }: { ganada?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex size-16 shrink-0 items-center justify-center rounded-full border-b-4 ${
        ganada ? "border-amarillo-labio bg-amarillo text-[#2a2342]" : "border-borde-fuerte bg-superficie-2 text-texto-suave"
      }`}
    >
      {ganada ? <Award className="size-8" strokeWidth={2.5} /> : <Lock className="size-6" strokeWidth={2.5} />}
    </span>
  );
}
