"use client";

/**
 * La casa de Chispa: escena viva donde Chispa se mueve sola.
 * - Elige qué hacer cada pocos segundos: pasear, ir a la fogata, saltar,
 *   bailar, mirar a los lados o quedarse respirando. Dormida, no se mueve.
 * - Sus ojos miran hacia donde camina, o al puntero si lo mueves cerca.
 * - Al pasar el mouse se emociona; al tocarla salta, suelta chispitas y habla.
 * - Con "reducir movimiento" se queda quieta (y globals.css apaga las animaciones).
 * - `compacta`: versión mini para Hoy, sin interacción (va dentro de un enlace).
 */
import type { Estacion } from "@diarco/shared";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";
import { CuerpoChispa, type EstadoChispa } from "../chispa";
import { FondoCasa, FrenteCasa, SUELO, X_FOGATA, type Momento } from "./fondo";

/** Tamaño de Chispa por etapa. */
const ESCALA = [0.55, 0.64, 0.72, 0.8, 0.88, 0.94, 1, 1.05, 1.1, 1.16];

const COLORES: Record<number, { exterior: string; interior: string }> = {
  7: { exterior: "#ffb020", interior: "#ffe38a" }, // llama dorada
  8: { exterior: "#3b82f6", interior: "#a5d8ff" }, // llama azul
};

const CHISPITAS = [
  { dx: -50, dy: -40, color: "#ffc23d" },
  { dx: 48, dy: -44, color: "#ff6a2b" },
  { dx: -24, dy: -70, color: "#ff6a2b" },
  { dx: 28, dy: -74, color: "#ffc23d" },
  { dx: 0, dy: -90, color: "#9378ec" },
  { dx: -60, dy: -6, color: "#9378ec" },
  { dx: 60, dy: -10, color: "#ffc23d" },
];

type Accion = "quieta" | "caminar" | "calentarse" | "saltar" | "bailar" | "mirar" | "dormir";

// --- Momento del día (solo en el cliente; el servidor asume "dia") --------
function momentoActual(): Momento {
  const h = new Date().getHours();
  if (h >= 6 && h < 9) return "amanecer";
  if (h >= 9 && h < 17) return "dia";
  if (h >= 17 && h < 20) return "atardecer";
  return "noche";
}
function suscribirMinuto(aviso: () => void) {
  const id = setInterval(aviso, 60_000);
  return () => clearInterval(id);
}

// --- Preferencia de movimiento reducido -----------------------------------
function suscribirMovimiento(aviso: () => void) {
  const m = window.matchMedia("(prefers-reduced-motion: reduce)");
  m.addEventListener("change", aviso);
  return () => m.removeEventListener("change", aviso);
}
const movimientoReducido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Momento del día del usuario (el servidor asume "dia"). */
export function useMomento() {
  return useSyncExternalStore(suscribirMinuto, momentoActual, () => "dia" as Momento);
}
/** true si el sistema pide reducir movimiento. */
export function useMovimientoReducido() {
  return useSyncExternalStore(suscribirMovimiento, movimientoReducido, () => false);
}

const azar = (min: number, max: number) => min + Math.random() * (max - min);

/** Orienta los ojos (salvo que el puntero se haya movido cerca hace poco: entonces lo mira a él). */
function orientarOjos(el: SVGGElement | null, ultimoPuntero: number, mx: number, my = 0) {
  if (!el || Date.now() - ultimoPuntero < 2500) return;
  el.style.setProperty("--mx", mx.toFixed(2));
  el.style.setProperty("--my", my.toFixed(2));
}

