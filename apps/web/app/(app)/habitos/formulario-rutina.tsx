"use client";

import { rutinaNuevaSchema, type Rutina } from "@diarco/shared";
import { useActualizarRutina, useCrearRutina, useEliminarRutina } from "@diarco/shared/hooks";
import { useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campos";
import { MensajeError } from "@/components/ui/estados";
import { SelectorDias } from "@/components/ui/selectores";
import { erroresPorCampo } from "@/lib/formularios";

const ICONOS = ["🧹", "🛏️", "🍽️", "🧺", "🗑️", "🪴", "🐶", "🦷", "🚿", "👕", "🛒", "✨"];

/** Crea o edita una tarea de la rutina (si recibe `rutina`, edita). */
export function FormularioRutina({ rutina, onListo }: { rutina?: Rutina; onListo: () => void }) {
  const crear = useCrearRutina();
  const actualizar = useActualizarRutina();
  const eliminar = useEliminarRutina();

  const [nombre, setNombre] = useState(rutina?.nombre ?? "");
  const [icono, setIcono] = useState(rutina?.icono ?? "🧹");
  const [dias, setDias] = useState<number[]>(rutina?.dias_semana ?? [0, 1, 2, 3, 4, 5, 6]);
  const [activo, setActivo] = useState(rutina?.activo ?? true);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const mutacion = rutina ? actualizar : crear;

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    const datos = rutinaNuevaSchema.safeParse({ nombre, icono, dias_semana: dias, activo });
    if (!datos.success) return setErrores(erroresPorCampo(datos.error));
    setErrores({});
    try {
      if (rutina) await actualizar.mutateAsync({ id: rutina.id, cambios: datos.data });
      else await crear.mutateAsync(datos.data);
      onListo();
    } catch {
      // El error se muestra con mutacion.error.
    }
  }

  async function borrar() {
    if (!rutina || !confirm(`¿Quitar "${rutina.nombre}" de tu rutina?`)) return;
    await eliminar.mutateAsync(rutina.id);
    onListo();
  }

  return (
    <form onSubmit={guardar} className="space-y-5" noValidate>
      {(mutacion.error || eliminar.error) && <MensajeError error={mutacion.error ?? eliminar.error} />}
      <p className="rounded-2xl bg-superficie px-4 py-3 text-sm text-texto-suave">
        La rutina no tiene hora ni racha: si un día no la haces, no pasa nada con tus rachas ni tus logros.
      </p>
      <Campo
        etiqueta="Tarea"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Ej. Tender la cama"
        maxLength={60}
        error={errores.nombre}
        autoFocus
      />

      <fieldset>
        <legend className="mb-2 text-sm font-extrabold">Ícono</legend>
        <div className="flex flex-wrap gap-2">
          {ICONOS.map((i) => (
            <button
              key={i}
              type="button"
              aria-pressed={icono === i}
              aria-label={`Ícono ${i}`}
              onClick={() => setIcono(i)}
              className="size-12 rounded-2xl border-2 border-b-4 border-borde bg-tarjeta text-2xl transition-transform duration-100 active:translate-y-[2px] active:border-b-2 aria-pressed:border-verde aria-pressed:bg-verde-suave"
            >
              {i}
            </button>
          ))}
        </div>
      </fieldset>

      <SelectorDias valor={dias} onCambiar={setDias} error={errores.dias_semana} />

      {rutina && (
        <label className="flex min-h-12 items-center gap-3 rounded-2xl bg-superficie px-4 font-bold">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="size-5" />
          <span>
            Activa
            <span className="block text-sm font-medium text-texto-suave">Si la pausas, no aparece en Hoy.</span>
          </span>
        </label>
      )}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
        {rutina ? (
          <Boton variante="peligro" onClick={borrar} cargando={eliminar.isPending}>
            Quitar
          </Boton>
        ) : (
          <span />
        )}
        <Boton type="submit" variante="exito" grande cargando={mutacion.isPending}>
          {rutina ? "Guardar cambios" : "Agregar a mi rutina"}
        </Boton>
      </div>
    </form>
  );
}
