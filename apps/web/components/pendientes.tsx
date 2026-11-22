"use client";

import { diasDeAtraso, sumarDias, type Fecha, type Pendiente } from "@diarco/shared";
import { useActualizarPendiente, useCrearPendiente } from "@diarco/shared/hooks";
import { Check, Pencil, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { fechaCorta, horaCorta } from "@/lib/formato";

const formatoDia = new Intl.DateTimeFormat("es", { weekday: "short", day: "numeric", timeZone: "UTC" });

/** "vie 20" */
function diaCorto(fecha: Fecha): string {
  return formatoDia.format(new Date(`${fecha}T00:00:00Z`)).replace(".", "");
}

/** Cuándo toca un pendiente, en pocas palabras: "Atrasado 3 días", "Mañana · 10:00", "vie 20". */
export function cuandoToca(p: Pendiente, hoy: Fecha): { texto: string; atrasado: boolean } {
  const hora = p.hora ? horaCorta(p.hora) : null;
  if (p.hecho_en) return { texto: p.hecho_en === hoy ? "Hecho hoy" : `Hecho el ${diaCorto(p.hecho_en)}`, atrasado: false };
  if (!p.fecha) return { texto: "Algún día", atrasado: false };
  const atraso = diasDeAtraso(p.fecha, hoy);
  if (atraso > 0) {
    return { texto: atraso === 1 ? "Era para ayer" : `Atrasado ${atraso} días · ${fechaCorta(p.fecha)}`, atrasado: true };
  }
  const dia = p.fecha === hoy ? "Hoy" : p.fecha === sumarDias(hoy, 1) ? "Mañana" : diaCorto(p.fecha);
  return { texto: hora ? `${dia} · ${hora}` : dia, atrasado: false };
}

/**
 * Un pendiente con su check grande (44 px). Marcarlo guarda hoy como fecha de
 * hecho; volver a tocarlo lo deshace.
 */
export function FilaPendiente({
  pendiente,
  hoy,
  onEditar,
  mostrarCuando = true,
}: {
  pendiente: Pendiente;
  hoy: Fecha;
  onEditar?: () => void;
  /** Oculta la fecha cuando el grupo ya la dice (ej. "Hoy"), salvo la hora. */
  mostrarCuando?: boolean;
}) {
  const actualizar = useActualizarPendiente();
  const hecho = pendiente.hecho_en !== null;
  const cuando = cuandoToca(pendiente, hoy);
  const meta = mostrarCuando ? cuando.texto : pendiente.hora && !hecho ? horaCorta(pendiente.hora) : null;

  return (
    <li className="flex items-center gap-3 py-2">
      <button
        type="button"
        aria-pressed={hecho}
        aria-label={`${pendiente.titulo}: ${hecho ? "hecho. Toca para deshacer" : "pendiente. Toca para marcarlo como hecho"}`}
        onClick={() => actualizar.mutate({ id: pendiente.id, cambios: { hecho_en: hecho ? null : hoy } })}
        className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-b-4 transition-transform duration-100 active:translate-y-[2px] active:border-b-2 ${
          hecho ? "animate-pop border-verde-labio bg-verde text-white" : "border-borde-fuerte bg-tarjeta hover:border-verde"
        }`}
      >
        {hecho && <Check className="size-6" strokeWidth={3.5} aria-hidden />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`font-bold break-words ${hecho ? "text-texto-suave line-through decoration-2" : ""}`}>{pendiente.titulo}</p>
        {(meta || pendiente.nota) && (
          <p className="truncate text-sm text-texto-suave">
            {meta && (
              <span className={cuando.atrasado && mostrarCuando ? "font-extrabold text-peligro-texto" : "font-bold"}>{meta}</span>
            )}
            {meta && pendiente.nota ? " · " : ""}
            {pendiente.nota}
          </p>
        )}
      </div>
      {onEditar && (
        <Boton variante="fantasma" icono aria-label={`Editar ${pendiente.titulo}`} onClick={onEditar}>
          <Pencil className="size-5" strokeWidth={2.5} aria-hidden />
        </Boton>
      )}
    </li>
  );
}

/** Agrega un pendiente con solo escribirlo (para la fecha indicada, o sin fecha). */
export function AgregarPendiente({ fecha, placeholder = "Agregar un pendiente…" }: { fecha: Fecha | null; placeholder?: string }) {
  const crear = useCrearPendiente();
  const [titulo, setTitulo] = useState("");

  function agregar(evento: FormEvent) {
    evento.preventDefault();
    const limpio = titulo.trim();
    if (!limpio) return;
    crear.mutate({ titulo: limpio.slice(0, 120), fecha, hora: null, nota: null }, { onSuccess: () => setTitulo("") });
  }

  return (
    <form onSubmit={agregar}>
      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Nuevo pendiente{fecha ? "" : " sin fecha"}</span>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={120}
            placeholder={placeholder}
            className="min-h-12 w-full rounded-2xl border-2 border-borde bg-superficie px-4 font-semibold placeholder:font-medium placeholder:text-texto-suave/80 focus:border-violeta focus:bg-tarjeta focus:outline-none"
          />
        </label>
        <Boton type="submit" variante="exito" icono aria-label="Agregar" cargando={crear.isPending} disabled={!titulo.trim()} className="min-h-12 min-w-12">
          {!crear.isPending && <Plus className="size-6" strokeWidth={3} aria-hidden />}
        </Boton>
      </div>
      {crear.error && (
        <p role="alert" className="mt-2 text-sm font-bold text-peligro-texto">
          ¡Uy! {crear.error.message}
        </p>
      )}
    </form>
  );
}
