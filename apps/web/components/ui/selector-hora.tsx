"use client";

import { horaAMinutos, minutosAHora } from "@diarco/shared";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useId, type KeyboardEvent } from "react";
import { duracion } from "@/lib/formato";

const claseFlecha =
  "flex h-11 w-16 items-center justify-center rounded-2xl border-2 border-b-4 border-borde-fuerte bg-tarjeta text-texto-suave transition-transform duration-100 hover:text-texto active:translate-y-[2px] active:border-b-2";

const claseChip =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-b-4 border-borde bg-tarjeta px-4 font-bold transition-transform duration-100 active:translate-y-[2px] active:border-b-2 disabled:opacity-40 aria-pressed:border-violeta aria-pressed:bg-violeta-suave aria-pressed:text-violeta-texto";

/** Una columna (horas o minutos): ▲, el número grande (enfocable, flechas del teclado) y ▼. */
function Rueda({
  valor,
  etiqueta,
  min,
  max,
  onSubir,
  onBajar,
}: {
  valor: number;
  etiqueta: string;
  min: number;
  max: number;
  onSubir: () => void;
  onBajar: () => void;
}) {
  function teclado(e: KeyboardEvent) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onSubir();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onBajar();
    }
  }
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button type="button" className={claseFlecha} onClick={onSubir} aria-label={`Subir ${etiqueta.toLowerCase()}`} tabIndex={-1}>
        <ChevronUp className="size-6" strokeWidth={3} aria-hidden />
      </button>
      <span
        role="spinbutton"
        tabIndex={0}
        aria-label={etiqueta}
        aria-valuenow={valor}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={String(valor).padStart(2, "0")}
        onKeyDown={teclado}
        className="w-20 rounded-2xl py-1 text-center font-titulo text-5xl leading-none font-extrabold tabular-nums focus-visible:bg-violeta-suave"
      >
        {String(valor).padStart(2, "0")}
      </span>
      <button type="button" className={claseFlecha} onClick={onBajar} aria-label={`Bajar ${etiqueta.toLowerCase()}`} tabIndex={-1}>
        <ChevronDown className="size-6" strokeWidth={3} aria-hidden />
      </button>
    </div>
  );
}

export interface AtajoHora {
  etiqueta: string;
  hora: string;
}

export const ATAJOS_DEL_DIA: AtajoHora[] = [
  { etiqueta: "Mañana", hora: "08:00" },
  { etiqueta: "Mediodía", hora: "12:00" },
  { etiqueta: "Tarde", hora: "15:00" },
  { etiqueta: "Noche", hora: "19:00" },
];

/**
 * Selector de hora amigable: horas y minutos grandes con botones ▲▼ y atajos
 * tocables. Reemplaza al <input type="time"> nativo, que cambia según el
 * navegador y es incómodo en el celular.
 */
export function SelectorHora({
  etiqueta,
  valor,
  onCambiar,
  paso = 5,
  atajos = ATAJOS_DEL_DIA,
  error,
}: {
  etiqueta: string;
  /** "HH:MM" */
  valor: string;
  onCambiar: (hora: string) => void;
  /** Salto de los minutos. */
  paso?: number;
  atajos?: AtajoHora[];
  error?: string;
}) {
  const idEtiqueta = useId();
  const total = horaAMinutos(valor);
  const horas = Math.floor(total / 60);
  const minutos = total % 60;

  // Los minutos saltan al siguiente múltiplo del paso (13:52 → 13:55 → 14:00).
  const subirMinutos = () => onCambiar(minutosAHora(horas * 60 + (Math.floor(minutos / paso) + 1) * paso));
  const bajarMinutos = () => onCambiar(minutosAHora(horas * 60 + (Math.ceil(minutos / paso) - 1) * paso));

  return (
    <fieldset aria-describedby={error ? `${idEtiqueta}-error` : undefined}>
      <legend id={idEtiqueta} className="mb-2 text-sm font-extrabold">
        {etiqueta}
      </legend>
      <div className="flex items-center justify-center gap-3 rounded-[20px] border-2 border-borde bg-superficie py-3">
        <Rueda
          valor={horas}
          etiqueta="Hora"
          min={0}
          max={23}
          onSubir={() => onCambiar(minutosAHora(total + 60))}
          onBajar={() => onCambiar(minutosAHora(total - 60))}
        />
        <span className="pb-1 font-titulo text-5xl font-extrabold text-texto-suave" aria-hidden>
          :
        </span>
        <Rueda valor={minutos} etiqueta="Minutos" min={0} max={59} onSubir={subirMinutos} onBajar={bajarMinutos} />
      </div>
      {atajos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Atajos de hora">
          {atajos.map((a) => (
            <button key={a.etiqueta} type="button" aria-pressed={valor === a.hora} onClick={() => onCambiar(a.hora)} className={claseChip}>
              {a.etiqueta}
              <span className="text-sm text-texto-suave tabular-nums">{a.hora}</span>
            </button>
          ))}
        </div>
      )}
      {error && (
        <p id={`${idEtiqueta}-error`} className="mt-1.5 text-sm font-bold text-peligro-texto">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/**
 * Duración en chips (30 min, 1 h…), con opción "Otra" para un valor libre.
 * Las opciones que no caben (por ejemplo, pasan de la medianoche) se desactivan.
 */
export function SelectorDuracion({
  etiqueta,
  valor,
  opciones,
  onCambiar,
  maximo,
  otra,
  onOtra,
  extra,
}: {
  etiqueta: string;
  /** Minutos elegidos (null = ninguno). */
  valor: number | null;
  opciones: number[];
  onCambiar: (minutos: number | null) => void;
  /** Minutos máximos permitidos. */
  maximo?: number;
  /** true cuando el valor actual es libre ("Otra"). */
  otra: boolean;
  onOtra: () => void;
  /** Chip adicional al inicio (ej. "No sé"). */
  extra?: { etiqueta: string; activo: boolean; onElegir: () => void };
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-extrabold">{etiqueta}</legend>
      <div className="flex flex-wrap gap-2">
        {extra && (
          <button type="button" aria-pressed={extra.activo} onClick={extra.onElegir} className={claseChip}>
            {extra.etiqueta}
          </button>
        )}
        {opciones.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={!otra && valor === m}
            disabled={maximo !== undefined && m > maximo}
            onClick={() => onCambiar(m)}
            className={claseChip}
          >
            {duracion(m)}
          </button>
        ))}
        <button type="button" aria-pressed={otra} onClick={onOtra} className={claseChip}>
          Otra
        </button>
      </div>
    </fieldset>
  );
}
