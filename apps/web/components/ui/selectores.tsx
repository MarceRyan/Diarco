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
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">Días</legend>
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
              className={`size-11 rounded-full text-sm font-semibold transition ${
                activo ? "bg-violeta text-sobre-violeta" : "border border-borde bg-superficie text-texto-suave"
              }`}
            >
              {dia.corto}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 text-sm">
        <button type="button" className="min-h-11 text-violeta" onClick={() => onCambiar([0, 1, 2, 3, 4, 5, 6])}>
          Todos
        </button>
        <span className="self-center text-texto-suave" aria-hidden>
          ·
        </span>
        <button type="button" className="min-h-11 text-violeta" onClick={() => onCambiar([1, 2, 3, 4, 5])}>
          Lunes a viernes
        </button>
      </div>
      {error && <p className="text-sm text-peligro">{error}</p>}
    </fieldset>
  );
}

export const PALETA = ["#ff6a2b", "#6741d9", "#1c7ed6", "#2f9e44", "#e64980", "#f59f00", "#0c8599", "#495057"];

export function SelectorColor({ valor, onCambiar }: { valor: string; onCambiar: (color: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">Color</legend>
      <div className="flex flex-wrap gap-2">
        {PALETA.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Color ${color}`}
            aria-pressed={valor === color}
            onClick={() => onCambiar(color)}
            className="flex size-11 items-center justify-center rounded-full ring-offset-2 ring-offset-fondo aria-pressed:ring-2 aria-pressed:ring-texto"
            style={{ backgroundColor: color }}
          >
            {valor === color && <Check className="size-5 text-white" aria-hidden />}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
