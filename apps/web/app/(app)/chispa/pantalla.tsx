"use client";

import { diasDeRachaAcumulados } from "@diarco/shared";
import { useRachas } from "@diarco/shared/hooks";
import { ChevronLeft, ChevronRight, Flame, Lock } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { EstadoChispa } from "@/components/chispa";
import { ChispaFase, FASES, faseDe, type Fase } from "@/components/chispa-fases";
import { Confeti } from "@/components/confeti";
import { FrasesChispa } from "@/components/frases-chispa";
import { Boton } from "@/components/ui/boton";
import { Dialogo } from "@/components/ui/dialogo";
import { CargandoLista, claseTarjeta, Encabezado, MensajeError } from "@/components/ui/estados";

// --- Última fase vista (para celebrar cuando Chispa evoluciona) ----------------
const CLAVE_FASE = "diarco-chispa-fase";
const oyentes = new Set<() => void>();
function leerFaseVista(): string {
  try {
    return localStorage.getItem(CLAVE_FASE) ?? "";
  } catch {
    return "";
  }
}
function guardarFaseVista(n: number) {
  try {
    localStorage.setItem(CLAVE_FASE, String(n));
  } catch {
    // Sin almacenamiento: se celebrará de nuevo, sin problema.
  }
  oyentes.forEach((avisar) => avisar());
}
function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
}

export function PantallaChispa() {
  const { data: rachas, isPending, error } = useRachas();
  const vista = useSyncExternalStore(suscribir, leerFaseVista, () => "");

  const dias = rachas ? diasDeRachaAcumulados(rachas.dias) : 0;
  const actual = faseDe(dias);

  // La primera vez solo se recuerda la fase (sin celebrar lo que ya tenías).
  useEffect(() => {
    if (rachas && vista === "") guardarFaseVista(actual.numero);
  }, [rachas, vista, actual.numero]);
  const evoluciono = rachas !== undefined && vista !== "" && actual.numero > Number(vista);

  if (isPending) {
    return (
      <>
        <Encabezado titulo="Mi Chispa" />
        <CargandoLista filas={2} alto="h-72" />
      </>
    );
  }
  if (error || !rachas) {
    return (
      <>
        <Encabezado titulo="Mi Chispa" />
        <MensajeError error={error} />
      </>
    );
  }

  const siguiente = FASES[actual.numero] ?? null; // FASES va de 0; la fase n+1 está en el índice n
  const racha = rachas.general.actual;
  const enRiesgo = racha > 0 && !rachas.general.cumpleHoy && rachas.general.porcentajeHoy !== null;
  const estado: EstadoChispa = dias > 0 && racha === 0 && !rachas.general.cumpleHoy ? "dormida" : enRiesgo ? "preocupada" : "feliz";
  const avance = siguiente ? (dias - actual.desde) / (siguiente.desde - actual.desde) : 1;

  return (
    <>
      <Encabezado titulo="Mi Chispa" subtitulo="Crece con cada día que cumples tu racha. Nunca retrocede." />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Carrusel actual={actual} dias={dias} estado={estado} />

        <aside className="space-y-4">
          {/* Progreso hacia la siguiente fase */}
          <section className={`${claseTarjeta} space-y-3 p-5`} aria-labelledby="titulo-progreso-chispa">
            <h2 id="titulo-progreso-chispa" className="sr-only">
              Progreso de Chispa
            </h2>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="font-titulo text-5xl leading-none font-extrabold text-mandarina-texto tabular-nums">{dias}</p>
                <p className="mt-1 text-sm font-bold text-texto-suave">{dias === 1 ? "día de racha acumulado" : "días de racha acumulados"}</p>
              </div>
              <p className="inline-flex items-center gap-1 rounded-full bg-mandarina-suave px-3 py-1.5 text-sm font-extrabold text-mandarina-texto">
                <Flame className="size-4" strokeWidth={2.5} aria-hidden />
                Racha: {racha}
              </p>
            </div>
            {siguiente ? (
              <>
                <div
                  className="h-4 overflow-hidden rounded-full bg-superficie-2"
                  role="progressbar"
                  aria-valuemin={actual.desde}
                  aria-valuemax={siguiente.desde}
                  aria-valuenow={dias}
                  aria-label={`Progreso hacia ${siguiente.nombre}`}
                >
                  <div className="h-full rounded-full bg-mandarina transition-[width] duration-700" style={{ width: `${Math.max(4, avance * 100)}%` }} />
                </div>
                <p className="font-bold">
                  Te {siguiente.desde - dias === 1 ? "falta 1 día" : `faltan ${siguiente.desde - dias} días`} para ser{" "}
                  <span className="text-mandarina-texto">{siguiente.nombre}</span>.
                </p>
              </>
            ) : (
              <p className="font-bold text-mandarina-texto">¡Llegaste a la última fase! Chispa ya es un sol. ☀️</p>
            )}
          </section>

          {/* Ánimo según la racha actual */}
          <p className={`${claseTarjeta} p-4 text-sm font-bold ${estado === "dormida" ? "bg-violeta-suave" : estado === "preocupada" ? "bg-amarillo-suave" : "bg-verde-suave"}`}>
            {estado === "dormida"
              ? "Tu racha se cortó y Chispa se quedó dormida, pero no pierde su fase. Cumple hoy para despertarla."
              : estado === "preocupada"
                ? "Hoy aún no sumas el día. ¡Chispa te espera para seguir creciendo!"
                : "¡Vas al día! Cada día que cumples, Chispa gana calor."}
          </p>
          <p className="px-1 text-sm text-texto-suave">
            Cuenta cada día en que cumpliste al menos el 70 % de tus hábitos, aunque no sean seguidos.
          </p>
        </aside>
      </div>

      {/* Celebración al evolucionar */}
      <Dialogo abierto={evoluciono} onCerrar={() => guardarFaseVista(actual.numero)} titulo="¡Chispa evolucionó!">
        <div className="flex flex-col items-center gap-3 pb-2 text-center">
          <div className="relative">
            <ChispaFase fase={actual.numero} tamano={200} estado="celebrando" />
            <Confeti piezas={26} alcance={120} />
          </div>
          <p className="font-titulo text-3xl font-extrabold text-mandarina-texto">Ahora es {actual.nombre}</p>
          <p className="max-w-xs text-texto-suave">{actual.descripcion}</p>
          <Boton grande className="w-full" onClick={() => guardarFaseVista(actual.numero)} autoFocus>
            ¡Qué bien!
          </Boton>
        </div>
      </Dialogo>
    </>
  );
}

