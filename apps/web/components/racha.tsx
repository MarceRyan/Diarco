import { Flame } from "lucide-react";

/** Llama con el número de días de racha. Apagada (gris) si la racha es 0. */
export function InsigniaRacha({ dias, grande = false }: { dias: number; grande?: boolean }) {
  const encendida = dias > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 font-titulo font-bold tabular-nums ${
        encendida ? "text-mandarina-texto" : "text-texto-suave"
      } ${grande ? "text-3xl" : "text-sm"}`}
      aria-label={`Racha de ${dias} ${dias === 1 ? "día" : "días"}`}
    >
      <Flame
        className={grande ? "size-8" : "size-4"}
        fill={encendida ? "currentColor" : "none"}
        aria-hidden
      />
      {dias}
    </span>
  );
}
