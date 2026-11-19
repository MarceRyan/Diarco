/**
 * Chispa: la racha hecha personaje. En 2D imita el look de su versión 3D:
 * cuerpo con volumen (degradados y brillo especular), ojos grandes y brillantes
 * con iris que sigue al puntero (variables CSS --mx / --my) y sombra en el suelo.
 * Con `viva`, la llama titila y parpadea. CuerpoChispa se puede recolorear y vestir.
 */
import type { Estacion } from "@diarco/shared";
import { useId } from "react";

export type EstadoChispa = "feliz" | "emocionada" | "celebrando" | "preocupada" | "dormida";

const DESCRIPCION: Record<EstadoChispa, string> = {
  feliz: "Chispa, la llamita de tu racha, está contenta",
  emocionada: "Chispa está emocionada de verte",
  celebrando: "Chispa está celebrando",
  preocupada: "Chispa está preocupada: tu racha está en riesgo",
  dormida: "Chispa está dormida: tu racha está apagada",
};

/** Tinta de la cara: siempre oscura para contrastar con la llama (claro y oscuro). */
const CARA = "#241c3d";

/** Ojo brillante: esclerótica, iris que mira (chispa-mirada), pupila y reflejos. */
function Ojo({ cx, grande, id }: { cx: number; grande: boolean; id: string }) {
  const r = grande ? 8.6 : 8;
  return (
    <g>
      <circle cx={cx} cy="70" r={r} fill={`url(#${id}-ojo)`} />
      <g className="chispa-mirada">
        <circle cx={cx} cy="70.5" r="5.2" fill="#5a3a1e" />
        <circle cx={cx} cy="70.5" r="3.1" fill="#0b0814" />
        <circle cx={cx + 2} cy="68.2" r="1.9" fill="#fff" />
        <circle cx={cx - 1.8} cy="72.6" r="0.9" fill="#fff" />
      </g>
    </g>
  );
}

/**
 * Cuerpo de Chispa en coordenadas 0..100 × 0..108 (para usar dentro de otro <svg>).
 * `exterior`/`interior` cambian los colores de la llama; `accesorio` la viste según la estación.
 */
