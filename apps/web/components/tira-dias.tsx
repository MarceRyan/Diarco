"use client";

import { diaSemana, historialReciente, type DiaHistorial } from "@diarco/shared";
import { useHoy, useMarcarHabito, useRachas } from "@diarco/shared/hooks";
import { Check } from "lucide-react";
import { fechaLarga } from "@/lib/formato";

const LETRAS = ["D", "L", "M", "X", "J", "V", "S"];

const DESCRIPCION: Record<DiaHistorial["estado"], string> = {
  cumplido: "hecho. Toca para desmarcar",
  pendiente: "pendiente. Toca para marcar",
  fallado: "sin marcar. Toca si lo hiciste",
  libre: "no tocaba",
  antes: "antes de crear el hábito",
};

/**
 * Los últimos 7 días de un hábito, tocables para corregir olvidos
 * (por ejemplo, marcar ayer). Los días no programados no se pueden marcar.
 */
export function TiraDias({ habitoId, nombre }: { habitoId: number; nombre: string }) {
  const hoy = useHoy();
  const { data: rachas } = useRachas();
  const marcar = useMarcarHabito();
  const info = rachas?.activos.find((a) => a.id === habitoId);
  if (!info) return <div className="h-14" aria-hidden />;

  const dias = historialReciente({ ...info, hoy });

  return (
    <div>
      <p className="mb-1.5 text-xs font-extrabold text-texto-suave">Últimos 7 días</p>
      <ul className="grid grid-cols-7 gap-1.5" aria-label={`Últimos 7 días de ${nombre}`}>
        {dias.map((d) => {
          const letra = LETRAS[diaSemana(d.fecha)];
          const numero = Number(d.fecha.slice(8));
          const etiqueta = `${d.fecha === hoy ? "Hoy" : fechaLarga(d.fecha)}: ${DESCRIPCION[d.estado]}`;
          const base =
            "flex h-14 w-full flex-col items-center justify-center rounded-xl text-[11px] leading-tight font-extrabold transition-transform duration-100";
          if (!d.marcable) {
            return (
              <li key={d.fecha}>
                <span className={`${base} bg-superficie text-texto-suave/70`} title={etiqueta} aria-label={etiqueta} role="img">
                  {letra}
                  <span className="text-sm">–</span>
                </span>
              </li>
            );
          }
          const hecho = d.estado === "cumplido";
          return (
            <li key={d.fecha}>
              <button
                type="button"
                aria-pressed={hecho}
                aria-label={etiqueta}
                title={etiqueta}
                onClick={() => marcar.mutate({ habitoId, fecha: d.fecha, completado: !hecho })}
                className={`${base} border-2 border-b-4 active:translate-y-[2px] active:border-b-2 ${
                  hecho
                    ? "border-verde-labio bg-verde text-white"
                    : d.estado === "pendiente"
                      ? "border-violeta/60 bg-violeta-suave text-violeta-texto"
                      : "border-borde-fuerte bg-tarjeta text-texto-suave"
                }`}
              >
                {letra}
                {hecho ? <Check className="size-4" strokeWidth={3.5} aria-hidden /> : <span className="text-sm">{numero}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {marcar.error && <p className="mt-1 text-sm font-bold text-peligro-texto">¡Uy! {marcar.error.message}</p>}
    </div>
  );
}
