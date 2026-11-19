"use client";

import { DIAS_PARA_DORMIR, diaSemana, ETAPAS_CHISPA, type Estacion } from "@diarco/shared";
import { useEvolucionChispa } from "@diarco/shared/hooks";
import { CalendarCheck, ChevronRight, Flame } from "lucide-react";
import Link from "next/link";
import { claseTarjeta, Esqueleto, MensajeError } from "../ui/estados";
import { DESBLOQUEOS } from "./fondo";
import { EscenaChispa } from "./escena";
import { fechaCorta } from "@/lib/formato";

const ESTACIONES: Record<Estacion, { nombre: string; emoji: string }> = {
  primavera: { nombre: "Primavera", emoji: "🌸" },
  verano: { nombre: "Verano", emoji: "😎" },
  otono: { nombre: "Otoño", emoji: "🍂" },
  invierno: { nombre: "Invierno", emoji: "❄️" },
};

const FRASE_ESTACION: Record<Estacion, string> = {
  primavera: "¡Huele a primavera! 🌸",
  verano: "¡Qué calorcito! 😎",
  otono: "Me encanta mi bufanda 🍂",
  invierno: "Brrr… ¡abrígame con leña! ❄️",
};

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Etapas que llevan artículo masculino ("un fueguito", "un volcán"). */
const ETAPAS_MASCULINAS = new Set<string>(["Fueguito", "Volcán"]);

const articulo = (nombre: string) => (ETAPAS_MASCULINAS.has(nombre) ? "un" : "una");

/** Lo que Chispa dice al tocarla en su casa. */
function frasesCasa({
  lena,
  faltan,
  siguiente,
  estacion,
  dormida,
}: {
  lena: number;
  faltan: number;
  siguiente: string | undefined;
  estacion: Estacion;
  dormida: boolean;
}): string[] {
  if (dormida) return ["Zzz… 😴", "Un hábito cumplido me despierta", "Zzz… sueño con leña 🪵"];
  return [
    lena > 0 ? `¡Gracias por ${lena === 1 ? "el leño" : `los ${lena} leños`}! 🪵` : "¡Hola! Dame leña y verás 🔥",
    siguiente
      ? `${faltan === 1 ? "Me falta 1 leño" : `Me faltan ${faltan} leños`} para ser ${articulo(siguiente)} ${siguiente.toLowerCase()}`
      : "¡Ya soy una estrella! ⭐",
    FRASE_ESTACION[estacion],
    "¡Bienvenido a mi casa! 🏡",
    "¡Cada hábito me hace crecer!",
  ];
}

