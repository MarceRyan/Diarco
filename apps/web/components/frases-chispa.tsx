"use client";

import { useEffect, useState } from "react";

/**
 * Bocadillo de Chispa: muestra sus frases una tras otra cada pocos segundos.
 * Con "reducir movimiento" la animación de entrada se desactiva (CSS global).
 */
export function FrasesChispa({ frases, cada = 3500, className = "" }: { frases: readonly string[]; cada?: number; className?: string }) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (frases.length < 2) return;
    const intervalo = setInterval(() => setIndice((i) => (i + 1) % frases.length), cada);
    return () => clearInterval(intervalo);
  }, [frases.length, cada]);

  return (
    // El alto mínimo va afuera; el bocadillo se apoya abajo para que el piquito quede pegado.
    <div className={`flex flex-col items-center justify-end ${className}`}>
      <div key={indice} className="relative animate-entrar">
        <p className="rounded-2xl border-2 border-borde bg-superficie px-3 py-2 text-sm font-bold" aria-live="polite">
          {frases[indice % frases.length]}
        </p>
        {/* Piquito del bocadillo apuntando a Chispa */}
        <span aria-hidden className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-borde bg-superficie" />
      </div>
    </div>
  );
}
