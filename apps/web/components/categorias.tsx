"use client";

import { categoriaNuevaSchema, type Categoria } from "@diarco/shared";
import { useCategorias, useCrearCategoria, useEliminarCategoria } from "@diarco/shared/hooks";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { erroresPorCampo, mensajeDe } from "@/lib/formularios";
import { Boton } from "./ui/boton";
import { Campo, Selector } from "./ui/campos";
import { Dialogo } from "./ui/dialogo";
import { CargandoLista, MensajeError } from "./ui/estados";
import { PALETA, SelectorColor } from "./ui/selectores";

/** Chip con el color y nombre de una categoría. */
export function ChipCategoria({ categoria }: { categoria: Pick<Categoria, "nombre" | "color"> }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-superficie px-2 py-0.5 text-xs font-medium">
      <span className="size-2 rounded-full" style={{ backgroundColor: categoria.color }} aria-hidden />
      {categoria.nombre}
    </span>
  );
}

/** Selector de categoría con acceso al gestor para crear nuevas. */
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
    <div className="space-y-1">
      <Selector
        etiqueta="Categoría"
        value={valor ?? ""}
        onChange={(e) => onCambiar(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">Sin categoría</option>
        {categorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </Selector>
      <button type="button" onClick={() => setGestor(true)} className="min-h-11 text-sm font-medium text-violeta">
        Gestionar categorías
      </button>
      <GestorCategorias abierto={gestor} onCerrar={() => setGestor(false)} />
    </div>
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
      <div className="space-y-4 border-b border-borde pb-5">
        <Campo
          etiqueta="Nueva categoría"
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
        <Boton onClick={() => void agregar()} cargando={crear.isPending}>
          Agregar
        </Boton>
      </div>
      <div className="pt-4">
        {categorias.isPending ? (
          <CargandoLista filas={2} alto="h-11" />
        ) : categorias.error ? (
          <MensajeError error={categorias.error} onReintentar={() => categorias.refetch()} />
        ) : categorias.data.length === 0 ? (
          <p className="text-sm text-texto-suave">Aún no tienes categorías.</p>
        ) : (
          <ul className="divide-y divide-borde">
            {categorias.data.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-1">
                <ChipCategoria categoria={c} />
                <Boton variante="fantasma" icono aria-label={`Eliminar ${c.nombre}`} onClick={() => borrar(c)}>
                  <Trash2 className="size-4" aria-hidden />
                </Boton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialogo>
  );
}
