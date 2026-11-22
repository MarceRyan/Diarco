/**
 * Las 14 fases de Chispa. Crece con los días de racha acumulados (cada día que
 * sumó a tu racha general) y nunca retrocede. La historia tiene dos ejes:
 *  - Su hogar es cada vez más grande e importante: de una chispa entre
 *    piedras a una vela, una fogata, un faro… hasta ser una estrella y el Sol.
 *  - Su color sigue el calor, como el fuego real: naranja, blanco (forja),
 *    azul (el fuego más caliente) y, al final, la luz de una estrella.
 * Cada fase se dibuja en un lienzo de 200 × 200.
 */
import { useId, type ReactNode } from "react";
import { CuerpoChispa, type EstadoChispa } from "./chispa";

export interface Fase {
  numero: number;
  nombre: string;
  /** Días de racha acumulados para alcanzarla. */
  desde: number;
  descripcion: string;
  /** Lo que Chispa dice en esta fase. */
  frases: readonly string[];
}

export const FASES: readonly Fase[] = [
  {
    numero: 1, nombre: "Chispa", desde: 0,
    descripcion: "Nace del choque de dos piedras: una chispa diminuta con ganas de arder.",
    frases: ["¡Hola! Acabo de nacer ✨", "Cada día que cumples me da calor.", "¡Ayúdame a crecer!"],
  },
  {
    numero: 2, nombre: "Fósforo", desde: 3,
    descripcion: "Prende en la punta de un fósforo: pequeña, pero ya es una llama.",
    frases: ["¡Ya soy una llama de verdad!", "Pequeña, pero encendida 🔥", "Cuidado con soplar, ¿eh?"],
  },
  {
    numero: 3, nombre: "Vela", desde: 7,
    descripcion: "Una semana: ilumina una vela y ya no se apaga con cualquier soplo.",
    frases: ["¡Una semana juntos! 🕯️", "Ya no me apago con cualquier soplo.", "Ilumino tus noches de estudio."],
  },
  {
    numero: 4, nombre: "Farol", desde: 10,
    descripcion: "Vive protegida en un farol: ningún viento la detiene.",
    frases: ["Aquí dentro ningún viento me apaga.", "Te acompaño a donde vayas.", "¡Protegida y brillando!"],
  },
  {
    numero: 5, nombre: "Antorcha", desde: 14,
    descripcion: "Dos semanas: es una antorcha que abre camino y te saluda.",
    frases: ["¡Sígueme, yo abro camino!", "Dos semanas, ¡qué buen ritmo!", "¡Arriba la antorcha! 🙌"],
  },
  {
    numero: 6, nombre: "Fogata", desde: 21,
    descripcion: "El hábito se formó: ya tiene sus propios troncos para arder.",
    frases: ["¡Tu hábito ya se formó!", "Tengo mis propios troncos 🪵", "¿Contamos historias junto al fuego?"],
  },
  {
    numero: 7, nombre: "Hoguera", desde: 30,
    descripcion: "Un mes: una gran hoguera con llamas a los lados y un círculo de piedras.",
    frases: ["¡Un mes ardiendo!", "Mira qué grande me hice 💪", "Ya nadie apaga esta hoguera."],
  },
  {
    numero: 8, nombre: "Chimenea", desde: 45,
    descripcion: "Calienta un hogar: su fuego ya es parte de tu día a día.",
    frases: ["Qué calentito se está aquí.", "Ya soy parte de tu hogar 🏠", "Acércate, que afuera hace frío."],
  },
  {
    numero: 9, nombre: "Faro", desde: 60,
    descripcion: "Brilla en lo alto de un faro y su luz guía a otros.",
    frases: ["Desde aquí arriba se ve todo.", "Mi luz guía a otros 🌊", "Si te pierdes, búscame."],
  },
  {
    numero: 10, nombre: "Pebetero", desde: 100,
    descripcion: "Cien días: arde en un pebetero, la llama de los campeones.",
    frases: ["¡Cien días! Llama de campeones 🏆", "Esto ya es una hazaña.", "¡Sube al podio conmigo!"],
  },
  {
    numero: 11, nombre: "Forja", desde: 150,
    descripcion: "Tan caliente que se vuelve blanca: con ella se forja el acero.",
    frases: ["Tan caliente que me puse blanca.", "La constancia forja el acero ⚒️", "¡Golpe a golpe!"],
  },
  {
    numero: 12, nombre: "Llama azul", desde: 240,
    descripcion: "El fuego más caliente que existe es azul. Y ese es el suyo.",
    frases: ["El fuego más caliente es azul 💙", "¡Ni yo me lo creo!", "Ya casi toco las estrellas."],
  },
  {
    numero: 13, nombre: "Estrella", desde: 365,
    descripcion: "Un año: su fuego es tan grande que ya es una estrella en el cielo.",
    frases: ["Un año… ¡ahora soy una estrella! ⭐", "Brillo para ti cada noche.", "Pide un deseo."],
  },
  {
    numero: 14, nombre: "Sol", desde: 730,
    descripcion: "Dos años: se convierte en un sol que da luz y calor a todo.",
    frases: ["Dos años: ¡soy tu sol! ☀️", "Doy luz y calor a todo.", "Gracias por no rendirte nunca."],
  },
]; // prettier-ignore