export function CuerpoChispa({
  estado = "feliz",
  exterior = "var(--mandarina)",
  interior = "var(--amarillo)",
  accesorio,
  viva = false,
}: {
  estado?: EstadoChispa;
  exterior?: string;
  interior?: string;
  accesorio?: Estacion;
  /** Llama que titila y ojos que parpadean. */
  viva?: boolean;
}) {
  const id = `chispa${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const apagada = estado === "dormida";
  const tinta = apagada ? "var(--texto)" : CARA;
  const animar = viva && !apagada;
  const ojosAbiertos = estado === "feliz" || estado === "emocionada" || estado === "preocupada";
  const borde = apagada ? "#9d8fd6" : `color-mix(in oklab, ${exterior} 72%, #7a1200)`;
  const centro = apagada ? "#e9e4fb" : interior;
  const medio = apagada ? "#c4b9ec" : exterior;

  return (
    <g>
      <defs>
        {/* Volumen: núcleo claro abajo al centro, borde más oscuro */}
        <radialGradient id={`${id}-cuerpo`} cx="0.46" cy="0.74" r="0.78">
          <stop offset="0" style={{ stopColor: centro }} />
          <stop offset="0.42" style={{ stopColor: medio }} />
          <stop offset="1" style={{ stopColor: borde }} />
        </radialGradient>
        <radialGradient id={`${id}-nucleo`} cx="0.5" cy="0.62" r="0.6">
          <stop offset="0" style={{ stopColor: "#fff6cf", stopOpacity: apagada ? 0.4 : 0.95 }} />
          <stop offset="1" style={{ stopColor: centro, stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id={`${id}-brillo`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-ojo`} cx="0.42" cy="0.36" r="0.7">
          <stop offset="0.55" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d9d4ea" />
        </radialGradient>
      </defs>

      {/* Sombra en el suelo */}
      <ellipse cx="50" cy="105.5" rx="25" ry="2.6" fill="#120d33" opacity="0.18" />

      {/* Llama con volumen */}
      <path
        className={animar ? "chispa-llama" : undefined}
        d="M50 4 C61 20 86 36 86 68 C86 90 70 104 50 104 C30 104 14 90 14 68 C14 51 23 41 30 31 C32 43 37 49 43 51 C39 33 42 18 50 4 Z"
        fill={`url(#${id}-cuerpo)`}
      />
      {/* Núcleo luminoso */}
      <ellipse className={animar ? "chispa-nucleo" : undefined} cx="50" cy="80" rx="30" ry="24" fill={`url(#${id}-nucleo)`} />
      {/* Brillo especular arriba a la izquierda */}
      <ellipse cx="33" cy="50" rx="7" ry="11" fill={`url(#${id}-brillo)`} transform="rotate(-25 33 50)" />

      {/* Gorro de invierno */}
      {accesorio === "invierno" && (
        <g>
          <path d="M27 40 C29 18 71 18 73 40 Z" fill="#e64980" />
          <path d="M33 26 C40 20 52 19 58 22" stroke="#ff8fb5" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
          <rect x="23" y="36" width="54" height="10" rx="5" fill="#f8f6ff" />
          <circle cx="50" cy="18" r="6.5" fill="#f8f6ff" />
        </g>
      )}

      {/* Mejillas */}
      {!apagada && (
        <>
          <ellipse cx="29" cy="82" rx="5.5" ry="3.4" fill="#ff7d9c" opacity={estado === "emocionada" ? 0.95 : 0.7} />
          <ellipse cx="71" cy="82" rx="5.5" ry="3.4" fill="#ff7d9c" opacity={estado === "emocionada" ? 0.95 : 0.7} />
        </>
      )}

      {/* Ojos */}
      {ojosAbiertos && accesorio !== "verano" && (
        <g className={animar ? "chispa-parpadeo" : undefined}>
          <Ojo cx={39} grande={estado === "emocionada"} id={id} />
          <Ojo cx={61} grande={estado === "emocionada"} id={id} />
        </g>
      )}
      {estado === "preocupada" && (
        <>
          <path d="M31 58 L44 62" stroke={CARA} strokeWidth="3" strokeLinecap="round" />
          <path d="M69 58 L56 62" stroke={CARA} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {estado === "celebrando" && accesorio !== "verano" && (
        <>
          <path d="M33 72 Q39 63 45 72" fill="none" stroke={CARA} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M55 72 Q61 63 67 72" fill="none" stroke={CARA} strokeWidth="3.5" strokeLinecap="round" />
        </>
      )}
      {estado === "dormida" && (
        <>
          <path d="M33 71 Q39 76 45 71" fill="none" stroke={tinta} strokeWidth="3" strokeLinecap="round" />
          <path d="M55 71 Q61 76 67 71" fill="none" stroke={tinta} strokeWidth="3" strokeLinecap="round" />
        </>
      )}

      {/* Lentes de sol de verano (en lugar de los ojos, salvo dormida) */}
      {accesorio === "verano" && !apagada && (
        <g>
          <rect x="28" y="63" width="20" height="13" rx="6" fill={CARA} />
          <rect x="52" y="63" width="20" height="13" rx="6" fill={CARA} />
          <path d="M48 67 L52 67" stroke={CARA} strokeWidth="2.5" />
          <path d="M31 67 L38 66" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
          <path d="M55 67 L62 66" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
        </g>
      )}

      {/* Boca */}
      {estado === "feliz" && <path d="M44 84 Q50 90 56 84" fill="none" stroke={CARA} strokeWidth="3.2" strokeLinecap="round" />}
      {(estado === "celebrando" || estado === "emocionada") && (
        <g>
          <path d="M41 82 Q50 82 59 82 Q57 95 50 95 Q43 95 41 82 Z" fill={CARA} />
          <ellipse cx="50" cy="91.5" rx="4.6" ry="2.6" fill="#ff6f8f" />
        </g>
      )}
      {estado === "preocupada" && (
        <path d="M44 88 Q47 85 50 88 Q53 91 56 88" fill="none" stroke={CARA} strokeWidth="3" strokeLinecap="round" />
      )}
      {estado === "dormida" && <circle cx="50" cy="85" r="2.6" fill={tinta} />}

      {/* Bufanda de otoño */}
      {accesorio === "otono" && (
        <g>
          <path d="M19 90 Q50 101 81 90 L83 99 Q50 110 17 99 Z" fill="#6741d9" />
          <path d="M22 92 Q50 102 78 92" stroke="#9378ec" strokeWidth="2" fill="none" opacity="0.8" />
          <rect x="60" y="97" width="10" height="12" rx="3.5" fill="#5733c4" />
        </g>
      )}

      {/* Flor de primavera */}
      {accesorio === "primavera" && (
        <g transform="translate(71 45)">
          {[0, 72, 144, 216, 288].map((giro) => (
            <ellipse key={giro} cx="0" cy="-6" rx="4.4" ry="6.2" fill="#ff8fb1" transform={`rotate(${giro})`} />
          ))}
          <circle r="3.8" fill="#ffc23d" />
          <circle cx="-1" cy="-1" r="1.3" fill="#fff" opacity="0.7" />
        </g>
      )}
    </g>
  );
}

export function Chispa({
  estado = "feliz",
  tamano = 96,
  animada = true,
  className = "",
}: {
  estado?: EstadoChispa;
  tamano?: number;
  animada?: boolean;
  className?: string;
}) {
  const apagada = estado === "dormida";
  return (
    <svg
      viewBox="0 0 100 108"
      width={tamano}
      height={tamano * 1.08}
      role="img"
      aria-label={DESCRIPCION[estado]}
      className={`${animada && !apagada ? "animate-flotar" : ""} ${className}`}
      style={{ transformOrigin: "50% 100%" }}
    >
      <CuerpoChispa estado={estado} viva={animada} />
    </svg>
  );
}

/** Estado de Chispa a partir de la racha y de lo que queda por hacer hoy. */
export function estadoChispa(racha: number, { enRiesgo, diaCompleto }: { enRiesgo: boolean; diaCompleto: boolean }): EstadoChispa {
  if (diaCompleto) return "celebrando";
  if (racha === 0) return "dormida";
  if (enRiesgo) return "preocupada";
  return "feliz";
}
