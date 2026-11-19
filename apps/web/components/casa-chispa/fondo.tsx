/**
 * Fondo de la casa de Chispa (SVG, viewBox 800 × 400, suelo en y = 330).
 * Cielo según la hora, paisaje según la estación y decorados que se
 * desbloquean con cada etapa. Todo decorativo: aria-hidden en el <svg> padre.
 * Las posiciones son fijas (sin azar) para que servidor y cliente coincidan.
 */
import type { CSSProperties } from "react";
import type { Estacion } from "@diarco/shared";

export type Momento = "amanecer" | "dia" | "atardecer" | "noche";

export const SUELO = 330;
/** Dónde están el árbol y la fogata (unidades del viewBox). */
export const X_ARBOL = 240;
export const X_FOGATA = 530;

const CIELO: Record<Momento, [string, string, string]> = {
  amanecer: ["#7c6cf0", "#ff9eb0", "#ffd59a"],
  dia: ["#2f9bff", "#7fd0ff", "#d4f1ff"],
  atardecer: ["#4c2fb8", "#ff5f7e", "#ffb347"],
  noche: ["#0d0a2b", "#24185e", "#45307f"],
};

const TIERRA: Record<Estacion, { fondo: string; loma: string; suelo: string; copa: string }> = {
  primavera: { fondo: "#9fd8b4", loma: "#62c987", suelo: "#3fae63", copa: "#ffa8c5" },
  verano: { fondo: "#b9dc7e", loma: "#86c540", suelo: "#5ea52c", copa: "#37a85a" },
  otono: { fondo: "#eab27c", loma: "#de8a48", suelo: "#b8663a", copa: "#ff8a33" },
  invierno: { fondo: "#c9d8f0", loma: "#e4ecfa", suelo: "#f6f9ff", copa: "#ffffff" },
};

const anim = (animation: string): CSSProperties => ({ animation });

// --- Cielo ---------------------------------------------------------------

const ESTRELLAS = [
  [40, 30], [120, 70], [190, 24], [260, 90], [330, 40], [410, 18], [470, 76], [560, 34],
  [640, 66], [700, 22], [760, 58], [90, 120], [300, 130], [520, 120], [740, 140], [160, 160],
] as const;

function Cielo({ momento, etapa }: { momento: Momento; etapa: number }) {
  const [arriba, medio, abajo] = CIELO[momento];
  const noche = momento === "noche";
  const astro =
    momento === "dia" ? { x: 640, y: 80, color: "#ffe066" } : momento === "noche" ? { x: 620, y: 80, color: "#fff4cf" } : { x: 610, y: 200, color: "#ffd166" };

  return (
    <g>
      <defs>
        <linearGradient id="casa-cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={arriba} />
          <stop offset="0.55" stopColor={medio} />
          <stop offset="1" stopColor={abajo} />
        </linearGradient>
        <radialGradient id="casa-brillo">
          <stop offset="0" stopColor={astro.color} stopOpacity="0.9" />
          <stop offset="1" stopColor={astro.color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="casa-aurora" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3ddc97" stopOpacity="0" />
          <stop offset="0.3" stopColor="#3ddc97" stopOpacity="0.8" />
          <stop offset="0.7" stopColor="#9378ec" stopOpacity="0.8" />
          <stop offset="1" stopColor="#9378ec" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="-200" y="0" width="1200" height="400" fill="url(#casa-cielo)" />

      {/* Estrellas: siempre de noche; tenues al amanecer/atardecer */}
      {momento !== "dia" &&
        ESTRELLAS.map(([x, y], i) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={i % 3 === 0 ? 2.2 : 1.4}
            fill="#fff"
            opacity={noche ? 1 : 0.5}
            style={anim(`titilar ${2 + (i % 4)}s ease-in-out ${-i * 0.7}s infinite`)}
          />
        ))}

      {/* Aurora (Llama azul en adelante) */}
      {etapa >= 8 && (
        <g opacity={noche ? 0.85 : 0.4}>
          <path
            d="M-40 120 C120 60 260 150 420 90 C560 40 680 120 840 70 L840 110 C680 160 560 80 420 130 C260 190 120 100 -40 160 Z"
            fill="url(#casa-aurora)"
            style={anim("aurora 9s ease-in-out infinite")}
          />
        </g>
      )}

      {/* Sol o luna con su brillo */}
      <circle cx={astro.x} cy={astro.y} r="90" fill="url(#casa-brillo)" className="chispa-latido" />
      <circle cx={astro.x} cy={astro.y} r={noche ? 30 : 38} fill={astro.color} />
      {noche && (
        <>
          <circle cx={astro.x - 9} cy={astro.y - 6} r="6" fill="#efe3b4" />
          <circle cx={astro.x + 10} cy={astro.y + 9} r="4" fill="#efe3b4" />
        </>
      )}

      {/* Estrellas fugaces (Estrella) */}
      {etapa >= 10 &&
        [
          [700, 30, 0],
          [520, 50, 3.5],
        ].map(([x, y, retraso]) => (
          <g key={x} style={anim(`fugaz 7s ease-in ${retraso}s infinite`)}>
            <line x1={x} y1={y} x2={x! + 40} y2={y! - 20} stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          </g>
        ))}

      {/* Nubes que cruzan el cielo */}
      {[
        { y: 60, escala: 1, dur: 70, retraso: -10 },
        { y: 120, escala: 0.7, dur: 95, retraso: -55 },
        { y: 30, escala: 0.55, dur: 120, retraso: -90 },
      ].map((n) => (
        <g key={n.y} style={anim(`nube ${n.dur}s linear ${n.retraso}s infinite`)} opacity={noche ? 0.25 : 0.92}>
          <g transform={`translate(0 ${n.y}) scale(${n.escala})`} fill="#fff">
            <ellipse cx="60" cy="30" rx="60" ry="22" />
            <circle cx="40" cy="18" r="22" />
            <circle cx="78" cy="12" r="28" />
          </g>
        </g>
      ))}
    </g>
  );
}

