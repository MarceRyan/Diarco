/**
 * Chispa: la racha hecha personaje. Una llamita de formas geométricas cuyo
 * gesto cambia con el estado de la racha. El cuerpo (CuerpoChispa) se puede
 * recolorear y vestir, para las etapas y estaciones de ChispaEvolutiva.
 * Con `viva`, la llama titila y parpadea; sus ojos siguen al puntero cuando
 * está dentro de ChispaViva (variables CSS --mx / --my).
 */
import type { Estacion } from "@diarco/shared";

export type EstadoChispa = "feliz" | "emocionada" | "celebrando" | "preocupada" | "dormida";

const DESCRIPCION: Record<EstadoChispa, string> = {
  feliz: "Chispa, la llamita de tu racha, está contenta",
  emocionada: "Chispa está emocionada de verte",
  celebrando: "Chispa está celebrando",
  preocupada: "Chispa está preocupada: tu racha está en riesgo",
  dormida: "Chispa está dormida: tu racha está apagada",
};

/** Tinta de la cara: siempre oscura para contrastar con la llama (claro y oscuro). */
const CARA = "#2a2342";

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
  const apagada = estado === "dormida";
  const tinta = apagada ? "var(--texto)" : CARA;
  const animar = viva && !apagada;
  const ojosAbiertos = estado === "feliz" || estado === "emocionada";

  return (
    <g>
      {/* Llama exterior */}
      <path
        className={animar ? "chispa-llama" : undefined}
        d="M50 4 C61 20 86 36 86 68 C86 90 70 104 50 104 C30 104 14 90 14 68 C14 51 23 41 30 31 C32 43 37 49 43 51 C39 33 42 18 50 4 Z"
        style={{ fill: apagada ? "var(--borde-fuerte)" : exterior }}
      />
      {/* Llama interior */}
      <path
        className={animar ? "chispa-nucleo" : undefined}
        d="M50 40 C58 52 72 62 72 78 C72 92 62 100 50 100 C38 100 28 92 28 78 C28 64 42 56 50 40 Z"
        style={{ fill: apagada ? "var(--superficie-2)" : interior }}
      />

      {/* Gorro de invierno (detrás de la cara, cubre la punta) */}
      {accesorio === "invierno" && (
        <g>
          <path d="M28 40 C30 20 70 20 72 40 Z" fill="#e64980" />
          <rect x="24" y="37" width="52" height="9" rx="4.5" fill="#f3f0fb" />
          <circle cx="50" cy="20" r="6" fill="#f3f0fb" />
        </g>
      )}

      {/* Mejillas (más rosadas cuando está emocionada) */}
      {!apagada && (
        <>
          <ellipse cx="33" cy="82" rx="5" ry="3.2" fill="#ff8fa3" opacity={estado === "emocionada" ? 1 : 0.75} />
          <ellipse cx="67" cy="82" rx="5" ry="3.2" fill="#ff8fa3" opacity={estado === "emocionada" ? 1 : 0.75} />
        </>
      )}

      {/* Ojos: siguen al puntero (chispa-mirada) y parpadean */}
      <g className="chispa-mirada">
        {ojosAbiertos && accesorio !== "verano" && (
          <g className={animar ? "chispa-parpadeo" : undefined}>
            <circle cx="40" cy="72" r={estado === "emocionada" ? 5.8 : 5} fill={CARA} />
            <circle cx="60" cy="72" r={estado === "emocionada" ? 5.8 : 5} fill={CARA} />
            <circle cx="41.8" cy="70.2" r="1.9" fill="#fff" />
            <circle cx="61.8" cy="70.2" r="1.9" fill="#fff" />
          </g>
        )}
        {estado === "preocupada" && accesorio !== "verano" && (
          <>
            <g className={animar ? "chispa-parpadeo" : undefined}>
              <circle cx="40" cy="73" r="4.6" fill={CARA} />
              <circle cx="60" cy="73" r="4.6" fill={CARA} />
            </g>
            <path d="M33 63 L45 66" stroke={CARA} strokeWidth="3" strokeLinecap="round" />
            <path d="M67 63 L55 66" stroke={CARA} strokeWidth="3" strokeLinecap="round" />
          </>
        )}
        {estado === "celebrando" && accesorio !== "verano" && (
          <>
            <path d="M34 73 Q40 65 46 73" fill="none" stroke={CARA} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M54 73 Q60 65 66 73" fill="none" stroke={CARA} strokeWidth="3.5" strokeLinecap="round" />
          </>
        )}

        {/* Lentes de sol de verano (en lugar de los ojos, salvo dormida) */}
        {accesorio === "verano" && !apagada && (
          <g>
            <rect x="31" y="66" width="17" height="11" rx="5" fill={CARA} />
            <rect x="52" y="66" width="17" height="11" rx="5" fill={CARA} />
            <path d="M48 70 L52 70" stroke={CARA} strokeWidth="2.5" />
            <path d="M34 69 L40 69" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
          </g>
        )}
      </g>
      {estado === "dormida" && (
        <>
          <path d="M34 73 Q40 77 46 73" fill="none" stroke={tinta} strokeWidth="3" strokeLinecap="round" />
          <path d="M54 73 Q60 77 66 73" fill="none" stroke={tinta} strokeWidth="3" strokeLinecap="round" />
        </>
      )}

      {/* Boca */}
      {estado === "feliz" && <path d="M43 82 Q50 89 57 82" fill="none" stroke={CARA} strokeWidth="3.2" strokeLinecap="round" />}
      {(estado === "celebrando" || estado === "emocionada") && (
        <path d="M41 80 Q50 80 59 80 Q57 93 50 93 Q43 93 41 80 Z" fill={CARA} />
      )}
      {estado === "preocupada" && (
        <path d="M44 87 Q47 84 50 87 Q53 90 56 87" fill="none" stroke={CARA} strokeWidth="3" strokeLinecap="round" />
      )}
      {estado === "dormida" && <circle cx="50" cy="85" r="2.6" fill={tinta} />}

      {/* Bufanda de otoño */}
      {accesorio === "otono" && (
        <g>
          <path d="M20 90 Q50 100 80 90 L82 98 Q50 109 18 98 Z" fill="#6741d9" />
          <rect x="60" y="96" width="9" height="12" rx="3" fill="#6741d9" />
          <path d="M26 93 L26 99 M40 96 L40 102 M54 96 L54 102" stroke="#9378ec" strokeWidth="2" />
        </g>
      )}

      {/* Flor de primavera */}
      {accesorio === "primavera" && (
        <g transform="translate(70 46)">
          {[0, 72, 144, 216, 288].map((giro) => (
            <ellipse key={giro} cx="0" cy="-6" rx="4.2" ry="6" fill="#ff8fa3" transform={`rotate(${giro})`} />
          ))}
          <circle r="3.6" fill="#ffc23d" />
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