/** Fase según los días de racha acumulados. */
export function faseDe(dias: number): Fase {
  let fase = FASES[0]!;
  for (const f of FASES) if (dias >= f.desde) fase = f;
  return fase;
}

/** Colores de Chispa: siguen el calor del fuego. */
function colores(n: number): { exterior: string; interior: string; aura: string } {
  if (n === 11) return { exterior: "#ffc533", interior: "#ffffff", aura: "#fff1a8" }; // blanco de forja
  if (n === 12) return { exterior: "#3b82f6", interior: "#d6ecff", aura: "#60a5fa" }; // azul
  if (n === 13) return { exterior: "#ffd24d", interior: "#fffbe8", aura: "#fff3b0" }; // estrella
  if (n === 14) return { exterior: "#ffb000", interior: "#fff6c8", aura: "#ffd84d" }; // sol
  return { exterior: "var(--mandarina)", interior: "var(--amarillo)", aura: "#ffb340" };
}

/** Escala de Chispa y dónde se apoya (y de su base) en cada fase. */
const POSE: Record<number, { s: number; pie: number }> = {
  1: { s: 0.3, pie: 138 },
  2: { s: 0.36, pie: 104 },
  3: { s: 0.42, pie: 120 },
  4: { s: 0.44, pie: 166 },
  5: { s: 0.5, pie: 112 },
  6: { s: 0.62, pie: 170 },
  7: { s: 0.74, pie: 170 },
  8: { s: 0.56, pie: 172 },
  9: { s: 0.4, pie: 104 },
  10: { s: 0.74, pie: 122 },
  11: { s: 0.7, pie: 156 },
  12: { s: 0.84, pie: 160 },
  13: { s: 0.8, pie: 146 },
  14: { s: 0.86, pie: 150 },
};

/** Forma de llama simple (llamas laterales y corona). */
const LLAMA = "M10 0 C14 8 20 12 20 22 C20 30 15 34 10 34 C5 34 0 30 0 22 C0 15 4 12 6 8 C7 12 9 14 10 14 C9 9 9 4 10 0 Z";

