"use client";

import { pendienteNuevoSchema, sumarDias, type Pendiente } from "@diarco/shared";
import { useActualizarPendiente, useCrearPendiente, useEliminarPendiente, useHoy } from "@diarco/shared/hooks";
import { useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campos";
import { MensajeError } from "@/components/ui/estados";
import { erroresPorCampo } from "@/lib/formularios";
import { horaCorta } from "@/lib/formato";

type Cuando = "hoy" | "manana" | "otro" | "sin";

const OPCIONES: { valor: Cuando; etiqueta: string }[] = [
  { valor: "hoy", etiqueta: "Hoy" },
  { valor: "manana", etiqueta: "Mañana" },
  { valor: "otro", etiqueta: "Otro día" },
  { valor: "sin", etiqueta: "Sin fecha" },
];

/** Crea o edita un pendiente (si recibe `pendiente`, edita). */
export function FormularioPendiente({ pendiente, onListo }: { pendiente?: Pendiente; onListo: () => void }) {
  const hoy = useHoy();
  const manana = sumarDias(hoy, 1);
  const crear = useCrearPendiente();
  const actualizar = useActualizarPendiente();
  const eliminar = useEliminarPendiente();

  const inicial: Cuando = !pendiente ? "hoy" : !pendiente.fecha ? "sin" : pendiente.fecha === hoy ? "hoy" : pendiente.fecha === manana ? "manana" : "otro";
  const [titulo, setTitulo] = useState(pendiente?.titulo ?? "");
  const [cuando, setCuando] = useState<Cuando>(inicial);
  const [otroDia, setOtroDia] = useState(pendiente?.fecha ?? sumarDias(hoy, 2));
  const [hora, setHora] = useState(pendiente?.hora ? horaCorta(pendiente.hora) : "");
  const [nota, setNota] = useState(pendiente?.nota ?? "");
  const [errores, setErrores] = useState<Record<string, string>>({});

  const mutacion = pendiente ? actualizar : crear;
  const fecha = cuando === "hoy" ? hoy : cuando === "manana" ? manana : cuando === "otro" ? otroDia : null;

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    const datos = pendienteNuevoSchema.safeParse({ titulo, fecha, hora: fecha && hora ? hora : null, nota });
    if (!datos.success) return setErrores(erroresPorCampo(datos.error));
    setErrores({});
    try {
      if (pendiente) await actualizar.mutateAsync({ id: pendiente.id, cambios: datos.data });
      else await crear.mutateAsync(datos.data);
      onListo();
    } catch {
      // El error se muestra con mutacion.error.
    }
  }

  async function borrar() {
    if (!pendiente || !confirm(`¿Eliminar "${pendiente.titulo}"?`)) return;
    await eliminar.mutateAsync(pendiente.id);
    onListo();
  }

  return (
    <form onSubmit={guardar} className="space-y-5" noValidate>
      {(mutacion.error || eliminar.error) && <MensajeError error={mutacion.error ?? eliminar.error} />}
      <Campo
        etiqueta="¿Qué tienes pendiente?"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Ej. Pagar la luz, cita con el dentista"
        maxLength={120}
        error={errores.titulo}
        autoFocus
      />

      <fieldset>
        <legend className="mb-2 text-sm font-extrabold">¿Cuándo?</legend>
        <div className="flex flex-wrap gap-2">
          {OPCIONES.map((o) => (
            <button
              key={o.valor}
              type="button"
              aria-pressed={cuando === o.valor}
              onClick={() => setCuando(o.valor)}
              className="min-h-11 rounded-2xl border-2 border-b-4 border-borde bg-tarjeta px-4 font-extrabold transition-transform duration-100 active:translate-y-[2px] active:border-b-2 aria-pressed:border-cielo aria-pressed:bg-cielo-suave aria-pressed:text-cielo-texto"
            >
              {o.etiqueta}
            </button>
          ))}
        </div>
        {cuando === "sin" && (
          <p className="mt-2 text-sm text-texto-suave">Queda en «Algún día» hasta que le pongas fecha o lo hagas.</p>
        )}
      </fieldset>

      {cuando === "otro" && (
        <Campo etiqueta="Fecha" type="date" value={otroDia} onChange={(e) => setOtroDia(e.target.value)} error={errores.fecha} />
      )}

      {fecha && (
        <Campo
          etiqueta="Hora (opcional)"
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          ayuda="Útil para eventos, como una cita."
          error={errores.hora}
        />
      )}

      <Campo
        etiqueta="Nota (opcional)"
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        placeholder="Ej. Llevar el recibo"
        maxLength={280}
        error={errores.nota}
      />

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
        {pendiente ? (
          <Boton variante="peligro" onClick={borrar} cargando={eliminar.isPending}>
            Eliminar
          </Boton>
        ) : (
          <span />
        )}
        <Boton type="submit" variante="exito" grande cargando={mutacion.isPending}>
          {pendiente ? "Guardar cambios" : "Agregar pendiente"}
        </Boton>
      </div>
    </form>
  );
}
