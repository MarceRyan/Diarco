import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "fantasma" | "peligro" | "exito";

/*
 * Botón "gordito": un labio inferior de 4 px del tono oscuro del color.
 * Al presionarlo baja 2 px y el labio se reduce, como una tecla de verdad.
 */
const estilos: Record<Variante, string> = {
  primario: "bg-violeta text-sobre-violeta border-b-4 border-violeta-labio hover:brightness-110",
  exito: "bg-verde text-white border-b-4 border-verde-labio hover:brightness-110",
  secundario: "bg-tarjeta text-texto border-2 border-b-4 border-borde-fuerte hover:bg-superficie",
  peligro: "bg-tarjeta text-peligro-texto border-2 border-b-4 border-peligro/50 hover:bg-peligro-suave",
  fantasma: "text-texto-suave hover:bg-superficie hover:text-texto",
};

const presionable = "active:translate-y-[2px] active:border-b-2 disabled:active:translate-y-0";

interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  cargando?: boolean;
  /** Botón cuadrado solo con ícono (requiere aria-label). */
  icono?: boolean;
  /** Más alto, para la acción principal de una pantalla. */
  grande?: boolean;
}

/** Botón con altura mínima de 44 px (objetivo táctil accesible). */
export function Boton({
  variante = "primario",
  cargando = false,
  icono = false,
  grande = false,
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
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-extrabold tracking-wide transition-[transform,filter,background-color] duration-100 disabled:cursor-not-allowed disabled:opacity-50 ${
        grande ? "min-h-13 px-6 text-base" : "min-h-11 text-[15px]"
      } ${icono ? "min-w-11 px-0" : grande ? "" : "px-4"} ${estilos[variante]} ${variante === "fantasma" ? "" : presionable} ${className}`}
      {...props}
    >
      {cargando && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/** Mismas clases para enlaces que deben verse como botón. */
export function claseBoton(variante: Variante = "primario", grande = false) {
  return `inline-flex items-center justify-center gap-2 rounded-2xl font-extrabold tracking-wide transition-[transform,filter,background-color] duration-100 ${
    grande ? "min-h-13 px-6 text-base" : "min-h-11 px-4 text-[15px]"
  } ${estilos[variante]} ${presionable}`;
}
