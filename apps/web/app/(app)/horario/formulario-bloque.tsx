"use client";

import { bloqueHorarioNuevoSchema, type BloqueHorario } from "@diarco/shared";
import { useActualizarBloque, useCrearBloque, useEliminarBloque } from "@diarco/shared/hooks";
import { useState, type FormEvent } from "react";
import { SelectorCategoria } from "@/components/categorias";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campos";
import { MensajeError } from "@/components/ui/estados";
import { SelectorDias } from "@/components/ui/selectores";
import { erroresPorCampo } from "@/lib/formularios";
import { horaCorta } from "@/lib/formato";

export function FormularioBloque({
  bloque,
  diaInicial,
  onListo,
}: {
  bloque?: BloqueHorario;
  diaInicial: number;
  onListo: () => void;
}) {
  const crear = useCrearBloque();
  const actualizar = useActualizarBloque();
  const eliminar = useEliminarBloque();
  const mutacion = bloque ? actualizar : crear;

  const [titulo, setTitulo] = useState(bloque?.titulo ?? "");
  const [dias, setDias] = useState<number[]>(bloque?.dias_semana ?? [diaInicial]);
  const [inicio, setInicio] = useState(bloque ? horaCorta(bloque.inicio) : "09:00");
  const [fin, setFin] = useState(bloque ? horaCorta(bloque.fin) : "10:00");
  const [categoria, setCategoria] = useState<number | null>(bloque?.categoria_id ?? null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    const datos = bloqueHorarioNuevoSchema.safeParse({
      titulo,
      dias_semana: dias,
      inicio,
      fin,
      categoria_id: categoria,
    });
    if (!datos.success) return setErrores(erroresPorCampo(datos.error));
    setErrores({});
    try {
      if (bloque) await actualizar.mutateAsync({ id: bloque.id, cambios: datos.data });
      else await crear.mutateAsync(datos.data);
      onListo();
    } catch {
      // Se muestra con mutacion.error.
    }
  }

  async function borrar() {
    if (!bloque || !confirm(`¿Eliminar "${bloque.titulo}" del horario?`)) return;
    await eliminar.mutateAsync(bloque.id);
    onListo();
  }

  return (
    <form onSubmit={guardar} className="space-y-5" noValidate>
      {mutacion.error && <MensajeError error={mutacion.error} />}
      <Campo
        etiqueta="Título"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Ej. Clase de inglés"
        maxLength={80}
        error={errores.titulo}
        autoFocus
      />
      <SelectorDias valor={dias} onCambiar={setDias} error={errores.dias_semana} />
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Inicio" type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} error={errores.inicio} />
        <Campo etiqueta="Fin" type="time" value={fin} onChange={(e) => setFin(e.target.value)} error={errores.fin} />
      </div>
      <SelectorCategoria valor={categoria} onCambiar={setCategoria} />
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
        {bloque ? (
          <Boton variante="peligro" onClick={borrar} cargando={eliminar.isPending}>
            Eliminar
          </Boton>
        ) : (
          <span />
        )}
        <Boton type="submit" cargando={mutacion.isPending}>
          {bloque ? "Guardar cambios" : "Agregar bloque"}
        </Boton>
      </div>
    </form>
  );
}
