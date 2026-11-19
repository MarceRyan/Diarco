/**
 * Chispa: la racha hecha personaje. Una llamita de formas geométricas cuyo
 * gesto cambia con el estado de la racha.
 */
export type EstadoChispa = "feliz" | "celebrando" | "preocupada" | "dormida";

const DESCRIPCION: Record<EstadoChispa, string> = {
  feliz: "Chispa, la llamita de tu racha, está contenta",
  celebrando: "Chispa está celebrando",
  preocupada: "Chispa está preocupada: tu racha está en riesgo",
  dormida: "Chispa está dormida: tu racha está apagada",
};

const TINTA = "var(--texto)";

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
  // En modo oscuro la tinta es clara; la cara siempre va en tinta oscura fija para contrastar con la llama.
  const cara = "#2a2342";

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
      {/* Llama exterior */}
      <path
        d="M50 4 C61 20 86 36 86 68 C86 90 70 104 50 104 C30 104 14 90 14 68 C14 51 23 41 30 31 C32 43 37 49 43 51 C39 33 42 18 50 4 Z"
        style={{ fill: apagada ? "var(--borde-fuerte)" : "var(--mandarina)" }}
      />
      {/* Llama interior */}
      <path
        d="M50 40 C58 52 72 62 72 78 C72 92 62 100 50 100 C38 100 28 92 28 78 C28 64 42 56 50 40 Z"
        style={{ fill: apagada ? "var(--superficie-2)" : "var(--amarillo)" }}
      />

      {/* Mejillas */}
      {!apagada && (
        <>
          <ellipse cx="33" cy="82" rx="5" ry="3.2" fill="#ff8fa3" opacity="0.75" />
          <ellipse cx="67" cy="82" rx="5" ry="3.2" fill="#ff8fa3" opacity="0.75" />
        </>
      )}

      {/* Ojos */}
      {estado === "feliz" && (
        <>
          <circle cx="40" cy="72" r="5" fill={cara} />
          <circle cx="60" cy="72" r="5" fill={cara} />
          <circle cx="41.8" cy="70.2" r="1.7" fill="#fff" />
          <circle cx="61.8" cy="70.2" r="1.7" fill="#fff" />
        </>
      )}
      {estado === "preocupada" && (
        <>
          <circle cx="40" cy="73" r="4.6" fill={cara} />
          <circle cx="60" cy="73" r="4.6" fill={cara} />
          <path d="M33 63 L45 66" stroke={cara} strokeWidth="3" strokeLinecap="round" />
          <path d="M67 63 L55 66" stroke={cara} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {estado === "celebrando" && (
        <>
          <path d="M34 73 Q40 65 46 73" fill="none" stroke={cara} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M54 73 Q60 65 66 73" fill="none" stroke={cara} strokeWidth="3.5" strokeLinecap="round" />
        </>
      )}
      {estado === "dormida" && (
        <>
          <path d="M34 73 Q40 77 46 73" fill="none" stroke={TINTA} strokeWidth="3" strokeLinecap="round" />
          <path d="M54 73 Q60 77 66 73" fill="none" stroke={TINTA} strokeWidth="3" strokeLinecap="round" />
        </>
      )}

      {/* Boca */}
      {estado === "feliz" && (
        <path d="M43 82 Q50 89 57 82" fill="none" stroke={cara} strokeWidth="3.2" strokeLinecap="round" />
      )}
      {estado === "celebrando" && <path d="M41 80 Q50 80 59 80 Q57 93 50 93 Q43 93 41 80 Z" fill={cara} />}
      {estado === "preocupada" && (
        <path d="M44 87 Q47 84 50 87 Q53 90 56 87" fill="none" stroke={cara} strokeWidth="3" strokeLinecap="round" />
      )}
      {estado === "dormida" && <circle cx="50" cy="85" r="2.6" fill={TINTA} />}
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
