/**
 * Ráfaga de confeti de papel picado: piezas de colores de la paleta que salen
 * desde el centro del elemento padre (que debe tener position: relative).
 * Decorativo: aria-hidden y desactivado con prefers-reduced-motion.
 */
const COLORES = ["var(--mandarina)", "var(--violeta)", "var(--verde)", "var(--amarillo)", "var(--cielo)", "#ff8fa3"];

/** Pseudoaleatorio determinista: misma semilla, misma ráfaga (sin desajustes de hidratación). */
function aleatorio(semilla: number) {
  const x = Math.sin(semilla * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function Confeti({ piezas = 14, alcance = 56 }: { piezas?: number; alcance?: number }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-visible motion-reduce:hidden">
      {Array.from({ length: piezas }, (_, i) => {
        const angulo = (i / piezas) * Math.PI * 2 + aleatorio(i) * 0.6;
        const distancia = alcance * (0.6 + aleatorio(i + 7) * 0.6);
        const forma = i % 3; // 0 rectángulo, 1 círculo, 2 triángulo (banderín)
        return (
          <span
            key={i}
            className="absolute top-1/2 left-1/2 block"
            style={
              {
                width: forma === 0 ? 8 : 7,
                height: forma === 0 ? 5 : 7,
                backgroundColor: COLORES[i % COLORES.length],
                borderRadius: forma === 1 ? "999px" : "1px",
                clipPath: forma === 2 ? "polygon(0 0, 100% 0, 50% 100%)" : undefined,
                "--dx": `${Math.cos(angulo) * distancia}px`,
                "--dy": `${Math.sin(angulo) * distancia - 12}px`,
                "--giro": `${(aleatorio(i + 3) - 0.5) * 540}deg`,
                animation: `confeti 760ms cubic-bezier(0.16, 1, 0.3, 1) ${aleatorio(i + 11) * 80}ms forwards`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </span>
  );
}