/** Página completa: la escena grande, la etapa, el avance y la cosecha. */
export function CasaChispa() {
  const { data, error, refetch } = useEvolucionChispa();
  if (error) return <MensajeError error={error} onReintentar={() => refetch()} />;
  if (!data) return <Esqueleto className="h-[30rem]" />;

  const { lena, etapa, estacion, diasSinLena } = data;
  const dormida = diasSinLena !== null && diasSinLena >= DIAS_PARA_DORMIR;
  const est = ESTACIONES[estacion];
  const faltan = etapa.siguiente ? etapa.siguiente.desde - lena : 0;
  const proximoRegalo = etapa.siguiente ? DESBLOQUEOS[etapa.numero + 1] : undefined;

  return (
    <div className="space-y-8">
      <section aria-labelledby="titulo-chispa" className={`${claseTarjeta} overflow-hidden`}>
        <div className="relative">
          <EscenaChispa
            etapa={etapa.numero}
            estacion={estacion}
            dormida={dormida}
            frases={frasesCasa({ lena, faltan, siguiente: etapa.siguiente?.nombre, estacion, dormida })}
            className="h-[22rem] sm:h-[26rem] xl:h-[30rem]"
          />
          {/* Etiquetas sobre la escena */}
          <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-2">
            <span className="rounded-full border-2 border-b-4 border-borde bg-tarjeta px-3 py-1 text-sm font-extrabold">
              Etapa {etapa.numero} de 10
            </span>
            <span className="rounded-full border-2 border-b-4 border-borde bg-tarjeta px-3 py-1 text-sm font-extrabold">
              {est.emoji} {est.nombre}
            </span>
            <span className="rounded-full border-2 border-b-4 border-borde bg-tarjeta px-3 py-1 text-sm font-extrabold">
              🪵 {lena}
            </span>
          </div>
        </div>

        <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div>
              <h2 id="titulo-chispa" className="font-titulo text-4xl leading-tight font-extrabold">
                Tu Chispa es {articulo(etapa.nombre)} {etapa.nombre.toLowerCase()}
              </h2>
              <p className="mt-1 text-lg font-bold text-texto-suave">
                🪵 {lena} {lena === 1 ? "leño" : "leños"} en total
              </p>
            </div>

            {dormida && (
              <p className="rounded-2xl bg-superficie p-3 font-bold">
                😴 Chispa se quedó dormida: hace {diasSinLena} días que no recibe leña. ¡Un hábito cumplido la despierta!
              </p>
            )}

            {etapa.siguiente ? (
              <div>
                <div className="mb-2 flex items-baseline justify-between gap-2 text-sm font-extrabold">
                  <span>Siguiente: {etapa.siguiente.nombre}</span>
                  <span className="text-texto-suave">
                    te {faltan === 1 ? "falta 1 leño" : `faltan ${faltan} leños`}
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
                {proximoRegalo && (
                  <p className="mt-2 text-sm font-bold text-texto-suave">
                    🎁 Al llegar, su casa gana {proximoRegalo}
                  </p>
                )}
              </div>
            ) : (
              <p className="font-bold text-mandarina-texto">¡Llegaste a la última etapa! Chispa brilla como una estrella. ⭐</p>
            )}

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
          </div>

          <div className="space-y-3">
            <h3 className="font-titulo text-xl font-bold">Cómo ganar leña</h3>
            <ul className="space-y-2 font-bold">
              {[
                ["✅", "Cada hábito cumplido"],
                ["😊", "Cada día que registras tu ánimo"],
                ["📝", "Cada actividad en tu bitácora"],
              ].map(([emoji, texto]) => (
                <li key={texto} className="flex items-center gap-3 rounded-2xl bg-superficie px-3 py-2">
                  <span aria-hidden className="text-xl">
                    {emoji}
                  </span>
                  <span className="flex-1">{texto}</span>
                  <span className="text-mandarina-texto">+1 🪵</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-texto-suave">
              Chispa nunca se apaga ni retrocede: si pasas {DIAS_PARA_DORMIR} días sin leña, solo se duerme. Su casa cambia con la
              hora del día y con la estación. Tócala para que te hable.
            </p>
          </div>
        </div>
      </section>

      <CosechaSemanal />
    </div>
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

/** Ventanita viva en Hoy que lleva a la casa de Chispa. */
export function VentanaChispa() {
  const { data } = useEvolucionChispa();
  if (!data) return <Esqueleto className="h-48" />;

  const { etapa, estacion, diasSinLena } = data;
  const dormida = diasSinLena !== null && diasSinLena >= DIAS_PARA_DORMIR;

  return (
    <Link
      href="/chispa"
      className={`${claseTarjeta} group block overflow-hidden transition-transform hover:-translate-y-0.5`}
    >
      <EscenaChispa etapa={etapa.numero} estacion={estacion} dormida={dormida} compacta className="h-36" />
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-titulo text-lg leading-tight font-extrabold">La casa de Chispa</p>
          <p className="text-sm font-bold text-texto-suave">
            {dormida ? "Está dormida: un hábito la despierta" : `Etapa ${etapa.numero} · ${etapa.nombre}`}
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-texto-suave transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} aria-hidden />
      </div>
    </Link>
  );
}