export function EscenaChispa({
  etapa,
  estacion,
  dormida,
  frases = [],
  compacta = false,
  className = "",
}: {
  etapa: number;
  estacion: Estacion;
  dormida: boolean;
  frases?: string[];
  compacta?: boolean;
  className?: string;
}) {
  const e = Math.min(Math.max(etapa, 1), 10);
  const escala = ESCALA[e - 1]! * (compacta ? 0.9 : 1);
  const colores = COLORES[e] ?? { exterior: "var(--mandarina)", interior: "var(--amarillo)" };
  const hayFogata = e >= 4;
  const momento = useMomento();
  const reducir = useMovimientoReducido();

  const cajaRef = useRef<HTMLDivElement>(null);
  const chispaRef = useRef<SVGGElement>(null);
  /** Parte visible del viewBox en x (el SVG recorta los lados en pantallas angostas). */
  const rangoRef = useRef({ min: 120, max: 680 });
  const xRef = useRef(400);
  const punteroRef = useRef(0);

  const posicionInicial = dormida && hayFogata ? X_FOGATA - 90 : 400;
  const [x, setX] = useState(posicionInicial);
  const [accion, setAccion] = useState<Accion>(dormida ? "dormir" : "quieta");
  const [duracion, setDuracion] = useState(0);
  const [direccion, setDireccion] = useState<1 | -1>(1);
  const [saltos, setSaltos] = useState(0);
  const [cerca, setCerca] = useState(false);
  const [toques, setToques] = useState(0);
  const [frase, setFrase] = useState<string | null>(null);

  const [rango, setRango] = useState({ min: 120, max: 680 });

  // Rango visible: con preserveAspectRatio "slice" los lados se recortan en móvil.
  // (ResizeObserver avisa apenas empieza a observar, así que no hace falta medir antes.)
  useEffect(() => {
    const caja = cajaRef.current;
    if (!caja) return;
    const obs = new ResizeObserver(() => {
      const { width, height } = caja.getBoundingClientRect();
      if (!height) return;
      const visible = Math.min(800, 400 * (width / height));
      const margen = 60 * escala + 20;
      const nuevo = { min: 400 - visible / 2 + margen, max: 400 + visible / 2 - margen };
      rangoRef.current = nuevo;
      setRango(nuevo);
    });
    obs.observe(caja);
    return () => obs.disconnect();
  }, [escala]);

  useEffect(() => {
    if (compacta) return;
    let cuadro = 0;
    const mover = (ev: PointerEvent) => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(() => {
        const el = chispaRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dx = ev.clientX - (r.left + r.width / 2);
        const dy = ev.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        if (d > 600) return; // lejos: Chispa sigue en lo suyo
        punteroRef.current = Date.now();
        const f = Math.min(d / 180, 1) / d;
        el.style.setProperty("--mx", (dx * f).toFixed(3));
        el.style.setProperty("--my", (dy * f).toFixed(3));
      });
    };
    window.addEventListener("pointermove", mover, { passive: true });
    return () => {
      window.removeEventListener("pointermove", mover);
      cancelAnimationFrame(cuadro);
    };
  }, [compacta]);

  // Cerebro de Chispa: elige la siguiente acción al terminar la anterior.
  useEffect(() => {
    if (dormida || reducir) return;
    let t: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout> | undefined;
    let irAFogata = false;
    const mirar = (mx: number, my = 0) => orientarOjos(chispaRef.current, punteroRef.current, mx, my);

    const caminarA = (destino: number) => {
      const { min, max } = rangoRef.current;
      const x2 = Math.min(Math.max(destino, min), max);
      const dir = x2 >= xRef.current ? 1 : -1;
      const ms = Math.max(Math.abs(x2 - xRef.current) * 11, 500);
      xRef.current = x2;
      setDireccion(dir);
      setDuracion(ms);
      setX(x2);
      setAccion("caminar");
      mirar(dir * 0.9, 0.1);
      return ms;
    };

    const siguiente = () => {
      let ms: number;
      if (irAFogata) {
        irAFogata = false;
        setAccion("calentarse");
        mirar(xRef.current < X_FOGATA ? 0.8 : -0.8, 0.3);
        ms = 4200;
      } else {
        const r = Math.random();
        const { min, max } = rangoRef.current;
        if (r < 0.36) {
          ms = caminarA(azar(min, max));
        } else if (r < 0.5 && hayFogata) {
          const lado = xRef.current < X_FOGATA ? -1 : 1;
          ms = caminarA(X_FOGATA + lado * 85);
          irAFogata = true;
        } else if (r < 0.64) {
          setAccion("saltar");
          setSaltos((n) => n + 1);
          mirar(0, -0.6);
          ms = 700;
        } else if (r < 0.77) {
          setAccion("bailar");
          ms = 2600;
        } else if (r < 0.9) {
          setAccion("mirar");
          const lado = Math.random() < 0.5 ? -1 : 1;
          mirar(lado, -0.2);
          t2 = setTimeout(() => mirar(-lado, -0.2), 1100);
          ms = 2300;
        } else {
          setAccion("quieta");
          mirar(0, 0);
          ms = 2400;
        }
      }
      t = setTimeout(siguiente, ms + azar(500, 1400));
    };

    t = setTimeout(siguiente, 1200);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [dormida, reducir, hayFogata]);

  // El globo se esconde solo.
  useEffect(() => {
    if (!frase) return;
    const t = setTimeout(() => setFrase(null), 2800);
    return () => clearTimeout(t);
  }, [frase, toques]);

  const tocar = () => {
    if (frases.length > 0) setFrase(frases[toques % frases.length]!);
    setToques((n) => n + 1);
  };
  const teclado = (ev: KeyboardEvent) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      tocar();
    }
  };

  // Dormida o con movimiento reducido no camina: se queda junto a la fogata o al centro.
  const xVista = dormida ? posicionInicial : x;
  const accionVista: Accion = dormida ? "dormir" : accion;
  const cara: EstadoChispa = dormida
    ? "dormida"
    : cerca || accionVista === "saltar"
      ? "emocionada"
      : accionVista === "bailar" || accionVista === "calentarse"
        ? "celebrando"
        : "feliz";
  const claseMovimiento =
    accionVista === "caminar" ? "casa-caminar" : accionVista === "bailar" ? "casa-bailar" : "casa-respirar";

  const ancho = 100 * escala;
  const alto = 108 * escala;
  const transicion: CSSProperties = {
    transition: `transform ${accionVista === "caminar" ? duracion : 0}ms ease-in-out`,
  };
  const globoX = Math.min(Math.max(xVista - 120, rango.min - 60), rango.max - 180);

  return (
    <div ref={cajaRef} className={`relative overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 size-full"
        role="img"
        aria-label={`La casa de Chispa en ${estacion === "otono" ? "otoño" : estacion}${dormida ? ": Chispa duerme junto a la fogata" : ": Chispa pasea por su jardín"}`}
      >
        <FondoCasa momento={momento} estacion={estacion} etapa={e} dormida={dormida} />

        {/* Sombra que acompaña a Chispa */}
        <g style={{ ...transicion, transform: `translate(${xVista}px, ${SUELO + 2}px)` }}>
          <ellipse rx={32 * escala} ry={6} fill="#120d33" opacity="0.22" />
        </g>

        {/* Chispa */}
        <g style={{ ...transicion, transform: `translate(${xVista - ancho / 2}px, ${SUELO - alto}px)` }}>
          <g
            ref={chispaRef}
            role={compacta ? undefined : "button"}
            tabIndex={compacta ? undefined : 0}
            aria-label={compacta ? undefined : "Chispa. Tócala para que te diga algo"}
            onClick={compacta ? undefined : tocar}
            onKeyDown={compacta ? undefined : teclado}
            onPointerEnter={compacta ? undefined : () => setCerca(true)}
            onPointerLeave={compacta ? undefined : () => setCerca(false)}
            className={compacta ? undefined : "cursor-pointer outline-none"}
            style={{ transform: `scale(${escala})` }}
          >
            {/* Área de toque más grande que el dibujo */}
            <rect x="-10" y="-10" width="120" height="128" fill="transparent" />
            {/* Halo de estrella (etapa 10) */}
            {e === 10 && !dormida && (
              <polygon
                className="chispa-latido"
                points="50,-30 68,30 128,30 80,64 98,124 50,90 2,124 20,64 -28,30 32,30"
                fill="#ffe066"
                opacity="0.45"
              />
            )}
            {/* key: cada salto (propio o por toque) monta de nuevo el grupo y repite la animación */}
            <g key={`salto-${saltos}-${toques}`} className={saltos + toques > 0 ? "chispa-salto" : undefined}>
              <g
                className={claseMovimiento}
                style={{ "--inclinar": `${direccion * 6}deg` } as CSSProperties}
              >
                <g className={cerca && accionVista !== "bailar" && accionVista !== "caminar" ? "chispa-meneo" : undefined}>
                  <CuerpoChispa
                    estado={cara}
                    exterior={colores.exterior}
                    interior={colores.interior}
                    accesorio={estacion}
                    viva
                  />
                </g>
              </g>
            </g>
          </g>
        </g>

        {/* Zzz cuando duerme */}
        {dormida && (
          <g fill="#fff" fontFamily="var(--font-baloo)" fontWeight="800">
            {[0, 1.2, 2.4].map((r, i) => (
              <text
                key={r}
                x={xVista + 20 + i * 12}
                y={SUELO - alto - 4}
                fontSize={16 + i * 4}
                className="chispa-subir"
                style={{ animationDelay: `${r}s`, animationDuration: "3.6s" }}
              >
                z
              </text>
            ))}
          </g>
        )}

        {/* Chispitas al tocarla */}
        {toques > 0 && (
          <g key={`chispitas-${toques}`} transform={`translate(${xVista} ${SUELO - alto / 2})`}>
            {CHISPITAS.map((c) => (
              <circle
                key={`${c.dx}-${c.dy}`}
                r="5"
                fill={c.color}
                className="casa-estallar"
                style={{ "--dx": `${c.dx}px`, "--dy": `${c.dy}px` } as CSSProperties}
              />
            ))}
          </g>
        )}

        <FrenteCasa momento={momento} estacion={estacion} etapa={e} compacta={compacta} />

        {/* Globo de texto */}
        {frase && (
          <foreignObject x={globoX} y={SUELO - alto - 70} width="240" height="60" aria-hidden>
            <div className="flex h-full items-end justify-center">
              <span
                key={toques}
                className="animate-entrar rounded-2xl border-2 border-b-4 border-borde bg-tarjeta px-3 py-1.5 text-center text-sm leading-tight font-extrabold text-texto"
              >
                {frase}
              </span>
            </div>
          </foreignObject>
        )}
      </svg>
      {!compacta && (
        <span role="status" className="sr-only">
          {frase ?? ""}
        </span>
      )}
    </div>
  );
}
