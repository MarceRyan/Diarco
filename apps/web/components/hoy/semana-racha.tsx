"use client";

import { diaSemana, semanaDeRacha, type EstadoDiaRacha } from "@diarco/shared";
import { useHoy, useRachas } from "@diarco/shared/hooks";
import { Flame } from "lucide-react";
import { claseTarjeta, Esqueleto } from "@/components/ui/estados";

const LETRAS = ["D", "L", "M", "X", "J", "V", "S"];

const DESCRIPCION: Record<EstadoDiaRacha, string> = {
  cumplido: "sumó a tu racha",
  pendiente: "hoy, aún en juego",
  fallado: "no llegó al 70 %",
  libre: "sin hábitos programados",
  futuro: "todavía no llega",
};

/** Tira de lunes a domingo con una llamita en cada día que sumó a la racha general. */
export function SemanaRacha() {
  const hoy = useHoy();
  const { data: rachas } = useRachas();
  if (!rachas) return <Esqueleto className="h-36" />;

  const semana = semanaDeRacha(rachas.dias, hoy);
  const cumplidos = semana.filter((d) => d.estado === "cumplido").length;
  const conHabitos = semana.filter((d) => d.estado !== "libre" && d.estado !== "futuro").length;

  return (
    <section aria-labelledby="titulo-semana-racha" className={`${claseTarjeta} p-4`}>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id="titulo-semana-racha" className="font-titulo text-xl font-bold">
          Tu semana
        </h2>
        <p className="text-sm font-extrabold text-mandarina-texto">
          {cumplidos} de {conHabitos} {conHabitos === 1 ? "día" : "días"} 🔥
        </p>
      </div>
      <ol className="grid grid-cols-7 gap-1.5">
        {semana.map((d) => {
          const esHoy = d.fecha === hoy;
          return (
            <li key={d.fecha} className="flex flex-col items-center gap-1">
              <span className={`text-xs font-extrabold ${esHoy ? "text-mandarina-texto" : "text-texto-suave"}`}>
                {LETRAS[diaSemana(d.fecha)]}
              </span>
              <span
                role="img"
                aria-label={`${esHoy ? "Hoy" : LETRAS[diaSemana(d.fecha)]}: ${DESCRIPCION[d.estado]}`}
                className={`flex size-10 items-center justify-center rounded-full ${
                  d.estado === "cumplido"
                    ? "border-b-4 border-mandarina-labio bg-mandarina text-white"
                    : d.estado === "pendiente"
                      ? "border-2 border-dashed border-mandarina/70 text-mandarina-texto"
                      : d.estado === "fallado"
                        ? "bg-superficie-2 text-texto-suave"
                        : d.estado === "libre"
                          ? "bg-superficie text-texto-suave"
                          : "border-2 border-borde"
                }`}
              >
                {d.estado === "cumplido" || d.estado === "pendiente" ? (
                  <Flame className="size-5" strokeWidth={2.5} fill={d.estado === "cumplido" ? "currentColor" : "none"} />
                ) : d.estado === "libre" ? (
                  <span className="text-sm font-extrabold">–</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
