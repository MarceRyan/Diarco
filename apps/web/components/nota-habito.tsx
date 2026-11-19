"use client";

import { habitoRegistroNuevoSchema, type Fecha, type Habito } from "@diarco/shared";
import { useGuardarNota } from "@diarco/shared/hooks";
import { PenLine } from "lucide-react";
import { useId, useState } from "react";
import { Boton } from "./ui/boton";

const MAXIMO = 280;

/**
 * Nota opcional de "qué hiciste" para un hábito cumplido. Se despliega en línea
 * (sin ventana emergente) solo si la persona quiere escribirla.
 */
export function NotaHabito({ habito, fecha, nota }: { habito: Habito; fecha: Fecha; nota: string | null | undefined }) {
  const guardar = useGuardarNota();
  const id = useId();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(nota ?? "");
  const [error, setError] = useState<string>();

  function abrir() {
    setTexto(nota ?? "");
    setError(undefined);
    setEditando(true);
  }

  function enviar(valor: string) {
    const datos = habitoRegistroNuevoSchema.shape.nota.safeParse(valor);
    if (!datos.success) return setError(datos.error.issues[0]?.message);
    guardar.mutate({ habitoId: habito.id, fecha, nota: datos.data }, { onSuccess: () => setEditando(false) });
  }

  if (!editando) {
    return nota ? (
      <button
        type="button"
        onClick={abrir}
        className="flex min-h-11 w-full items-start gap-2 rounded-2xl bg-superficie px-4 py-2.5 text-left transition-colors hover:bg-superficie-2"
        aria-label={`Tu nota de ${habito.nombre}: ${nota}. Toca para editarla`}
      >
        <span aria-hidden>📝</span>
        <span className="flex-1 break-words">{nota}</span>
        <PenLine className="mt-0.5 size-4 shrink-0 text-texto-suave" strokeWidth={2.5} aria-hidden />
      </button>
    ) : (
      <button
        type="button"
        onClick={abrir}
        className="inline-flex min-h-11 items-center gap-1.5 px-1 font-bold text-texto-suave transition-colors hover:text-violeta-texto"
      >
        <PenLine className="size-4" strokeWidth={2.5} aria-hidden />
        ¿Qué hiciste? <span className="font-medium">(opcional)</span>
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border-2 border-violeta/40 bg-violeta-suave p-3">
      <label htmlFor={id} className="text-sm font-extrabold">
        ¿Qué hiciste con «{habito.nombre}»?
      </label>
      <textarea
        id={id}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={MAXIMO}
        rows={2}
        autoFocus
        placeholder={habito.meta ? `Ej. ${habito.meta}…` : "Ej. Cómo te fue, qué aprendiste…"}
        aria-invalid={Boolean(error)}
        className="w-full resize-none rounded-xl border-2 border-borde bg-tarjeta px-3 py-2 font-semibold placeholder:font-medium placeholder:text-texto-suave/80 focus:border-violeta focus:outline-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) enviar(texto);
          if (e.key === "Escape") setEditando(false);
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-texto-suave tabular-nums" aria-live="polite">
          {texto.length}/{MAXIMO}
        </span>
        <div className="flex flex-wrap gap-2">
          {nota && (
            <Boton variante="fantasma" onClick={() => enviar("")} disabled={guardar.isPending}>
              Borrar nota
            </Boton>
          )}
          <Boton variante="fantasma" onClick={() => setEditando(false)} disabled={guardar.isPending}>
            Cancelar
          </Boton>
          <Boton variante="exito" onClick={() => enviar(texto)} cargando={guardar.isPending}>
            Guardar
          </Boton>
        </div>
      </div>
      {(error || guardar.error) && (
        <p role="alert" className="text-sm font-bold text-peligro-texto">
          ¡Uy! {error ?? guardar.error?.message}
        </p>
      )}
    </div>
  );
}
