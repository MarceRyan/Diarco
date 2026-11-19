"use client";

import { Check } from "lucide-react";

/** Días en orden de lunes a domingo (valor 0 = domingo, como en la base de datos). */
const DIAS = [
  { valor: 1, corto: "L", nombre: "Lunes" },
  { valor: 2, corto: "M", nombre: "Martes" },
  { valor: 3, corto: "X", nombre: "Miércoles" },
  { valor: 4, corto: "J", nombre: "Jueves" },
  { valor: 5, corto: "V", nombre: "Viernes" },
  { valor: 6, corto: "S", nombre: "Sábado" },
  { valor: 0, corto: "D", nombre: "Domingo" },
];

export function SelectorDias({
  valor,
  onCambiar,
  error,
}: {
  valor: number[];
  onCambiar: (dias: number[]) => void;
  error?: string;
}) {
  const alternar = (dia: number) =>
    onCambiar(valor.includes(dia) ? valor.filter((d) => d !== dia) : [...valor, dia].sort());

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-extrabold">¿Qué días?</legend>
      <div className="flex flex-wrap gap-2">
        {DIAS.map((dia) => {
          const activo = valor.includes(dia.valor);
          return (
            <button
              key={dia.valor}
              type="button"
              aria-pressed={activo}
              aria-label={dia.nombre}
              onClick={() => alternar(dia.valor)}
              className={`size-11 rounded-2xl border-2 border-b-4 text-[15px] font-extrabold transition-transform duration-100 active:translate-y-[2px] active:border-b-2 ${
                activo ? "border-violeta-labio bg-violeta text-sobre-violeta" : "border-borde-fuerte bg-tarjeta text-texto-suave"
              }`}
            >
              {dia.corto}
            </button>
          );
        })}
      </div>
      <div className="flex gap-3 text-sm">
        <button type="button" className="min-h-11 font-extrabold text-violeta-texto" onClick={() => onCambiar([0, 1, 2, 3, 4, 5, 6])}>
          Todos los días
        </button>
        <button type="button" className="min-h-11 font-extrabold text-violeta-texto" onClick={() => onCambiar([1, 2, 3, 4, 5])}>
          Lunes a viernes
        </button>
      </div>
      {error && <p className="text-sm font-bold text-peligro-texto">{error}</p>}
    </fieldset>
  );
}

export const PALETA = ["#ff6a2b", "#6741d9", "#2f9ff0", "#17a362", "#ff5fa2", "#ffb020", "#0c8599", "#7c6f99"];

export function SelectorColor({ valor, onCambiar }: { valor: string; onCambiar: (color: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-extrabold">Color</legend>
      <div className="flex flex-wrap gap-2">
        {PALETA.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Color ${color}`}
            aria-pressed={valor === color}
            onClick={() => onCambiar(color)}
            className="flex size-11 items-center justify-center rounded-full ring-offset-2 ring-offset-tarjeta transition-transform active:scale-90 aria-pressed:ring-4 aria-pressed:ring-borde-fuerte"
            style={{ backgroundColor: color }}
          >
            {valor === color && <Check className="size-5 text-white" strokeWidth={3.5} aria-hidden />}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
