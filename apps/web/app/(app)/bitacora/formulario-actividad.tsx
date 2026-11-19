"use client";

import { actividadNuevaSchema, horaActual, type Actividad, type Fecha } from "@diarco/shared";
import { useActualizarActividad, useCrearActividad, useEliminarActividad, useZonaHoraria } from "@diarco/shared/hooks";
import { Clock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { SelectorCategoria } from "@/components/categorias";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campos";
import { MensajeError } from "@/components/ui/estados";
import { SelectorDuracion, SelectorHora } from "@/components/ui/selector-hora";
import { erroresPorCampo } from "@/lib/formularios";
import { horaCorta } from "@/lib/formato";

/** Duraciones típicas de una actividad, en minutos. */
const DURACIONES = [15, 30, 45, 60, 90, 120];

const claseChip =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-b-4 border-borde bg-tarjeta px-4 font-bold transition-transform duration-100 active:translate-y-[2px] active:border-b-2 aria-pressed:border-violeta aria-pressed:bg-violeta-suave aria-pressed:text-violeta-texto";

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

  const zona = useZonaHoraria();
  const [descripcion, setDescripcion] = useState(actividad?.descripcion ?? "");
  const [hora, setHora] = useState(actividad?.hora ? horaCorta(actividad.hora) : "");
  const [modoHora, setModoHora] = useState<"sin" | "ahora" | "elegir">(actividad?.hora ? "elegir" : "sin");
  const [minutos, setMinutos] = useState(actividad?.minutos?.toString() ?? "");
  const [otroTiempo, setOtroTiempo] = useState(
    () => actividad?.minutos != null && !DURACIONES.includes(actividad.minutos),
  );
  const [categoria, setCategoria] = useState<number | null>(actividad?.categoria_id ?? null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  function elegirModoHora(modo: "sin" | "ahora" | "elegir") {
    setModoHora(modo);
    if (modo === "sin") setHora("");
    if (modo === "ahora") setHora(horaActual(zona));
    if (modo === "elegir" && !hora) setHora(horaActual(zona));
  }

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
      {/* ¿Cuándo? Sin hora, ahora mismo u otra hora con el selector grande */}
      <fieldset>
        <legend className="mb-2 text-sm font-extrabold">¿A qué hora?</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={modoHora === "sin"} onClick={() => elegirModoHora("sin")} className={claseChip}>
            Sin hora
          </button>
          <button type="button" aria-pressed={modoHora === "ahora"} onClick={() => elegirModoHora("ahora")} className={claseChip}>
            <Clock className="size-4" strokeWidth={2.5} aria-hidden />
            Ahora
            {modoHora === "ahora" && <span className="text-sm tabular-nums">{hora}</span>}
          </button>
          <button type="button" aria-pressed={modoHora === "elegir"} onClick={() => elegirModoHora("elegir")} className={claseChip}>
            Otra hora
          </button>
        </div>
      </fieldset>
      {modoHora === "elegir" && <SelectorHora etiqueta="Elige la hora" valor={hora || "12:00"} onCambiar={setHora} error={errores.hora} />}

      {/* ¿Cuánto tiempo? Chips de duración, "No sé" o un número libre */}
      <SelectorDuracion
        etiqueta="¿Cuánto tiempo le dedicaste?"
        valor={minutos === "" ? null : Number(minutos)}
        opciones={DURACIONES}
        onCambiar={(m) => {
          setOtroTiempo(false);
          setMinutos(m === null ? "" : String(m));
        }}
        otra={otroTiempo}
        onOtra={() => setOtroTiempo(true)}
        extra={{
          etiqueta: "No sé",
          activo: !otroTiempo && minutos === "",
          onElegir: () => {
            setOtroTiempo(false);
            setMinutos("");
          },
        }}
      />
      {otroTiempo && (
        <Campo
          etiqueta="Minutos"
          type="number"
          inputMode="numeric"
          min={1}
          max={1440}
          value={minutos}
          onChange={(e) => setMinutos(e.target.value)}
          placeholder="Ej. 25"
          error={errores.minutos}
          autoFocus
        />
      )}
      {!otroTiempo && errores.minutos && <p className="text-sm font-bold text-peligro-texto">{errores.minutos}</p>}
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
