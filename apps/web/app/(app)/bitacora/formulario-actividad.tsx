"use client";

import { actividadNuevaSchema, type Actividad, type Fecha } from "@diarco/shared";
import { useActualizarActividad, useCrearActividad, useEliminarActividad } from "@diarco/shared/hooks";
import { useState, type FormEvent } from "react";
import { SelectorCategoria } from "@/components/categorias";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campos";
import { MensajeError } from "@/components/ui/estados";
import { erroresPorCampo } from "@/lib/formularios";
import { horaCorta } from "@/lib/formato";

export function FormularioActividad({
  actividad,
  fecha,
  onListo,
}: {
  actividad?: Actividad;
  fecha: Fecha;
  onListo: () => void;
}) {
  const crear = useCrearActividad();
  const actualizar = useActualizarActividad();
  const eliminar = useEliminarActividad();
  const mutacion = actividad ? actualizar : crear;

  const [descripcion, setDescripcion] = useState(actividad?.descripcion ?? "");
  const [hora, setHora] = useState(actividad?.hora ? horaCorta(actividad.hora) : "");
  const [minutos, setMinutos] = useState(actividad?.minutos?.toString() ?? "");
  const [categoria, setCategoria] = useState<number | null>(actividad?.categoria_id ?? null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    const datos = actividadNuevaSchema.safeParse({
      fecha: actividad?.fecha ?? fecha,
      descripcion,
      hora: hora || null,
      minutos: minutos === "" ? null : Number(minutos),
      categoria_id: categoria,
    });
    if (!datos.success) return setErrores(erroresPorCampo(datos.error));
    setErrores({});
    try {
      if (actividad) await actualizar.mutateAsync({ id: actividad.id, cambios: datos.data });
      else await crear.mutateAsync(datos.data);
      onListo();
    } catch {
      // Se muestra con mutacion.error.
    }
  }

  async function borrar() {
    if (!actividad || !confirm("¿Eliminar esta actividad?")) return;
    await eliminar.mutateAsync(actividad.id);
    onListo();
  }

  return (
    <form onSubmit={guardar} className="space-y-5" noValidate>
      {mutacion.error && <MensajeError error={mutacion.error} />}
      <Campo
        etiqueta="¿Qué hiciste?"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Ej. Terminé el informe mensual"
        maxLength={500}
        error={errores.descripcion}
        autoFocus
      />
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Hora (opcional)" type="time" value={hora} onChange={(e) => setHora(e.target.value)} error={errores.hora} />
        <Campo
          etiqueta="Minutos (opcional)"
          type="number"
          inputMode="numeric"
          min={1}
          max={1440}
          value={minutos}
          onChange={(e) => setMinutos(e.target.value)}
          error={errores.minutos}
        />
      </div>
      <SelectorCategoria valor={categoria} onCambiar={setCategoria} />
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
        {actividad ? (
          <Boton variante="peligro" onClick={borrar} cargando={eliminar.isPending}>
            Eliminar
          </Boton>
        ) : (
          <span />
        )}
        <Boton type="submit" cargando={mutacion.isPending}>
          {actividad ? "Guardar cambios" : "Agregar"}
        </Boton>
      </div>
    </form>
  );
}
