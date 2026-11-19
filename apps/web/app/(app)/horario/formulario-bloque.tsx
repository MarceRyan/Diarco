"use client";

import {
  bloqueHorarioNuevoSchema,
  horaAMinutos,
  minutosAHora,
  ULTIMO_MINUTO_DEL_DIA,
  type BloqueHorario,
} from "@diarco/shared";
import { useActualizarBloque, useCrearBloque, useEliminarBloque } from "@diarco/shared/hooks";
import { useState, type FormEvent } from "react";
import { SelectorCategoria } from "@/components/categorias";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campos";
import { MensajeError } from "@/components/ui/estados";
import { SelectorDuracion, SelectorHora } from "@/components/ui/selector-hora";
import { SelectorDias } from "@/components/ui/selectores";
import { erroresPorCampo } from "@/lib/formularios";
import { duracion, horaCorta } from "@/lib/formato";

/** Duraciones típicas de un bloque, en minutos. */
const DURACIONES = [30, 45, 60, 90, 120, 180];

export function FormularioBloque({
  bloque,
  diaInicial,
  inicioInicial,
  onListo,
}: {
  bloque?: BloqueHorario;
  diaInicial: number;
  /** Hora "HH:MM" con la que empieza un bloque nuevo (al tocar una hora libre). */
  inicioInicial?: string;
  onListo: () => void;
}) {
  const crear = useCrearBloque();
  const actualizar = useActualizarBloque();
  const eliminar = useEliminarBloque();
  const mutacion = bloque ? actualizar : crear;

  const [titulo, setTitulo] = useState(bloque?.titulo ?? "");
  const [dias, setDias] = useState<number[]>(bloque?.dias_semana ?? [diaInicial]);
  const [inicio, setInicio] = useState(bloque ? horaCorta(bloque.inicio) : (inicioInicial ?? "09:00"));
  const [fin, setFin] = useState(() =>
    bloque
      ? horaCorta(bloque.fin)
      : minutosAHora(Math.min(horaAMinutos(inicioInicial ?? "09:00") + 60, ULTIMO_MINUTO_DEL_DIA)),
  );
  const [categoria, setCategoria] = useState<number | null>(bloque?.categoria_id ?? null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Duración en vez de hora de fin: "Otra" muestra un selector libre para la hora de fin.
  const duracionActual = horaAMinutos(fin) - horaAMinutos(inicio);
  const [otra, setOtra] = useState(() => bloque !== undefined && !DURACIONES.includes(duracionActual));
  const maximo = ULTIMO_MINUTO_DEL_DIA - horaAMinutos(inicio);

  function cambiarInicio(nuevo: string) {
    // Al mover el inicio se conserva la duración (sin pasar de la medianoche).
    const dur = duracionActual > 0 ? duracionActual : 60;
    setInicio(nuevo);
    setFin(minutosAHora(Math.min(horaAMinutos(nuevo) + dur, ULTIMO_MINUTO_DEL_DIA)));
  }

  function elegirDuracion(minutos: number | null) {
    if (minutos === null) return;
    setOtra(false);
    setFin(minutosAHora(horaAMinutos(inicio) + minutos));
  }

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
      <SelectorHora etiqueta="¿A qué hora empieza?" valor={inicio} onCambiar={cambiarInicio} error={errores.inicio} />
      <SelectorDuracion
        etiqueta="¿Cuánto dura?"
        valor={duracionActual}
        opciones={DURACIONES}
        onCambiar={elegirDuracion}
        maximo={maximo}
        otra={otra}
        onOtra={() => setOtra(true)}
      />
      {otra && <SelectorHora etiqueta="¿A qué hora termina?" valor={fin} onCambiar={setFin} atajos={[]} />}

      {/* Resumen del bloque, o el problema si las horas no cuadran */}
      <p
        role="status"
        className={`rounded-2xl px-4 py-3 font-bold ${
          duracionActual > 0 ? "bg-cielo-suave text-cielo-texto" : "bg-peligro-suave text-peligro-texto"
        }`}
      >
        {duracionActual > 0
          ? `De ${inicio} a ${fin} · ${duracion(duracionActual)}`
          : errores.fin ?? "La hora de fin debe ser después del inicio (y el bloque no puede pasar de la medianoche)."}
      </p>
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
