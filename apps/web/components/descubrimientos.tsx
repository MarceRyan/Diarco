"use client";

import { descubrimientosAnimo, sumarDias, textoDescubrimiento } from "@diarco/shared";
import { useAnimoRango, useHabitos, useHoy, useRachas } from "@diarco/shared/hooks";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Chispa } from "./chispa";
import { claseTarjeta, Esqueleto } from "./ui/estados";

const DIAS = 90;
const MINIMO_REGISTROS = 7;

/** Todos los patrones entre tu ánimo y tus hábitos/etiquetas (pantalla Progreso). */
export function DescubrimientosAnimo() {
  const hoy = useHoy();
  const historial = useAnimoRango(sumarDias(hoy, -(DIAS - 1)), hoy);
  const { data: rachas } = useRachas();
  const { data: habitos = [] } = useHabitos();
  if (!historial.data || !rachas) return <Esqueleto className="h-40" />;

  const registros = historial.data.length;
  const lista = registros >= MINIMO_REGISTROS ? descubrimientosAnimo({ animo: historial.data, habitos: rachas.activos }) : [];
  const nombre = (id: number) => habitos.find((h) => h.id === id)?.nombre;

  return (
    <section aria-labelledby="titulo-descubrimientos" className={`${claseTarjeta} p-4 sm:p-5`}>
      <h2 id="titulo-descubrimientos" className="font-titulo text-xl font-bold">
        Lo que mejora tu ánimo
      </h2>
      <p className="mb-4 text-texto-suave">Patrones de los últimos {DIAS} días entre tu ánimo, tus hábitos y lo que marcaste que influyó.</p>
      {lista.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl bg-violeta-suave p-3">
          <Chispa tamano={44} animada={false} className="shrink-0" />
          <p className="font-bold">
            {registros < MINIMO_REGISTROS
              ? `Registra tu ánimo en Hoy unos días más (${registros} de ${MINIMO_REGISTROS}) y aquí verás qué lo mejora.`
              : "Aún no hay un patrón claro. Marca qué influyó cada día y aparecerán."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-2 lg:grid-cols-2">
          {lista.map((d) => {
            const sube = d.diferencia > 0;
            const Icono = sube ? TrendingUp : TrendingDown;
            return (
              <li key={`${d.tipo}-${d.clave}`} className="flex items-start gap-3 rounded-2xl bg-superficie p-3">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${sube ? "bg-verde text-white" : "bg-mandarina text-white"}`}
                  aria-hidden
                >
                  <Icono className="size-5" strokeWidth={2.5} />
                </span>
                <span>
                  <span className="block font-bold">{textoDescubrimiento(d, nombre)}</span>
                  <span className="text-sm text-texto-suave">
                    Basado en {d.diasCon} {d.diasCon === 1 ? "día" : "días"} con y {d.diasSin} sin.
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