// --- Paisaje --------------------------------------------------------------

function Paisaje({ estacion, momento, etapa }: { estacion: Estacion; momento: Momento; etapa: number }) {
  const t = TIERRA[estacion];
  return (
    <g>
      {/* Montañas del fondo (y volcán desde la etapa 9) */}
      <path d="M-200 300 L40 170 L180 260 L320 150 L470 270 L560 210 L700 290 L1000 230 L1000 400 L-200 400 Z" fill={t.fondo} />
      {etapa >= 9 && (
        <g>
          <polygon points="590,300 670,150 710,150 800,300" fill="#7c5c4a" />
          <polygon points="670,150 710,150 702,162 678,162" fill="#ff7a2b" className="chispa-latido" />
          <path d="M682 162 L672 210 L688 196 L684 240" stroke="#ff7a2b" strokeWidth="6" fill="none" strokeLinecap="round" />
          {[0, 1.3, 2.6].map((r) => (
            <circle key={r} cx="690" cy="140" r="12" fill="#cfc6dd" className="casa-humo" style={{ animationDelay: `${r}s` }} />
          ))}
        </g>
      )}
      {/* Loma media */}
      <path d="M-200 320 C0 250 180 300 360 280 C520 262 660 300 1000 260 L1000 400 L-200 400 Z" fill={t.loma} />
      {/* Suelo */}
      <path d={`M-200 ${SUELO} C100 316 300 340 500 326 C700 312 900 330 1000 324 L1000 400 L-200 400 Z`} fill={t.suelo} />
      {/* De noche todo el paisaje se oscurece un poco (Chispa queda brillante) */}
      {momento === "noche" && <rect x="-200" y="140" width="1200" height="260" fill="#120d33" opacity="0.4" />}
    </g>
  );
}

// --- Decorados por etapa --------------------------------------------------

const FLORES = [
  [120, 340, "#ff6fa0"], [175, 352, "#ffc23d"], [330, 346, "#9378ec"], [420, 356, "#ff6fa0"],
  [640, 350, "#ffc23d"], [700, 342, "#9378ec"],
] as const;

function Flores({ estacion }: { estacion: Estacion }) {
  return (
    <g>
      {FLORES.map(([x, y, color], i) => (
        <g key={x} transform={`translate(${x} ${y})`}>
          <g className="casa-mecer" style={{ animationDelay: `${-i * 0.8}s` }}>
            <path d="M0 0 L0 -16" stroke="#2f7d45" strokeWidth="3" strokeLinecap="round" />
            {estacion === "invierno" ? (
              <circle cy="-18" r="6" fill="#fff" stroke="#c9d8f0" strokeWidth="2" />
            ) : (
              <g transform="translate(0 -20)">
                {[0, 72, 144, 216, 288].map((g) => (
                  <ellipse key={g} cy="-5" rx="3.5" ry="5" fill={color} transform={`rotate(${g})`} />
                ))}
                <circle r="3" fill="#fff4cf" />
              </g>
            )}
          </g>
        </g>
      ))}
    </g>
  );
}

