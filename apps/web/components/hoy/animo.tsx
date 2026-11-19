"use client";

import {
  descubrimientosAnimo,
  diaSemana,
  ETIQUETAS_ANIMO,
  MAX_ETIQUETAS_ANIMO,
  rangoFechas,
  sumarDias,
  textoDescubrimiento,
  type EtiquetaAnimo,
} from "@diarco/shared";
import { useAnimo, useAnimoRango, useGuardarAnimo, useHabitos, useHoy, useRachas } from "@diarco/shared/hooks";
import { Sparkles } from "lucide-react";
import { Chispa } from "@/components/chispa";
import { claseTarjeta, MensajeError } from "@/components/ui/estados";

export const NIVELES = [
  { nivel: 1, emoji: "😞", nombre: "Mal" },
  { nivel: 2, emoji: "🙁", nombre: "Regular" },
  { nivel: 3, emoji: "😐", nombre: "Normal" },
  { nivel: 4, emoji: "🙂", nombre: "Bien" },
  { nivel: 5, emoji: "😄", nombre: "¡Genial!" },
];

const LETRAS = ["D", "L", "M", "X", "J", "V", "S"];
/** Días que se revisan para encontrar patrones. */
const DIAS_PATRONES = 90;
/** Registros mínimos antes de intentar sacar conclusiones. */
const MINIMO_REGISTROS = 7;

/**
 * Ánimo con sentido: elegir cómo te sientes, qué influyó, ver tu semana y lo
 * que Chispa descubrió al cruzar tu ánimo con tus hábitos y etiquetas.
 */
