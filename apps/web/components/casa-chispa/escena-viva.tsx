"use client";

/**
 * Elige cómo mostrar la casa de Chispa:
 * - 3D (Three.js) si el navegador tiene WebGL; se descarga solo cuando hace falta.
 * - Escena SVG animada si no hay WebGL.
 * Lleva el estado de los toques para que el teclado y los lectores de pantalla
 * también puedan saludar a Chispa y escuchar lo que dice.
 */
import type { Estacion } from "@diarco/shared";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { EscenaChispa, useMomento, useMovimientoReducido } from "./escena";

const Escena3D = dynamic(() => import("./escena-3d"), {
  ssr: false,
  loading: () => <CieloCargando />,
});

function CieloCargando() {
  return <div className="absolute inset-0 animate-pulse bg-linear-to-b from-[#2f8fff] via-[#79c9ff] to-[#5cc483]" />;
}

function soportaWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}
const sinCambios = () => () => {};

export function EscenaViva({
  etapa,
  estacion,
  dormida,
  frases = [],
  compacta = false,
  className = "",
}: {
  etapa: number;
  estacion: Estacion;
  dormida: boolean;
  frases?: string[];
  compacta?: boolean;
  className?: string;
}) {
  const webgl = useSyncExternalStore(sinCambios, soportaWebGL, () => null);
  const momento = useMomento();
  const reducir = useMovimientoReducido();
  const anclaRef = useRef<HTMLDivElement>(null);
  const [toques, setToques] = useState(0);
  const [frase, setFrase] = useState<string | null>(null);

  // El globo se esconde solo; cada toque reinicia el tiempo.
  useEffect(() => {
    if (!frase) return;
    const t = setTimeout(() => setFrase(null), 2800);
    return () => clearTimeout(t);
  }, [frase, toques]);

  if (webgl === false) {
    return <EscenaChispa etapa={etapa} estacion={estacion} dormida={dormida} frases={frases} compacta={compacta} className={className} />;
  }

  const tocar = () => {
    if (frases.length > 0) setFrase(frases[toques % frases.length]!);
    setToques((n) => n + 1);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <p className="sr-only">
        La casa de Chispa en {estacion === "otono" ? "otoño" : estacion}
        {dormida ? ": Chispa duerme junto a la fogata." : ": Chispa pasea por su jardín."}
      </p>
      {webgl ? (
        <Escena3D
          etapa={etapa}
          estacion={estacion}
          dormida={dormida}
          momento={momento}
          compacta={compacta}
          quieta={reducir}
          toques={toques}
          onTocar={tocar}
          anclaRef={anclaRef}
        />
      ) : (
        <CieloCargando />
      )}
      {/* Sigue a la cabeza de Chispa: la escena 3D mueve este punto en cada cuadro */}
      <div ref={anclaRef} className="pointer-events-none absolute top-0 left-0 z-10 size-0" aria-hidden>
        {dormida && (
          <span className="absolute bottom-0 left-4 block animate-pulse font-titulo text-3xl font-extrabold whitespace-nowrap text-violeta [text-shadow:0_2px_0_#fff]">
            z z
          </span>
        )}
        {frase && (
          <span
            key={toques}
            className="absolute bottom-1 left-0 block w-max max-w-60 -translate-x-1/2 animate-entrar rounded-2xl border-2 border-b-4 border-borde bg-tarjeta px-3 py-1.5 text-center text-sm leading-tight font-extrabold text-texto"
          >
            {frase}
          </span>
        )}
      </div>
      {!compacta && (
        <>
          {/* Para teclado: aparece al enfocar */}
          <button
            type="button"
            onClick={tocar}
            className="sr-only rounded-full bg-tarjeta px-4 py-2 font-extrabold focus:not-sr-only focus:absolute focus:bottom-3 focus:left-3"
          >
            Saludar a Chispa
          </button>
          <span role="status" className="sr-only">
            {frase ?? ""}
          </span>
        </>
      )}
    </div>
  );
}