function Arbol({ estacion }: { estacion: Estacion }) {
  const copa = TIERRA[estacion].copa;
  return (
    <g transform={`translate(${X_ARBOL} ${SUELO + 4})`}>
      <g className="casa-mecer">
        <path d="M-10 0 L-7 -80 L7 -80 L10 0 Z" fill="#7a4b2f" />
        <path d="M0 -60 L-22 -86" stroke="#7a4b2f" strokeWidth="6" strokeLinecap="round" />
        <circle cx="-30" cy="-100" r="34" fill={copa} />
        <circle cx="26" cy="-104" r="38" fill={copa} />
        <circle cx="0" cy="-138" r="40" fill={copa} />
        {/* Brillos de la copa */}
        <circle cx="-12" cy="-150" r="10" fill="#fff" opacity="0.35" />
        {estacion === "otono" && <circle cx="34" cy="-90" r="7" fill="#d64545" />}
        {estacion === "primavera" && <circle cx="30" cy="-130" r="6" fill="#fff" />}
      </g>
    </g>
  );
}

function Fogata({ etapa, encendida }: { etapa: number; encendida: boolean }) {
  return (
    <g transform={`translate(${X_FOGATA} ${SUELO})`}>
      {etapa >= 6 &&
        [-46, -28, -9, 11, 30, 48].map((x) => <ellipse key={x} cx={x} cy="4" rx="11" ry="7" fill="#9a93b0" />)}
      <rect x="-40" y="-14" width="80" height="13" rx="6.5" fill="#8a5a3c" transform="rotate(-12)" />
      <rect x="-40" y="-14" width="80" height="13" rx="6.5" fill="#a46b45" transform="rotate(12)" />
      {encendida ? (
        <g>
          <path
            className="chispa-llama"
            d="M0 -66 C10 -50 26 -40 26 -24 C26 -10 14 -2 0 -2 C-14 -2 -26 -10 -26 -24 C-26 -36 -14 -42 -8 -52 C-6 -44 -2 -42 2 -42 C-2 -50 -2 -58 0 -66 Z"
            fill="#ff6a2b"
          />
          <path
            className="chispa-nucleo"
            d="M0 -40 C6 -30 14 -24 14 -16 C14 -8 8 -4 0 -4 C-8 -4 -14 -8 -14 -16 C-14 -24 -6 -30 0 -40 Z"
            fill="#ffc23d"
          />
        </g>
      ) : (
        <g fill="#cfc6dd">
          {[0, 1.3].map((r) => (
            <circle key={r} cx="0" cy="-12" r="8" className="casa-humo" style={{ animationDelay: `${r}s` }} />
          ))}
        </g>
      )}
    </g>
  );
}

const LUCIERNAGAS = [
  [90, 250], [200, 210], [300, 270], [380, 230], [460, 280], [600, 240], [690, 270], [740, 220],
] as const;

function Luciernagas({ momento }: { momento: Momento }) {
  return (
    <g fill="#fff59a" opacity={momento === "noche" ? 1 : 0.7}>
      {LUCIERNAGAS.map(([x, y], i) => (
        <g key={x} style={anim(`luciernaga ${5 + (i % 3)}s ease-in-out ${-i}s infinite`)}>
          <circle cx={x} cy={y} r="7" opacity="0.25" />
          <circle cx={x} cy={y} r="3" style={anim(`titilar ${1.5 + (i % 3) * 0.5}s ease-in-out ${-i * 0.4}s infinite`)} />
        </g>
      ))}
    </g>
  );
}

