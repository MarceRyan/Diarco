"use client";

import { DIAS_PARA_DORMIR, diaSemana, ETAPAS_CHISPA, type Estacion } from "@diarco/shared";
import { useEvolucionChispa } from "@diarco/shared/hooks";
import { CalendarCheck, Flame } from "lucide-react";
import { ChispaEvolutiva } from "./chispa-evolutiva";
import { claseTarjeta, Esqueleto, MensajeError } from "./ui/estados";
import { fechaCorta } from "@/lib/formato";

const ESTACIONES: Record<Estacion, { nombre: string; emoji: string; fondo: string }> = {
  primavera: { nombre: "Primavera", emoji: "🌸", fondo: "bg-verde-suave" },
  verano: { nombre: "Verano", emoji: "😎", fondo: "bg-amarillo-suave" },
  otono: { nombre: "Otoño", emoji: "🍂", fondo: "bg-mandarina-suave" },
  invierno: { nombre: "Invierno", emoji: "❄️", fondo: "bg-cielo-suave" },
};

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Etapas que llevan artículo masculino ("un fueguito", "un volcán"). */
const ETAPAS_MASCULINAS = new Set<string>(["Fueguito", "Volcán"]);

/** Chispa crece con tu leña: escena, etapa, avance y cómo ganar más. */
export function TuChispa() {
  const { data, error, refetch } = useEvolucionChispa();
  if (error) return <MensajeError error={error} onReintentar={() => refetch()} />;
  if (!data) return <Esqueleto className="h-72" />;

  const { lena, etapa, estacion, diasSinLena } = data;
  const dormida = diasSinLena !== null && diasSinLena >= DIAS_PARA_DORMIR;
  const est = ESTACIONES[estacion];
  const faltan = etapa.siguiente ? etapa.siguiente.desde - lena : 0;

  return (
    <section aria-labelledby="titulo-chispa" className={`${claseTarjeta} grid overflow-hidden md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]`}>
      {/* Escenario con el color de la estación */}
      <div className={`flex items-end justify-center ${est.fondo} px-4 pt-4`}>
        <ChispaEvolutiva etapa={etapa.numero} estacion={estacion} dormida={dormida} tamano={240} />
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-mandarina-suave px-3 py-1 text-sm font-extrabold text-mandarina-texto">
            Etapa {etapa.numero} de 10
          </span>
          <span className="rounded-full bg-superficie px-3 py-1 text-sm font-extrabold">
            {est.emoji} {est.nombre}
          </span>
        </div>
        <div>
          <h2 id="titulo-chispa" className="font-titulo text-4xl leading-tight font-extrabold">
            Tu Chispa es {ETAPAS_MASCULINAS.has(etapa.nombre) ? "un" : "una"} {etapa.nombre.toLowerCase()}
          </h2>
          <p className="mt-1 text-lg font-bold text-texto-suave">🪵 {lena} {lena === 1 ? "leño" : "leños"} en total</p>
        </div>

        {dormida && (
          <p className="rounded-2xl bg-superficie p-3 font-bold">
            😴 Chispa se quedó dormida: hace {diasSinLena} días que no recibe leña. ¡Un hábito cumplido la despierta!
          </p>
        )}

        {/* Avance hacia la siguiente etapa */}
        {etapa.siguiente ? (
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-2 text-sm font-extrabold">
              <span>Siguiente: {etapa.siguiente.nombre}</span>
              <span className="text-texto-suave">
                te faltan {faltan} {faltan === 1 ? "leño" : "leños"}
              </span>
            </div>
            <div
              className="h-4 overflow-hidden rounded-full bg-superficie-2"
              role="progressbar"
              aria-valuenow={lena - etapa.desde}
              aria-valuemin={0}
              aria-valuemax={etapa.siguiente.desde - etapa.desde}
              aria-label={`Avance hacia ${etapa.siguiente.nombre}`}
            >
              <div className="h-full rounded-full bg-mandarina" style={{ width: `${Math.max(etapa.progreso * 100, 3)}%` }} />
            </div>
          </div>
        ) : (
          <p className="font-bold text-mandarina-texto">¡Llegaste a la última etapa! Chispa brilla como una estrella. ⭐</p>
        )}

        {/* Camino de las 10 etapas */}
        <ol className="flex flex-wrap gap-1.5" aria-label="Etapas de Chispa">
          {ETAPAS_CHISPA.map((x, i) => {
            const n = i + 1;
            const alcanzada = n <= etapa.numero;
            return (
              <li
                key={x.nombre}
                title={`${x.nombre} · desde ${x.desde} leños`}
                aria-label={`${x.nombre}: ${alcanzada ? "alcanzada" : `desde ${x.desde} leños`}`}
                className={`flex size-8 items-center justify-center rounded-full text-xs font-extrabold ${
                  n === etapa.numero
                    ? "border-b-4 border-mandarina-labio bg-mandarina text-white"
                    : alcanzada
                      ? "bg-mandarina-suave text-mandarina-texto"
                      : "bg-superficie text-texto-suave"
                }`}
              >
                {n}
              </li>
            );
          })}
        </ol>

        <p className="text-sm text-texto-suave">
          <strong className="text-texto">Cómo ganar leña:</strong> 1 leño por cada hábito cumplido, cada día que registras tu
          ánimo y cada actividad en tu bitácora. Chispa nunca se apaga ni vuelve atrás.
        </p>
      </div>
    </section>
  );
}

/** Álbum de las últimas semanas: leña, cumplimiento, días que sumaron y mejor día. */
export function CosechaSemanal() {
  const { data } = useEvolucionChispa();
  if (!data) return <Esqueleto className="h-48" />;

  return (
    <section aria-labelledby="titulo-cosecha">
      <h2 id="titulo-cosecha" className="mb-1 font-titulo text-2xl font-bold">
        Cosecha semanal
      </h2>
      <p className="mb-4 text-texto-suave">Lo que juntaste cada semana. La de esta semana se sigue llenando.</p>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.cosechas.map((c) => (
          <li key={c.semana} className={`${claseTarjeta} space-y-2 p-4 ${c.enCurso ? "border-mandarina/50" : ""}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-extrabold">Semana del {fechaCorta(c.semana)}</p>
              {c.enCurso && (
                <span className="rounded-full bg-mandarina px-2 py-0.5 text-xs font-extrabold text-white">en curso</span>
              )}
            </div>
            <p className="font-titulo text-3xl font-extrabold text-mandarina-texto">🪵 {c.lena}</p>
            <ul className="space-y-1 text-sm font-bold text-texto-suave">
              <li className="flex items-center gap-2">
                <CalendarCheck className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
                {c.cumplimiento === null ? "Sin hábitos programados" : `${Math.round(c.cumplimiento * 100)} % de tus hábitos`}
              </li>
              <li className="flex items-center gap-2">
                <Flame className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
                {c.diasQueSumaron} {c.diasQueSumaron === 1 ? "día sumó" : "días sumaron"} a tu racha
              </li>
              {c.mejorDia && <li>⭐ Mejor día: {DIAS[diaSemana(c.mejorDia)]}</li>}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
