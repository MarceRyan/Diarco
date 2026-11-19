import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "fantasma" | "peligro";

const estilos: Record<Variante, string> = {
  primario: "bg-violeta text-sobre-violeta hover:opacity-90",
  secundario: "border border-borde bg-superficie text-texto hover:bg-superficie-2",
  fantasma: "text-texto-suave hover:bg-superficie hover:text-texto",
  peligro: "border border-peligro/40 text-peligro hover:bg-peligro/10",
};

interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  cargando?: boolean;
  /** Botón cuadrado solo con ícono (requiere aria-label). */
  icono?: boolean;
}

/** Botón con altura mínima de 44 px (objetivo táctil accesible). */
export function Boton({
  variante = "primario",
  cargando = false,
  icono = false,
  className = "",
  children,
  disabled,
  ...props
}: PropsBoton) {
  return (
    <button
      type="button"
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        icono ? "min-w-11 px-0" : "px-4"
      } ${estilos[variante]} ${className}`}
      {...props}
    >
      {cargando && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