function Guirnalda() {
  const focos = Array.from({ length: 15 }, (_, i) => {
    const x = 20 + i * 54;
    // Catenaria simple entre postes en x=20 y x=776
    const t = (x - 20) / 756;
    return { x, y: 40 + Math.sin(t * Math.PI) * 50 };
  });
  const colores = ["#ff6a2b", "#ffc23d", "#3ddc97", "#4dabf7", "#ff6fa0"];
  return (
    <g>
      <path d="M20 40 Q398 140 776 40" stroke="#2a2342" strokeWidth="2" fill="none" opacity="0.6" />
      {focos.map((f, i) => (
        <circle
          key={f.x}
          cx={f.x}
          cy={f.y + 6}
          r="6"
          fill={colores[i % colores.length]}
          style={anim(`titilar ${1.6 + (i % 3) * 0.4}s ease-in-out ${-i * 0.3}s infinite`)}
        />
      ))}
    </g>
  );
}

// --- Partículas de la estación -------------------------------------------

const PARTICULAS = [
  [40, 0], [110, 3.2], [170, 6.5], [230, 1.8], [300, 8.1], [360, 4.4], [420, 9.6], [480, 2.6],
  [540, 7.3], [600, 0.9], [660, 5.7], [720, 10.4], [770, 3.9], [20, 11.2], [390, 12.5], [620, 13.1],
] as const;

function Particulas({ estacion, cantidad }: { estacion: Estacion; cantidad: number }) {
  const lista = PARTICULAS.slice(0, cantidad);

  if (estacion === "verano") {
    // Motas doradas que suben con el calor
    return (
      <g fill="#fff3a6">
        {lista.map(([x, r], i) => (
          <circle key={x} cx={x} cy={SUELO} r={2 + (i % 3)} style={anim(`flotar-mota ${6 + (i % 4)}s ease-out ${-r}s infinite`)} />
        ))}
      </g>
    );
  }

  return (
    <g>
      {lista.map(([x, r], i) => (
        <g key={x} style={anim(`caer ${estacion === "invierno" ? 9 + (i % 4) : 11 + (i % 5)}s linear ${-r}s infinite`)}>
          <g transform={`translate(${x} 0)`}>
            <g style={anim(`vaiven ${3 + (i % 3)}s ease-in-out ${-i * 0.5}s infinite`)}>
              {estacion === "invierno" && <circle r={2.5 + (i % 3)} fill="#fff" />}
              {estacion === "primavera" && <ellipse rx="4" ry="6.5" fill={i % 2 ? "#ffa8c5" : "#ffd1e0"} />}
              {estacion === "otono" && (
                <path d="M0 -8 C6 -4 7 4 0 9 C-7 4 -6 -4 0 -8 Z" fill={i % 2 ? "#ff8a33" : "#d9622b"} />
              )}
            </g>
          </g>
        </g>
      ))}
    </g>
  );
}

/** Capas detrás de Chispa. */
export function FondoCasa({
  momento,
  estacion,
  etapa,
  dormida,
}: {
  momento: Momento;
  estacion: Estacion;
  etapa: number;
  dormida: boolean;
}) {
  return (
    <>
      <Cielo momento={momento} etapa={etapa} />
      {etapa >= 7 && <Guirnalda />}
      <Paisaje estacion={estacion} momento={momento} etapa={etapa} />
      {etapa >= 3 && <Arbol estacion={estacion} />}
      {etapa >= 2 && <Flores estacion={estacion} />}
      {etapa >= 4 && <Fogata etapa={etapa} encendida={!dormida} />}
    </>
  );
}

/** Capas delante de Chispa (partículas y luciérnagas). */
export function FrenteCasa({
  momento,
  estacion,
  etapa,
  compacta,
}: {
  momento: Momento;
  estacion: Estacion;
  etapa: number;
  compacta: boolean;
}) {
  return (
    <>
      {etapa >= 5 && <Luciernagas momento={momento} />}
      <Particulas estacion={estacion} cantidad={compacta ? 8 : PARTICULAS.length} />
    </>
  );
}

/** Lo que aparece en la casa al llegar a cada etapa (índice = etapa). */
export const DESBLOQUEOS: Record<number, string> = {
  2: "flores en el jardín 🌼",
  3: "un árbol que cambia con la estación 🌳",
  4: "una fogata propia 🔥",
  5: "luciérnagas ✨",
  6: "un anillo de piedras 🪨",
  7: "una guirnalda de luces y fuego dorado 💛",
  8: "una aurora en el cielo y fuego azul 💙",
  9: "un volcán humeante 🌋",
  10: "estrellas fugaces y un halo de estrella ⭐",
};
