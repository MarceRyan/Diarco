import { Flame } from "lucide-react";

/** Pastilla con la llama y los días de racha. Apagada (gris) si la racha es 0. */
export function InsigniaRacha({ dias }: { dias: number }) {
  const encendida = dias > 0;
  return (
    <span
      className={`inline-flex min-w-12 items-center justify-center gap-1 rounded-full px-2.5 py-1 font-titulo text-base leading-none font-bold tabular-nums ${
        encendida ? "bg-mandarina-suave text-mandarina-texto" : "bg-superficie text-texto-suave"
      }`}
      aria-label={`Racha de ${dias} ${dias === 1 ? "día" : "días"}`}
    >
      <Flame className="size-4" strokeWidth={2.5} fill={encendida ? "currentColor" : "none"} aria-hidden />
      {dias}
    </span>
  );
}
