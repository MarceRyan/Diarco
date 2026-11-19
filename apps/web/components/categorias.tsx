"use client";

import { categoriaNuevaSchema, type Categoria } from "@diarco/shared";
import { useCategorias, useCrearCategoria, useEliminarCategoria } from "@diarco/shared/hooks";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { erroresPorCampo, mensajeDe } from "@/lib/formularios";
import { Boton } from "./ui/boton";
import { Campo } from "./ui/campos";
import { Dialogo } from "./ui/dialogo";
import { CargandoLista, MensajeError } from "./ui/estados";
import { PALETA, SelectorColor } from "./ui/selectores";

/** Chip con el color y nombre de una categoría. */
export function ChipCategoria({ categoria }: { categoria: Pick<Categoria, "nombre" | "color"> }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-superficie px-2.5 py-0.5 text-sm font-bold">
      <span className="size-2.5 rounded-full" style={{ backgroundColor: categoria.color }} aria-hidden />
      {categoria.nombre}
    </span>
  );
}

const claseChip =
  "inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-b-4 border-borde bg-tarjeta px-4 font-bold transition-transform duration-100 active:translate-y-[2px] active:border-b-2 aria-pressed:border-violeta aria-pressed:bg-violeta-suave aria-pressed:text-violeta-texto";

/** Selector de categoría en chips, con acceso al gestor para crear nuevas. */
export function SelectorCategoria({
  valor,
  onCambiar,
}: {
  valor: number | null;
  onCambiar: (id: number | null) => void;
}) {
  const { data: categorias = [] } = useCategorias();
  const [gestor, setGestor] = useState(false);
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-extrabold">Categoría</legend>
      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={valor === null} onClick={() => onCambiar(null)} className={claseChip}>
          Ninguna
        </button>
        {categorias.map((c) => (
          <button key={c.id} type="button" aria-pressed={valor === c.id} onClick={() => onCambiar(c.id)} className={claseChip}>
            <span className="size-3 rounded-full" style={{ backgroundColor: c.color }} aria-hidden />
            {c.nombre}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setGestor(true)}
          className="inline-flex min-h-11 items-center gap-1 rounded-full border-2 border-dashed border-borde-fuerte px-4 font-extrabold text-violeta-texto"
        >
          <Plus className="size-4" strokeWidth={3} aria-hidden />
          Nueva
        </button>
      </div>
      <GestorCategorias abierto={gestor} onCerrar={() => setGestor(false)} />
    </fieldset>
  );
}

/** Diálogo para crear y borrar categorías. */
export function GestorCategorias({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const categorias = useCategorias();
  const crear = useCrearCategoria();
  const eliminar = useEliminarCategoria();
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState(PALETA[1]!);
  const [error, setError] = useState<string>();

  async function agregar() {
    const datos = categoriaNuevaSchema.safeParse({ nombre, color });
    if (!datos.success) return setError(erroresPorCampo(datos.error).nombre);
    setError(undefined);
    try {
      await crear.mutateAsync(datos.data);
      setNombre("");
    } catch (e) {
      setError(mensajeDe(e));
    }
  }

  function borrar(categoria: Categoria) {
    if (confirm(`¿Eliminar "${categoria.nombre}"? Las actividades y bloques que la usan quedarán sin categoría.`)) {
      eliminar.mutate(categoria.id);
    }
  }

  return (
    <Dialogo abierto={abierto} onCerrar={onCerrar} titulo="Categorías">
      {/* Sin <form>: este diálogo se abre dentro de otros formularios y no se pueden anidar. */}
      <div className="space-y-4 border-b-2 border-borde pb-5">
        <Campo
          etiqueta="Nueva categoría"
          placeholder="Ej. Estudio"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void agregar();
            }
          }}
          error={error}
        />
        <SelectorColor valor={color} onCambiar={setColor} />
        <Boton variante="exito" onClick={() => void agregar()} cargando={crear.isPending}>
          <Plus className="size-5" strokeWidth={3} aria-hidden />
          Agregar
        </Boton>
      </div>
      <div className="pt-4">
        {categorias.isPending ? (
          <CargandoLista filas={2} alto="h-11" />
        ) : categorias.error ? (
          <MensajeError error={categorias.error} onReintentar={() => categorias.refetch()} />
        ) : categorias.data.length === 0 ? (
          <p className="text-texto-suave">Aún no tienes categorías. ¡Crea la primera arriba!</p>
        ) : (
          <ul className="divide-y-2 divide-borde">
            {categorias.data.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-1.5">
                <ChipCategoria categoria={c} />
                <Boton variante="fantasma" icono aria-label={`Eliminar ${c.nombre}`} onClick={() => borrar(c)}>
                  <Trash2 className="size-5" strokeWidth={2.5} aria-hidden />
                </Boton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialogo>
  );
}
