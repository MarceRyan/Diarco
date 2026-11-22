"use client";

import { rutinasDelDia } from "@diarco/shared";
import { useHoy, useMarcarRutina, useRutinaHechas, useRutinas } from "@diarco/shared/hooks";
import { Check, Plus } from "lucide-react";
import Link from "next/link";
import { claseTarjeta, Esqueleto, MensajeError } from "@/components/ui/estados";

/**
 * Rutina de hoy: tareas de cada día sin hora ni racha (tender la cama, lavar
 * los platos). Se marcan con un toque y no afectan rachas ni logros.
 */
export function RutinaHoy() {
  const hoy = useHoy();
  const rutinas = useRutinas();
  const hechas = useRutinaHechas(hoy);
  const marcar = useMarcarRutina();

  if (rutinas.isPending) return <Esqueleto className="h-28" />;
  if (rutinas.error) return <MensajeError error={rutinas.error} onReintentar={() => rutinas.refetch()} />;

  // Sin rutina todavía: una invitación discreta.
  if (rutinas.data.length === 0) {
    return (
      <Link
        href="/habitos#rutina"
        className={`${claseTarjeta} flex items-center gap-3 border-dashed p-4 text-texto-suave transition-colors hover:border-borde-fuerte hover:text-texto`}
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-superficie text-xl" aria-hidden>
          🧹
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold text-texto">¿Tareas de cada día sin racha?</span>
          Tender la cama, lavar los platos… arma tu rutina.
        </span>
        <Plus className="size-5 shrink-0" strokeWidth={3} aria-hidden />
      </Link>
    );
  }

  const deHoy = rutinasDelDia(rutinas.data, hoy);
  if (deHoy.length === 0) return null;
  const hechasHoy = deHoy.filter((r) => hechas.data?.has(r.id)).length;

  return (
    <section aria-labelledby="titulo-rutina">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="titulo-rutina" className="font-titulo text-2xl font-bold">
          Rutina de hoy
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-extrabold text-texto-suave tabular-nums">
            {hechasHoy} de {deHoy.length}
          </span>
          <Link href="/habitos#rutina" className="inline-flex min-h-11 items-center font-extrabold text-verde-texto">
            Editar
          </Link>
        </div>
      </div>
      {marcar.error && (
        <div className="mb-3">
          <MensajeError error={marcar.error} />
        </div>
      )}
      <ul className="grid gap-2 sm:grid-cols-2">
        {deHoy.map((r) => {
          const hecha = hechas.data?.has(r.id) ?? false;
          return (
            <li key={r.id}>
              <button
                type="button"
                aria-pressed={hecha}
                onClick={() => marcar.mutate({ rutinaId: r.id, fecha: hoy, hecha: !hecha })}
                className={`${claseTarjeta} flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left transition-[transform,background-color,border-color] duration-100 active:translate-y-[2px] active:border-b-2 ${
                  hecha ? "border-verde/40 bg-verde-suave" : "hover:border-borde-fuerte"
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  {r.icono}
                </span>
                <span className={`min-w-0 flex-1 truncate font-bold ${hecha ? "text-verde-texto line-through decoration-2" : ""}`}>
                  {r.nombre}
                </span>
                <span
                  aria-hidden
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${
                    hecha ? "border-verde bg-verde text-white" : "border-borde-fuerte"
                  }`}
                >
                  {hecha && <Check className="size-5" strokeWidth={3.5} />}
                </span>
                <span className="sr-only">{hecha ? "Hecha. Toca para desmarcar." : "Toca para marcarla como hecha."}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