export function Animo() {
  const hoy = useHoy();
  const animoHoy = useAnimo(hoy);
  const guardar = useGuardarAnimo();
  const desde = sumarDias(hoy, -(DIAS_PATRONES - 1));
  const historial = useAnimoRango(desde, hoy);
  const { data: rachas } = useRachas();
  const { data: habitos = [] } = useHabitos();

  // Lo que se muestra mientras se guarda (actualización optimista).
  const pendiente = guardar.isPending ? guardar.variables : undefined;
  const nivel = pendiente?.nivel ?? animoHoy.data?.nivel;
  const etiquetas: readonly string[] = pendiente?.etiquetas ?? animoHoy.data?.etiquetas ?? [];

  function elegirNivel(n: number) {
    // Sin `etiquetas`: se conservan las que ya tenía el día.
    guardar.mutate({ fecha: hoy, nivel: n, nota: null });
  }

  function alternarEtiqueta(id: EtiquetaAnimo) {
    if (!nivel) return;
    const nuevas = etiquetas.includes(id)
      ? etiquetas.filter((e) => e !== id)
      : etiquetas.length < MAX_ETIQUETAS_ANIMO
        ? [...etiquetas, id]
        : etiquetas;
    guardar.mutate({ fecha: hoy, nivel, nota: null, etiquetas: nuevas as EtiquetaAnimo[] });
  }

  // Últimos 7 días (incluye hoy).
  const porFecha = new Map((historial.data ?? []).map((a) => [a.fecha, a.nivel]));
  const semana = rangoFechas(sumarDias(hoy, -6), hoy);

  // Descubrimientos: ánimo × hábitos y etiquetas en los últimos 90 días.
  const registros = historial.data?.length ?? 0;
  const descubrimientos =
    historial.data && rachas && registros >= MINIMO_REGISTROS
      ? descubrimientosAnimo({ animo: historial.data, habitos: rachas.activos }).slice(0, 2)
      : [];
  const nombreHabito = (id: number) => habitos.find((h) => h.id === id)?.nombre;

  return (
    <section aria-labelledby="titulo-animo" className={`${claseTarjeta} space-y-4 p-4`}>
      <h2 id="titulo-animo" className="font-titulo text-xl font-bold">
        ¿Cómo te sientes hoy?
      </h2>
      {guardar.error && <MensajeError error={guardar.error} />}

      <div className="grid grid-cols-5 gap-1.5" role="group" aria-labelledby="titulo-animo">
        {NIVELES.map((n) => (
          <button
            key={n.nivel}
            type="button"
            aria-pressed={nivel === n.nivel}
            aria-label={n.nombre}
            disabled={animoHoy.isPending}
            onClick={() => elegirNivel(n.nivel)}
            className="flex min-h-18 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-b-4 border-borde bg-tarjeta transition-transform duration-100 active:translate-y-[2px] active:border-b-2 disabled:opacity-50 aria-pressed:border-violeta aria-pressed:bg-violeta-suave"
          >
            <span aria-hidden className={`text-2xl transition-transform ${nivel === n.nivel ? "scale-125" : ""}`}>
              {n.emoji}
            </span>
            <span className="text-[11px] font-extrabold text-texto-suave">{n.nombre}</span>
          </button>
        ))}
      </div>

      {/* Qué influyó: solo después de elegir cómo te sientes */}
      {nivel && (
        <fieldset className="animate-entrar">
          <legend className="mb-2 text-sm font-extrabold">
            ¿Qué influyó? <span className="font-medium text-texto-suave">(opcional, hasta {MAX_ETIQUETAS_ANIMO})</span>
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {ETIQUETAS_ANIMO.map((e) => {
              const activa = etiquetas.includes(e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  aria-pressed={activa}
                  disabled={!activa && etiquetas.length >= MAX_ETIQUETAS_ANIMO}
                  onClick={() => alternarEtiqueta(e.id)}
                  className="inline-flex min-h-10 items-center gap-1 rounded-full border-2 border-borde bg-tarjeta px-3 text-sm font-bold transition-colors disabled:opacity-40 aria-pressed:border-violeta aria-pressed:bg-violeta-suave aria-pressed:text-violeta-texto"
                >
                  <span aria-hidden>{e.emoji}</span>
                  {e.nombre}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Tus últimos 7 días */}
      <div>
        <p className="mb-1.5 text-sm font-extrabold text-texto-suave">Tus últimos 7 días</p>
        <ol className="grid grid-cols-7 gap-1">
          {semana.map((fecha) => {
            const n = porFecha.get(fecha);
            const cara = NIVELES.find((x) => x.nivel === n);
            return (
              <li
                key={fecha}
                className={`flex flex-col items-center rounded-xl py-1 ${fecha === hoy ? "bg-violeta-suave" : ""}`}
                aria-label={`${fecha === hoy ? "Hoy" : LETRAS[diaSemana(fecha)]}: ${cara ? cara.nombre : "sin registro"}`}
              >
                <span className="text-[11px] font-extrabold text-texto-suave" aria-hidden>
                  {LETRAS[diaSemana(fecha)]}
                </span>
                <span className="text-xl leading-tight" aria-hidden>
                  {cara ? cara.emoji : <span className="text-texto-suave">·</span>}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Lo que Chispa descubrió */}
      <div className="flex gap-3 rounded-2xl bg-violeta-suave p-3">
        <Chispa estado={descubrimientos.length > 0 ? "celebrando" : "feliz"} tamano={40} animada={false} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-sm font-extrabold text-violeta-texto">
            <Sparkles className="size-4" strokeWidth={2.5} aria-hidden />
            Lo que Chispa descubrió
          </p>
          {registros < MINIMO_REGISTROS ? (
            <p className="text-sm font-bold">
              Registra tu ánimo unos días más ({registros} de {MINIMO_REGISTROS}) y te contaré qué lo mejora.
            </p>
          ) : descubrimientos.length === 0 ? (
            <p className="text-sm font-bold">Aún no veo un patrón claro. Marca qué influyó cada día y lo encontraremos.</p>
          ) : (
            <ul className="space-y-1">
              {descubrimientos.map((d) => (
                <li key={`${d.tipo}-${d.clave}`} className="text-sm font-bold">
                  {textoDescubrimiento(d, nombreHabito)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
