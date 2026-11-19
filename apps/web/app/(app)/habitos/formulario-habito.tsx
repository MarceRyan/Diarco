"use client";

import { habitoNuevoSchema, type Habito } from "@diarco/shared";
import { useActualizarHabito, useCrearHabito, useEliminarHabito } from "@diarco/shared/hooks";
import { useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campos";
import { MensajeError } from "@/components/ui/estados";
import { SelectorColor, SelectorDias } from "@/components/ui/selectores";
import { erroresPorCampo } from "@/lib/formularios";

const ICONOS = ["✓", "💧", "📚", "🏃", "🧘", "🥗", "😴", "✍️", "🎸", "💊", "🧹", "🌱"];

/** Formulario de creación o edición de un hábito (si recibe `habito`, edita). */
export function FormularioHabito({ habito, onListo }: { habito?: Habito; onListo: () => void }) {
  const crear = useCrearHabito();
  const actualizar = useActualizarHabito();
  const eliminar = useEliminarHabito();

  const [nombre, setNombre] = useState(habito?.nombre ?? "");
  const [icono, setIcono] = useState(habito?.icono ?? "✓");
  const [color, setColor] = useState(habito?.color ?? "#ff6a2b");
  const [dias, setDias] = useState<number[]>(habito?.dias_semana ?? [0, 1, 2, 3, 4, 5, 6]);
  const [meta, setMeta] = useState(habito?.meta ?? "");
  const [activo, setActivo] = useState(habito?.activo ?? true);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const mutacion = habito ? actualizar : crear;

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    const datos = habitoNuevoSchema.safeParse({ nombre, icono, color, dias_semana: dias, meta, activo });
    if (!datos.success) return setErrores(erroresPorCampo(datos.error));
    setErrores({});
    try {
      if (habito) await actualizar.mutateAsync({ id: habito.id, cambios: datos.data });
      else await crear.mutateAsync(datos.data);
      onListo();
    } catch {
      // El error se muestra con mutacion.error.
    }
  }

  async function borrar() {
    if (!habito) return;
    if (!confirm(`¿Eliminar "${habito.nombre}"? Se borrará también todo su historial.`)) return;
    await eliminar.mutateAsync(habito.id);
    onListo();
  }

  return (
    <form onSubmit={guardar} className="space-y-5" noValidate>
      {mutacion.error && <MensajeError error={mutacion.error} />}
      <Campo
        etiqueta="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Ej. Leer"
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
              className="size-12 rounded-2xl border-2 border-b-4 border-borde bg-tarjeta text-2xl transition-transform duration-100 active:translate-y-[2px] active:border-b-2 aria-pressed:border-violeta aria-pressed:bg-violeta-suave"
            >
              {i}
            </button>
          ))}
        </div>
      </fieldset>

      <SelectorColor valor={color} onCambiar={setColor} />
      <SelectorDias valor={dias} onCambiar={setDias} error={errores.dias_semana} />
      <Campo
        etiqueta="Tu meta (opcional)"
        value={meta}
        onChange={(e) => setMeta(e.target.value)}
        placeholder="Ej. 20 páginas"
        maxLength={120}
        error={errores.meta}
      />

      {habito && (
        <label className="flex min-h-12 items-center gap-3 rounded-2xl bg-superficie px-4 font-bold">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="size-5" />
          <span>
            Activo
            <span className="block text-sm font-medium text-texto-suave">Si lo pausas, no cuenta para tus rachas.</span>
          </span>
        </label>
      )}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
        {habito ? (
          <Boton variante="peligro" onClick={borrar} cargando={eliminar.isPending}>
            Eliminar
          </Boton>
        ) : (
          <span />
        )}
        <Boton type="submit" variante="exito" grande cargando={mutacion.isPending}>
          {habito ? "Guardar cambios" : "¡Crear hábito!"}
        </Boton>
      </div>
    </form>
  );
}
