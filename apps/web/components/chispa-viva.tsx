"use client";

/**
 * Hace que Chispa se sienta viva:
 * - sus ojos siguen al puntero por toda la página (variables CSS --mx/--my, sin re-render);
 * - al pasar el mouse se emociona y se menea;
 * - al tocarla salta, suelta chispitas y dice una frase (anunciada a lectores de pantalla).
 * Con "reducir movimiento" del sistema, las animaciones se apagan (globals.css).
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** Destinos de las chispitas al tocarla (px desde el centro). */
const CHISPITAS = [
  { dx: -42, dy: -26, color: "var(--amarillo)" },
  { dx: 40, dy: -30, color: "var(--mandarina)" },
  { dx: -22, dy: -54, color: "var(--mandarina)" },
  { dx: 24, dy: -58, color: "var(--amarillo)" },
  { dx: 0, dy: -70, color: "var(--violeta)" },
  { dx: -50, dy: 4, color: "var(--violeta)" },
  { dx: 50, dy: 0, color: "var(--amarillo)" },
];

/** Distancia (px) a la que la mirada llega a su tope. */
const ALCANCE_MIRADA = 180;

export function ChispaViva({
  frases,
  globo = "arriba",
  moverCaja = true,
  className = "",
  children,
}: {
  /** Lo que dice al tocarla, en orden. */
  frases: string[];
  /** Dónde aparece el globo: sobre Chispa (dentro de su caja) o a su derecha. */
  globo?: "arriba" | "derecha";
  /**
   * true: salta y se menea todo el dibujo. false: el dibujo anima solo a Chispa
   * (escenas con leños y piedras) usando `toques` y `emocionada`.
   */
  moverCaja?: boolean;
  className?: string;
  /** Dibujo de Chispa; recibe si está emocionada (puntero encima) y cuántas veces la tocaron. */
  children: (estado: { emocionada: boolean; toques: number }) => ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [cerca, setCerca] = useState(false);
  const [toques, setToques] = useState(0);
  const [frase, setFrase] = useState<string | null>(null);

  // Los ojos siguen al puntero, como máximo una vez por cuadro.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cuadro = 0;
    const mover = (ev: PointerEvent) => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const dx = ev.clientX - (r.left + r.width / 2);
        const dy = ev.clientY - (r.top + r.height / 2);
        const distancia = Math.hypot(dx, dy) || 1;
        const factor = Math.min(distancia / ALCANCE_MIRADA, 1) / distancia;
        el.style.setProperty("--mx", (dx * factor).toFixed(3));
        el.style.setProperty("--my", (dy * factor).toFixed(3));
      });
    };
    window.addEventListener("pointermove", mover, { passive: true });
    return () => {
      window.removeEventListener("pointermove", mover);
      cancelAnimationFrame(cuadro);
    };
  }, []);

  // El globo se esconde solo; cada toque reinicia el tiempo.
  useEffect(() => {
    if (!frase) return;
    const t = setTimeout(() => setFrase(null), 2800);
    return () => clearTimeout(t);
  }, [frase, toques]);

  const tocar = () => {
    if (frases.length > 0) setFrase(frases[toques % frases.length]!);
    setToques((n) => n + 1);
  };

  const posicionGlobo =
    globo === "arriba"
      ? "top-1 left-1/2 -translate-x-1/2"
      : "top-0 left-[78%] origin-bottom-left";

  return (
    <button
      ref={ref}
      type="button"
      onClick={tocar}
      onPointerEnter={() => setCerca(true)}
      onPointerLeave={() => setCerca(false)}
      aria-label="Chispa. Tócala para que te diga algo"
      className={`relative block cursor-pointer rounded-3xl ${className}`}
    >
      {moverCaja ? (
        // key: cada toque reinicia el salto
        <span key={toques} className={`block ${toques > 0 ? "chispa-salto" : ""}`}>
          <span className={`block ${cerca ? "chispa-meneo" : ""}`}>{children({ emocionada: cerca, toques })}</span>
        </span>
      ) : (
        children({ emocionada: cerca, toques })
      )}

      {toques > 0 && (
        <span key={`chispitas-${toques}`} aria-hidden className="pointer-events-none absolute inset-0">
          {CHISPITAS.map((c) => (
            <span
              key={`${c.dx}-${c.dy}`}
              className="chispa-estallido absolute top-1/2 left-1/2 size-2.5 rounded-full"
              style={{ "--dx": `${c.dx}px`, "--dy": `${c.dy}px`, "--giro": "0deg", background: c.color } as CSSProperties}
            />
          ))}
        </span>
      )}

      {frase && (
        <span
          key={`globo-${toques}`}
          aria-hidden
          className={`pointer-events-none absolute z-20 w-max max-w-64animate-entrar rounded-2xl border-2 border-b-4 border-borde bg-tarjeta px-3 py-1.5 text-left text-sm font-extrabold text-texto ${posicionGlobo}`}
        >
          {frase}
        </span>
      )}
      {/* Anuncio para lectores de pantalla */}
      <span role="status" className="sr-only">
        {frase ?? ""}
      </span>
    </button>
  );
}