export function ChispaFase({
  fase,
  tamano = 160,
  estado = "feliz",
  animada = true,
  bloqueada = false,
}: {
  /** Número de fase (1 a 14). */
  fase: number;
  tamano?: number;
  estado?: EstadoChispa;
  animada?: boolean;
  /** Silueta (fase aún no alcanzada). */
  bloqueada?: boolean;
}) {
  const id = `fase${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const n = Math.min(FASES.length, Math.max(1, fase));
  const { exterior, interior, aura } = colores(n);
  const { s, pie } = POSE[n]!;
  const x = 100 - 50 * s;
  const y = pie - 104 * s;
  const anim = animada && !bloqueada;
  const gesto: EstadoChispa = n === 1 && estado === "feliz" ? "celebrando" : estado;
  const centro = pie - 56 * s; // centro aproximado del cuerpo

  /** Llama con posición en el <g> y animación en el <path> (si no, la animación pisa la posición). */
  const llamita = (tx: number, ty: number, sx: number, sy: number, retraso = 0, relleno = `url(#${id}-fuego)`) => (
    <g transform={`translate(${tx} ${ty}) scale(${sx} ${sy})`}>
      <path d={LLAMA} fill={relleno} className={anim ? "chispa-llama" : undefined} style={{ animationDelay: `${retraso}s` }} />
    </g>
  );

  // Lo que va detrás de Chispa (fondo y su "hogar") y lo que va delante (vidrios, chispas).
  let detras: ReactNode = null;
  let delante: ReactNode = null;

  /** Brasitas que suben del fuego. */
  const brasasQueSuben = (cantidad: number) => (
    <g fill="#ffc23d">
      {Array.from({ length: cantidad }, (_, i) => (
        <circle
          key={i}
          cx={64 + ((i * 37) % 76)}
          cy={110 - ((i * 23) % 40)}
          r={i % 2 ? 2 : 2.8}
          className={anim ? "chispa-subir" : undefined}
          style={{ animationDelay: `${(i * 0.45) % 2.4}s` }}
        />
      ))}
    </g>
  );

  switch (n) {
    case 1: // Dos piedras que chocan
      detras = (
        <g>
          {/* Las piedras chocan una contra otra y saltan chispas */}
          <g className={anim ? "fase-chocar" : undefined} style={{ transformOrigin: "46px 182px", "--giro": "9deg" } as React.CSSProperties}>
            <path d="M40 170 L58 146 L86 150 L92 172 L70 184 L46 182 Z" fill="#8f8aa3" />
            <path d="M58 146 L86 150 L80 158 L60 156 Z" fill="#b3aec4" />
          </g>
          <g className={anim ? "fase-chocar" : undefined} style={{ transformOrigin: "154px 182px", "--giro": "-9deg" } as React.CSSProperties}>
            <path d="M160 170 L142 146 L114 150 L108 172 L130 184 L154 182 Z" fill="#7f7a94" />
            <path d="M142 146 L114 150 L120 158 L140 156 Z" fill="#a39fb6" />
          </g>
        </g>
      );
      delante = (
        <g fill="#ffc23d">
          {[
            [84, 120, 0],
            [118, 116, 0.6],
            [100, 98, 1.2],
            [76, 136, 1.8],
          ].map(([cx, cy, r]) => (
            <circle key={cx} cx={cx} cy={cy} r="2.5" className={anim ? "chispa-subir" : undefined} style={{ animationDelay: `${r}s` }} />
          ))}
        </g>
      );
      break;
    case 2: // Fósforo
      detras = (
        <g>
          <rect x="96" y="104" width="8" height="86" rx="3" fill="#e9c27a" />
          <rect x="96" y="104" width="3" height="86" fill="#f6dba3" />
          <ellipse cx="100" cy="104" rx="8" ry="10" fill="#c0392b" />
          <ellipse cx="97" cy="100" rx="3" ry="4" fill="#e8665a" />
        </g>
      );
      break;
    case 3: // Vela
      detras = (
        <g>
          <ellipse cx="100" cy="186" rx="44" ry="7" fill="#cfc8e0" />
          <rect x="80" y="118" width="40" height="68" rx="7" fill={`url(#${id}-cera)`} />
          <path d="M84 118 v14 a4 4 0 0 0 8 0 v-6 M108 118 v20 a4 4 0 0 0 8 0 v-14" fill="#fffaf0" />
          <ellipse cx="100" cy="119" rx="20" ry="4" fill="#fff6e0" />
        </g>
      );
      break;
    case 4: // Farol
      detras = (
        <g>
          <path d="M84 56 Q100 40 116 56" fill="none" stroke="#4a4458" strokeWidth="4" strokeLinecap="round" />
          <path d="M70 84 L130 84 L118 66 L82 66 Z" fill="#4a4458" />
          <rect x="72" y="84" width="56" height="84" fill="#fff6c8" opacity="0.35" />
          <rect x="64" y="166" width="72" height="14" rx="3" fill="#4a4458" />
        </g>
      );
      delante = (
        <g>
          <rect x="72" y="84" width="56" height="84" fill="none" stroke="#4a4458" strokeWidth="5" />
          <line x1="100" y1="84" x2="100" y2="168" stroke="#4a4458" strokeWidth="2" opacity="0.5" />
          <path d="M78 92 L88 92 L80 150 L76 150 Z" fill="#fff" opacity="0.35" />
        </g>
      );
      break;
    case 5: // Antorcha
      detras = (
        <g>
          <path d="M91 124 L109 124 L104 194 L96 194 Z" fill="#8a5a34" />
          <path d="M94 124 L98 124 L97 194 L96 194 Z" fill="#a8744a" />
          <rect x="86" y="108" width="28" height="18" rx="4" fill="#6b4a3a" />
          <path d="M86 114 h28 M86 120 h28" stroke="#4a2f22" strokeWidth="2" />
        </g>
      );
      break;
    case 6: // Fogata
    case 7: // Hoguera
      detras = (
        <g>
          {n === 7 && llamita(28, 118, 1.8, 2.0)}
          {n === 7 && llamita(136, 122, 1.7, 1.9, -0.6)}
          {n === 7 &&
            [-70, -46, 46, 70].map((dx, i) => (
              <ellipse key={dx} cx={100 + dx} cy={178 + (i === 0 || i === 3 ? -2 : 3)} rx="12" ry="7" fill={i % 2 ? "#8c8aa0" : "#a8a6bb"} />
            ))}
          <rect x="50" y="166" width="100" height="15" rx="7" fill={`url(#${id}-tronco)`} transform="rotate(-11 100 173)" />
          <rect x="50" y="166" width="100" height="15" rx="7" fill={`url(#${id}-tronco)`} transform="rotate(11 100 173)" />
          <circle cx="52" cy="182" r="5.5" fill="#c98b5b" />
          <circle cx="148" cy="182" r="5.5" fill="#c98b5b" />
        </g>
      );
      delante = brasasQueSuben(n === 7 ? 6 : 4);
      break;
    case 8: // Chimenea
      detras = (
        <g>
          <clipPath id={`${id}-pared`}>
            <rect x="26" y="58" width="148" height="136" rx="4" />
          </clipPath>
          <rect x="26" y="58" width="148" height="136" rx="4" fill="#b5523b" />
          <g clipPath={`url(#${id}-pared)`}>
            {Array.from({ length: 8 }, (_, fila) =>
              Array.from({ length: 7 }, (_, col) => (
                <rect key={`${fila}-${col}`} x={28 + col * 25 - (fila % 2 ? 12 : 0)} y={62 + fila * 16} width="22" height="13" rx="1.5" fill={(fila + col) % 3 ? "#c4644a" : "#a94a35"} />
              )),
            )}
          </g>
          <path d="M50 194 L50 116 Q100 76 150 116 L150 194 Z" fill="#2b1c1c" />
          <rect x="18" y="48" width="164" height="12" rx="3" fill="#7a4e2c" />
          <rect x="36" y="34" width="10" height="16" rx="2" fill="#fff6e0" />
          <path d="M41 30 q3 -5 0 -9 q-3 4 0 9" fill="#ffc23d" className={anim ? "chispa-llama" : undefined} />
          <rect x="150" y="30" width="18" height="18" rx="2" fill="#f4f1ff" stroke="#7a4e2c" strokeWidth="2" />
          <rect x="62" y="172" width="76" height="11" rx="5" fill={`url(#${id}-tronco)`} transform="rotate(-8 100 177)" />
          <rect x="62" y="172" width="76" height="11" rx="5" fill={`url(#${id}-tronco)`} transform="rotate(8 100 177)" />
        </g>
      );
      delante = brasasQueSuben(3);
      break;
    case 9: // Faro
      detras = (
        <g>
          {/* Haces de luz */}
          <g className={anim ? "fase-barrido" : undefined} style={{ transformOrigin: "100px 86px" }}>
            <path d="M100 86 L0 52 L0 120 Z" fill="#fff3b0" opacity="0.55" />
            <path d="M100 86 L200 52 L200 120 Z" fill="#fff3b0" opacity="0.55" />
          </g>
          <path d="M78 196 L86 116 L114 116 L122 196 Z" fill="#f4f1ff" />
          <path d="M80 176 L120 176 L121 188 L79 188 Z M83 146 L117 146 L118 160 L82 160 Z M85 120 L115 120 L116 132 L84 132 Z" fill="#e0453a" />
          <rect x="74" y="108" width="52" height="8" rx="2" fill="#3a3550" />
          <rect x="80" y="62" width="40" height="46" fill="#fff6c8" opacity="0.4" />
          <path d="M74 62 L126 62 L100 40 Z" fill="#e0453a" />
          <circle cx="100" cy="38" r="3" fill="#3a3550" />
        </g>
      );
      delante = <rect x="80" y="62" width="40" height="46" fill="none" stroke="#3a3550" strokeWidth="4" />;
      break;
    case 10: // Pebetero
      detras = (
        <g>
          {llamita(46, 70, 1.9, 2.1)}
          {llamita(116, 74, 1.8, 2.0, -0.7)}
          <rect x="88" y="138" width="24" height="46" fill={`url(#${id}-oro)`} />
          <rect x="70" y="182" width="60" height="12" rx="3" fill="#b8860b" />
          <path d="M44 112 L156 112 Q150 144 100 146 Q50 144 44 112 Z" fill={`url(#${id}-oro)`} />
          <rect x="40" y="106" width="120" height="10" rx="4" fill="#e6b93f" />
          <path d="M60 124 Q100 132 140 124" stroke="#fff3b0" strokeWidth="2" fill="none" opacity="0.6" />
        </g>
      );
      break;
    case 11: // Forja
      detras = (
        <g>
          <rect x="34" y="150" width="132" height="44" rx="6" fill="#5a4a4a" />
          <path d="M40 152 Q100 136 160 152 L160 162 L40 162 Z" fill="#2a1f1f" />
          {Array.from({ length: 9 }, (_, i) => (
            <circle key={i} cx={48 + i * 13} cy={154 + (i % 2) * 3} r="5" fill={i % 3 ? "#ff6a2b" : "#ffc23d"} className={anim ? "fase-brasa" : undefined} style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
          {/* Yunque y martillo */}
          <path d="M150 128 L190 128 L186 136 L174 136 L176 148 L164 148 L166 136 L156 136 Z" fill="#3a3a48" />
        </g>
      );
      delante = (
        <g fill="#fff6c2">
          {/* El martillo golpea el yunque y salta un destello */}
          <g transform="translate(176 104)">
            <g className={anim ? "fase-martillo" : undefined} style={{ transformOrigin: "14px 30px" }}>
              <rect x="11" y="0" width="5" height="30" rx="2" fill="#8a5a34" />
              <rect x="0" y="-6" width="26" height="10" rx="2" fill="#4a4a58" />
            </g>
          </g>
          <circle cx="168" cy="126" r="8" fill="#fff6c2" className={anim ? "fase-golpe" : undefined} />
          {[
            [62, 110, 0],
            [140, 104, 0.5],
            [80, 84, 1],
            [124, 80, 1.5],
            [100, 64, 2],
          ].map(([cx, cy, r]) => (
            <circle key={cx} cx={cx} cy={cy} r="2.5" className={anim ? "chispa-subir" : undefined} style={{ animationDelay: `${r}s` }} />
          ))}
        </g>
      );
      break;
    case 12: // Llama azul sobre un quemador
      detras = (
        <g>
          <rect x="74" y="160" width="52" height="12" rx="3" fill="#8f97a8" />
          <rect x="90" y="172" width="20" height="16" fill="#6b7384" />
          <rect x="64" y="186" width="72" height="10" rx="4" fill="#4b5263" />
        </g>
      );
      delante = (
        <g fill="none" stroke="#9ec9ff" strokeWidth="2" strokeLinecap="round" opacity="0.7">
          {[60, 100, 140].map((cx, i) => (
            <path key={cx} d={`M${cx} 40 q6 -8 0 -16 q-6 -8 0 -16`} className={anim ? "fase-calor" : undefined} style={{ animationDelay: `${i * 0.5}s` }} />
          ))}
        </g>
      );
      break;
    case 13: // Estrella en el cielo
      detras = (
        <g>
          <circle cx="100" cy="100" r="96" fill="#1d1a4a" />
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i * 137.5 * Math.PI) / 180;
            const r = 40 + ((i * 29) % 52);
            return <circle key={i} cx={100 + Math.cos(a) * r} cy={100 + Math.sin(a) * r} r={i % 3 ? 1 : 1.8} fill="#fff" className={anim ? "fase-titilar" : undefined} style={{ animationDelay: `${(i % 5) * 0.5}s` }} />;
          })}
          <g className={anim ? "fase-girar" : undefined}>
            <path d="M100 18 L110 90 L182 100 L110 110 L100 182 L90 110 L18 100 L90 90 Z" fill="#fff3b0" opacity="0.55" />
          </g>
        </g>
      );
      break;
    case 14: // Sol
      detras = (
        <g className={anim ? "fase-girar" : undefined}>
          {Array.from({ length: 16 }, (_, i) => (
            <path key={i} d="M100 2 L108 30 L92 30 Z" fill={i % 2 ? "#ffe066" : "#ffb000"} transform={`rotate(${i * 22.5} 100 100)`} />
          ))}
        </g>
      );
      break;
  }

  const brazos = n >= 4 && n !== 9;

  /** Movimiento de Chispa en cada fase. */
  const MOVIMIENTO: Record<number, string> = {
    1: "fase-salto",
    3: "fase-bamboleo",
    6: "fase-baile",
    7: "fase-baile",
    8: "fase-bamboleo",
    10: "fase-victoria",
    11: "animate-flotar",
    12: "fase-bamboleo",
    13: "animate-flotar",
    14: "fase-respirar",
  };
  // Fases en las que el objeto se mueve junto con Chispa (fósforo, farol colgado, antorcha).
  const TODO: Record<number, { clase: string; origen: string }> = {
    2: { clase: "fase-pendulo", origen: "100px 190px" },
    4: { clase: "fase-pendulo", origen: "100px 44px" },
    5: { clase: "fase-antorcha", origen: "100px 194px" },
  };
  const todo = anim ? TODO[n] : undefined;

  return (
    <svg
      viewBox="0 0 200 200"
      width={tamano}
      height={tamano}
      role="img"
      aria-label={`Chispa en fase ${n}: ${FASES[n - 1]!.nombre}`}
      style={bloqueada ? { filter: "brightness(0) opacity(0.18)" } : undefined}
    >
      <defs>
        <radialGradient id={`${id}-aura`}>
          <stop offset="0" stopColor={aura} stopOpacity="0.6" />
          <stop offset="1" stopColor={aura} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-fuego`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ffd23d" />
          <stop offset="0.55" stopColor="#ff7a1f" />
          <stop offset="1" stopColor="#e8360f" />
        </linearGradient>
        <linearGradient id={`${id}-tronco`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9a5b34" />
          <stop offset="1" stopColor="#6b3a1f" />
        </linearGradient>
        <linearGradient id={`${id}-cera`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#eccf95" />
          <stop offset="0.5" stopColor="#fff6e0" />
          <stop offset="1" stopColor="#e2bf7d" />
        </linearGradient>
        <linearGradient id={`${id}-oro`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b8860b" />
          <stop offset="0.5" stopColor="#ffd75a" />
          <stop offset="1" stopColor="#a87405" />
        </linearGradient>
      </defs>

      {/* Resplandor de Chispa (crece con las fases) */}
      {n !== 13 && <circle cx="100" cy={centro} r={26 + n * 4} fill={`url(#${id}-aura)`} className={anim && n >= 10 ? "chispa-latido" : undefined} />}

      <g className={todo?.clase} style={todo ? { transformOrigin: todo.origen } : undefined}>
        {detras}

        {/* Chispa, con el movimiento propio de su fase */}
        <g className={anim ? MOVIMIENTO[n] : undefined} style={{ transformOrigin: `100px ${pie}px` }}>
          <g transform={`translate(${x} ${y}) scale(${s})`}>
            {brazos && (
              <g fill="none" stroke={exterior} strokeWidth="8" strokeLinecap="round">
                {n === 10 ? (
                  // Pebetero: brazos arriba, como campeona
                  <>
                    <path d="M18 74 Q6 60 8 44" />
                    <path d="M82 74 Q94 60 92 44" />
                  </>
                ) : (
                  <>
                    <path d="M18 80 Q6 76 4 64" />
                    <path d="M82 80 Q94 76 97 62" className={anim && n >= 5 ? "fase-saludo" : undefined} style={{ transformOrigin: "82px 80px" }} />
                  </>
                )}
              </g>
            )}
            <CuerpoChispa estado={gesto} exterior={exterior} interior={interior} viva={anim} />
          </g>
        </g>

        {delante}
      </g>
    </svg>
  );
}
