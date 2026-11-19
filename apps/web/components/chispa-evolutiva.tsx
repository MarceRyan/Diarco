/**
 * Chispa en su etapa de crecimiento (1 a 10) y vestida según la estación.
 * Escena de formas geométricas: cada etapa suma un elemento (llamas, leños,
 * chispas, piedras, volcán, halo) y las últimas cambian el color del fuego.
 */
import { ETAPAS_CHISPA, type Estacion } from "@diarco/shared";
import { CuerpoChispa } from "./chispa";

/** Tamaño (escala) de Chispa por etapa: crece hasta la hoguera y luego cambia de forma. */
const ESCALA = [0.42, 0.56, 0.64, 0.7, 0.78, 0.8, 0.84, 0.86, 0.5, 0.82];

const COLORES: Record<number, { exterior: string; interior: string }> = {
  7: { exterior: "#ffb020", interior: "#ffe38a" }, // llama dorada
  8: { exterior: "#3b82f6", interior: "#a5d8ff" }, // llama azul
};

const NOMBRE_ESTACION: Record<Estacion, string> = {
  primavera: "primavera",
  verano: "verano",
  otono: "otoño",
  invierno: "invierno",
};

/** Llama lateral simple (detrás de Chispa), titilando a su propio ritmo. */
function LlamaLateral({ x, escala, color, ritmo }: { x: number; escala: number; color: string; ritmo: string }) {
  return (
    <g transform={`translate(${x} ${170 - 60 * escala}) scale(${escala})`}>
      <path
        className="chispa-llama"
        style={{ animationDuration: ritmo }}
        d="M20 0 C26 14 40 24 40 42 C40 54 31 60 20 60 C9 60 0 54 0 42 C0 30 12 22 20 0 Z"
        fill={color}
        opacity="0.85"
      />
    </g>
  );
}

export function ChispaEvolutiva({
  etapa,
  estacion,
  dormida = false,
  emocionada = false,
  toques = 0,
  tamano = 220,
}: {
  /** 1 a 10 */
  etapa: number;
  estacion: Estacion;
  dormida?: boolean;
  /** Puntero encima: abre la boca y se le encienden las mejillas. */
  emocionada?: boolean;
  /** Veces que la tocaron: cada toque hace saltar solo a Chispa (no la escena). */
  toques?: number;
  tamano?: number;
}) {
  const e = Math.min(Math.max(etapa, 1), 10);
  const escala = ESCALA[e - 1]!;
  const colores = COLORES[e] ?? { exterior: "var(--mandarina)", interior: "var(--amarillo)" };
  const volcan = e === 9;
  // Chispa se apoya en el suelo (y = 172) o en el cráter del volcán (y = 118).
  const base = volcan ? 118 : 172;
  const ancho = 100 * escala;
  const alto = 108 * escala;
  const x = 100 - ancho / 2;
  const y = base - alto;
  const nombre = ETAPAS_CHISPA[e - 1]!.nombre;

  return (
    <svg
      viewBox="0 0 200 200"
      width={tamano}
      height={tamano}
      role="img"
      aria-label={`Chispa en etapa ${e} de 10: ${nombre}, vestida de ${NOMBRE_ESTACION[estacion]}${dormida ? ", dormida porque hace días que no recibe leña" : ""}`}
    >
      {/* Halo de estrella (etapa 10) */}
      {e === 10 && !dormida && (
        <polygon
          className="chispa-latido"
          points="100,8 118,62 175,62 129,95 146,150 100,117 54,150 71,95 25,62 82,62"
          fill="var(--amarillo)"
          opacity="0.45"
        />
      )}

      {/* Volcán (etapa 9) */}
      {volcan && (
        <g>
          <polygon points="18,192 78,116 122,116 182,192" fill="#7c5c4a" />
          <polygon points="78,116 122,116 112,128 88,128" fill="#5b4134" />
          <path d="M92 128 L86 160 L96 150 L100 176" stroke="var(--mandarina)" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      )}

      {/* Anillo de piedras (desde la gran hoguera, salvo volcán) */}
      {e >= 6 && !volcan &&
        [44, 66, 88, 112, 134, 156].map((cx) => <ellipse key={cx} cx={cx} cy={182} rx="11" ry="7" fill="#9a93b0" />)}

      {/* Leños cruzados (desde la fogata, salvo volcán) */}
      {e >= 4 && !volcan && (
        <g>
          <rect x="52" y="164" width="96" height="14" rx="7" fill="#8a5a3c" transform="rotate(-10 100 171)" />
          <rect x="52" y="164" width="96" height="14" rx="7" fill="#a46b45" transform="rotate(10 100 171)" />
          <circle cx="56" cy="179" r="5" fill="#d9a57a" />
          <circle cx="144" cy="179" r="5" fill="#d9a57a" />
        </g>
      )}

      {/* Llamas laterales (desde el fueguito) */}
      {e >= 3 && !dormida && !volcan && (
        <>
          <LlamaLateral x={100 - ancho / 2 - 22} escala={0.55 + e * 0.03} color={colores.exterior} ritmo="1.4s" />
          <LlamaLateral x={100 + ancho / 2 - 12} escala={0.5 + e * 0.03} color={colores.exterior} ritmo="1.9s" />
        </>
      )}

      {/* Chispa */}
      <g transform={`translate(${x} ${y}) scale(${escala})`}>
        <g className={dormida ? "" : "animate-flotar"} style={{ transformOrigin: "50px 108px" }}>
          {/* key: cada toque reinicia el salto */}
          <g key={toques} className={toques > 0 ? "chispa-salto" : undefined}>
            <g className={emocionada ? "chispa-meneo" : undefined}>
              <CuerpoChispa
                estado={dormida ? "dormida" : emocionada ? "emocionada" : "feliz"}
                exterior={colores.exterior}
                interior={colores.interior}
                accesorio={estacion}
                viva
              />
            </g>
          </g>
        </g>
      </g>

      {/* Chispas que suben (desde la hoguera), cada una con su retraso */}
      {e >= 5 && !dormida && (
        <g fill={colores.interior}>
          {[
            [48, 70, 3, 0],
            [150, 60, 2.5, 0.6],
            [62, 40, 2, 1.2],
            [140, 100, 3, 1.8],
            [100, 22, 2.5, 0.9],
          ].map(([cx, cy, r, retraso]) => (
            <circle
              key={`${cx}-${cy}`}
              className="chispa-subir"
              style={{ animationDelay: `${retraso}s` }}
              cx={cx}
              cy={cy}
              r={r}
            />
          ))}
        </g>
      )}

      {/* "Zzz" cuando está dormida */}
      {dormida && (
        <text x="140" y={y + 10} fontSize="18" fontWeight="800" fill="var(--texto-suave)" fontFamily="var(--font-baloo)">
          z z
        </text>
      )}
    </svg>
  );
}
