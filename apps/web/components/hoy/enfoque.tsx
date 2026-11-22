"use client";

import { useHoy, useZonaHoraria } from "@diarco/shared/hooks";
import { Expand, Play, Plus, Timer } from "lucide-react";
import { useState, type FormEvent } from "react";
import { SelectorCategoria } from "@/components/categorias";
import { DURACIONES, MINUTOS_MAX, MINUTOS_MIN, useEstadoEnfoque } from "@/components/enfoque/estado";
import { abrirEnfoque, empezarEnfoque } from "@/components/enfoque/pantalla-enfoque";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campos";
import { claseTarjeta } from "@/components/ui/estados";

/**
 * Tarjeta del Modo enfoque en Hoy: eliges en qué y cuánto tiempo, y la sesión
 * se abre a pantalla completa (Chispa vela). Si ya hay una sesión, permite volver a ella.
 */
export function Enfoque() {
  const hoy = useHoy();
  const zona = useZonaHoraria();
  const estado = useEstadoEnfoque();

  const [descripcion, setDescripcion] = useState("");
  /** Duración elegida: un número de la lista, "otro" (escrito a mano) o "libre" (cronómetro). */
  const [opcion, setOpcion] = useState<number | "otro" | "libre">(25);
  const [otros, setOtros] = useState("30");
  const [categoria, setCategoria] = useState<number | null>(null);
  const [verCategoria, setVerCategoria] = useState(false);
  const [error, setError] = useState<string>();
  const [errorMinutos, setErrorMinutos] = useState<string>();

  function empezar(evento: FormEvent) {
    evento.preventDefault();
    const texto = descripcion.trim();
    if (!texto) return setError("Escribe en qué te vas a enfocar.");
    setError(undefined);
    let minutos = typeof opcion === "number" ? opcion : 0;
    if (opcion === "otro") {
      minutos = Number(otros);
      if (!Number.isInteger(minutos) || minutos < MINUTOS_MIN || minutos > MINUTOS_MAX) {
        return setErrorMinutos(`Escribe un número entero de ${MINUTOS_MIN} a ${MINUTOS_MAX} minutos.`);
      }
    }
    setErrorMinutos(undefined);
    empezarEnfoque(
      { descripcion: texto.slice(0, 500), minutos, categoria_id: categoria, libre: opcion === "libre" },
      hoy,
      zona,
    );
    setDescripcion("");
  }

  const claseOpcion =
    "min-h-11 rounded-2xl border-2 border-b-4 border-borde bg-tarjeta text-sm font-extrabold transition-transform duration-100 active:translate-y-[2px] active:border-b-2 aria-pressed:border-violeta aria-pressed:bg-violeta-suave aria-pressed:text-violeta-texto";

  const enCurso = estado && (estado.fase === "enfoque" || estado.fase === "descanso") ? estado : null;

  return (
    <section aria-labelledby="titulo-enfoque" className={`${claseTarjeta} p-4`}>
      <h2 id="titulo-enfoque" className="mb-3 flex items-center gap-2 font-titulo text-xl font-bold">
        <Timer className="size-5 text-violeta-texto" strokeWidth={2.5} aria-hidden />
        Modo enfoque
      </h2>

      {estado ? (
        <div className="space-y-3 rounded-2xl bg-violeta-suave p-4">
          <p className="font-bold">
            {enCurso
              ? `${enCurso.fase === "enfoque" ? "Enfocándote en" : "Descansando de"} «${enCurso.plan.descripcion}»`
              : estado.fase === "fin_enfoque"
                ? "¡Terminaste una sesión! Tu descanso te espera."
                : "Descanso terminado."}
          </p>
          {enCurso?.pausadoRestante !== null && enCurso && (
            <p className="text-sm font-extrabold text-violeta-texto">En pausa</p>
          )}
          <Boton onClick={abrirEnfoque} className="w-full">
            <Expand className="size-5" strokeWidth={2.5} aria-hidden />
            Volver a la pantalla de enfoque
          </Boton>
        </div>
      ) : (
        <form onSubmit={empezar} className="space-y-3" noValidate>
          <Campo
            etiqueta="¿En qué te vas a enfocar?"
            value={descripcion}
            onChange={(e) => {
              setDescripcion(e.target.value);
              setError(undefined);
            }}
            placeholder="Ej. Repasar para el examen"
            maxLength={500}
            error={error}
          />
          <fieldset>
            <legend className="sr-only">¿Cuánto tiempo?</legend>
            <div className="grid grid-cols-3 gap-1.5">
              {DURACIONES.map((m) => (
                <button key={m} type="button" aria-pressed={opcion === m} aria-label={`${m} minutos`} onClick={() => setOpcion(m)} className={claseOpcion}>
                  {m} min
                </button>
              ))}
              <button type="button" aria-pressed={opcion === "otro"} onClick={() => setOpcion("otro")} className={claseOpcion}>
                Otro
              </button>
              <button
                type="button"
                aria-pressed={opcion === "libre"}
                aria-label="Libre: cronómetro sin límite que detienes tú"
                onClick={() => setOpcion("libre")}
                className={`${claseOpcion} inline-flex items-center justify-center gap-1`}
              >
                <Timer className="size-4" strokeWidth={2.5} aria-hidden />
                Libre
              </button>
            </div>
          </fieldset>
          {opcion === "otro" && (
            <Campo
              etiqueta="Minutos"
              type="number"
              inputMode="numeric"
              min={MINUTOS_MIN}
              max={MINUTOS_MAX}
              value={otros}
              onChange={(e) => {
                setOtros(e.target.value);
                setErrorMinutos(undefined);
              }}
              error={errorMinutos}
              ayuda={errorMinutos ? undefined : `De ${MINUTOS_MIN} a ${MINUTOS_MAX} minutos.`}
            />
          )}
          {opcion === "libre" && (
            <p className="rounded-2xl bg-superficie px-3 py-2 text-sm text-texto-suave">
              El cronómetro cuenta hacia arriba hasta que pulses «Terminar». Se guarda lo que lleves.
            </p>
          )}
          {verCategoria ? (
            <SelectorCategoria valor={categoria} onCambiar={setCategoria} />
          ) : (
            <button
              type="button"
              onClick={() => setVerCategoria(true)}
              aria-expanded={false}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-extrabold text-texto-suave hover:text-violeta-texto"
            >
              <Plus className="size-4" strokeWidth={3} aria-hidden />
              Categoría <span className="font-medium">(opcional)</span>
            </button>
          )}
          <Boton type="submit" className="w-full">
            <Play className="size-5" strokeWidth={2.5} aria-hidden />
            Empezar
          </Boton>
          <p className="text-center text-xs text-texto-suave">Se abre a pantalla completa. Al terminar se anota en tu bitácora.</p>
        </form>
      )}
    </section>
  );
}
