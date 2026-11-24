"use client";

import { diaSemana, fechaEnZona, rutinaTocaba, sumarDias, type Fecha, type Rutina } from "@diarco/shared";
import { useHoy, useMarcarRutina, useRutinaHechasRango, useZonaHoraria } from "@diarco/shared/hooks";
import { Check } from "lucide-react";
import { fechaLarga } from "@/lib/formato";

const LETRAS = ["D", "L", "M", "X", "J", "V", "S"];

/**
 * Los últimos 7 días de una tarea de la rutina. Se pueden tocar para corregir
 * un olvido (por ejemplo, marcar ayer). Sin racha: solo muestra lo que hiciste.
 */
export function TiraRutina({ rutina }: { rutina: Rutina }) {
  const hoy = useHoy();
  const zona = useZonaHoraria();
  const desde = sumarDias(hoy, -6);
  const { data: hechas } = useRutinaHechasRango(desde, hoy);
  const marcar = useMarcarRutina();
  const creadaEl = fechaEnZona(new Date(rutina.creado_en), zona);
  const fechas: Fecha[] = Array.from({ length: 7 }, (_, i) => sumarDias(desde, i));
  const delaRutina = hechas?.get(rutina.id);
  const cuantas = fechas.filter((f) => delaRutina?.has(f)).length;

  return (
    <div>
      <p className="mb-1.5 flex justify-between text-xs font-extrabold text-texto-suave">
        <span>Últimos 7 días</span>
        <span>{cuantas === 1 ? "1 vez" : `${cuantas} veces`}</span>
      </p>
      <ul className="grid grid-cols-7 gap-1.5" aria-label={`Últimos 7 días de ${rutina.nombre}`}>
        {fechas.map((f) => {
          const letra = LETRAS[diaSemana(f)];
          const hecha = delaRutina?.has(f) ?? false;
          const tocaba = rutinaTocaba(rutina, f, creadaEl);
          const nombreDia = f === hoy ? "Hoy" : fechaLarga(f);
          const base = "flex h-12 w-full flex-col items-center justify-center rounded-xl text-[11px] leading-tight font-extrabold";
          // Un día que no tocaba solo se muestra (salvo que igual la hayas hecho: se puede desmarcar).
          if (!tocaba && !hecha) {
            return (
              <li key={f}>
                <span className={`${base} bg-superficie text-texto-suave/70`} role="img" aria-label={`${nombreDia}: no tocaba`} title={`${nombreDia}: no tocaba`}>
                  {letra}
                  <span className="text-sm">–</span>
                </span>
              </li>
            );
          }
          const etiqueta = `${nombreDia}: ${hecha ? "hecha. Toca para desmarcar" : "sin marcar. Toca si la hiciste"}`;
          return (
            <li key={f}>
              <button
                type="button"
                aria-pressed={hecha}
                aria-label={etiqueta}
                title={etiqueta}
                onClick={() => marcar.mutate({ rutinaId: rutina.id, fecha: f, hecha: !hecha })}
                className={`${base} border-2 border-b-4 transition-transform duration-100 active:translate-y-[2px] active:border-b-2 ${
                  hecha ? "border-verde-labio bg-verde text-white" : "border-borde-fuerte bg-tarjeta text-texto-suave"
                }`}
              >
                {letra}
                {hecha ? <Check className="size-4" strokeWidth={3.5} aria-hidden /> : <span className="text-sm">{Number(f.slice(8))}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {marcar.error && <p className="mt-1 text-sm font-bold text-peligro-texto">¡Uy! {marcar.error.message}</p>}
    </div>
  );
}