/**
 * Carrusel de fases: empieza en la fase actual y se desliza a los lados para ver
 * las demás. Las fases aún no alcanzadas se ven en silueta con candado.
 */
function Carrusel({ actual, dias, estado }: { actual: Fase; dias: number; estado: EstadoChispa }) {
  const pista = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(actual.numero - 1);

  // Abre en la fase actual, sin animación.
  useEffect(() => {
    const el = pista.current;
    if (el) el.scrollTo({ left: (actual.numero - 1) * el.clientWidth, behavior: "instant" as ScrollBehavior });
  }, [actual.numero]);

  function ir(indice: number) {
    const el = pista.current;
    if (!el) return;
    const destino = Math.max(0, Math.min(FASES.length - 1, indice));
    el.scrollTo({ left: destino * el.clientWidth, behavior: "smooth" });
  }

  return (
    <section className={`${claseTarjeta} relative overflow-hidden`} aria-roledescription="carrusel" aria-label="Fases de Chispa">
      <div
        ref={pista}
        tabIndex={0}
        onScroll={(e) => {
          const el = e.currentTarget;
          setVisible(Math.round(el.scrollLeft / el.clientWidth));
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") ir(visible + 1);
          if (e.key === "ArrowLeft") ir(visible - 1);
        }}
        className="sin-barra flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain focus-visible:outline-offset-[-4px]"
      >
        {FASES.map((f, i) => {
          const desbloqueada = f.numero <= actual.numero;
          const esActual = f.numero === actual.numero;
          const enPantalla = i === visible;
          return (
            <div
              key={f.numero}
              className="flex w-full shrink-0 snap-center flex-col items-center px-6 pt-6 pb-4 text-center"
              aria-roledescription="diapositiva"
              aria-label={`Fase ${f.numero} de ${FASES.length}: ${desbloqueada ? f.nombre : "bloqueada"}`}
              aria-hidden={!enPantalla}
            >
              {desbloqueada ? (
                <FrasesChispa frases={enPantalla ? f.frases : f.frases.slice(0, 1)} className="min-h-14" />
              ) : (
                <div className="flex min-h-14 items-end">
                  <p className="inline-flex items-center gap-1.5 rounded-2xl bg-superficie px-3 py-2 text-sm font-bold text-texto-suave">
                    <Lock className="size-4" strokeWidth={2.5} aria-hidden />
                    Se desbloquea con {f.desde} días
                  </p>
                </div>
              )}

              <ChispaFase
                fase={f.numero}
                tamano={250}
                estado={esActual ? estado : "feliz"}
                bloqueada={!desbloqueada}
                animada={enPantalla && desbloqueada}
              />

              <p className="mt-1 text-sm font-extrabold text-texto-suave">
                Fase {f.numero} de {FASES.length}
                {esActual && <span className="ml-2 rounded-full bg-mandarina px-2 py-0.5 text-xs text-white">Tu fase</span>}
              </p>
              <p className="font-titulo text-3xl font-extrabold text-mandarina-texto">{desbloqueada ? f.nombre : "???"}</p>
              <p className="mt-1 max-w-sm text-texto-suave">
                {desbloqueada
                  ? f.descripcion
                  : `Te ${f.desde - dias === 1 ? "falta 1 día" : `faltan ${f.desde - dias} días`} de racha para descubrirla.`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Flechas (centradas con top y no con translate: el efecto de "presionar" del botón usa translate y lo movería) */}
      <Boton
        variante="secundario"
        icono
        aria-label="Fase anterior"
        onClick={() => ir(visible - 1)}
        disabled={visible === 0}
        className="absolute top-[calc(50%-22px)] left-3 z-10 rounded-full"
      >
        <ChevronLeft className="size-6" strokeWidth={2.5} aria-hidden />
      </Boton>
      <Boton
        variante="secundario"
        icono
        aria-label="Fase siguiente"
        onClick={() => ir(visible + 1)}
        disabled={visible === FASES.length - 1}
        className="absolute top-[calc(50%-22px)] right-3 z-10 rounded-full"
      >
        <ChevronRight className="size-6" strokeWidth={2.5} aria-hidden />
      </Boton>

      {/* Puntitos */}
      <div className="flex flex-wrap justify-center gap-1 px-4 pb-4">
        {FASES.map((f, i) => (
          <button
            key={f.numero}
            type="button"
            onClick={() => ir(i)}
            aria-label={`Ver fase ${f.numero}`}
            aria-current={i === visible ? "true" : undefined}
            className="flex size-6 items-center justify-center"
          >
            <span
              className={`block rounded-full transition-all ${
                i === visible ? "h-2.5 w-6 bg-mandarina" : f.numero <= actual.numero ? "size-2.5 bg-mandarina/40" : "size-2.5 bg-superficie-2"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
