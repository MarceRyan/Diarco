"use client";

import { useVigilanteLogros } from "@diarco/shared/hooks";
import { Award, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Confeti } from "./confeti";

const DURACION_AVISO = 6000;

/**
 * Revisa en segundo plano si el usuario ganó logros nuevos, los registra y
 * muestra un aviso. Se monta una sola vez en el layout de la app.
 */
export function VigilanteLogros() {
  const [aviso, setAviso] = useState<string[] | null>(null);

  useVigilanteLogros((nuevos) => setAviso(nuevos.map((l) => l.nombre)));

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), DURACION_AVISO);
    return () => clearTimeout(t);
  }, [aviso]);

  return (
    // La región existe siempre para que los lectores de pantalla anuncien el cambio.
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-20 flex justify-center px-4 md:bottom-6">
      {aviso && (
        <div className="pointer-events-auto flex w-full max-w-sm animate-entrar items-center gap-3 rounded-[20px] border-2 border-b-4 border-amarillo-labio bg-amarillo p-3 text-[#2a2342] shadow-[0_12px_32px_-12px_rgb(42_35_66/0.45)]">
          <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-white/70" aria-hidden>
            <Award className="size-7" strokeWidth={2.5} />
            <Confeti piezas={12} alcance={44} />
          </span>
          <Link href="/logros" className="min-w-0 flex-1" onClick={() => setAviso(null)}>
            <span className="block font-titulo text-lg leading-tight font-extrabold">
              {aviso.length === 1 ? "¡Nueva medalla!" : `¡${aviso.length} medallas nuevas!`}
            </span>
            <span className="block truncate font-bold">{aviso.join(", ")}</span>
          </Link>
          <button
            type="button"
            onClick={() => setAviso(null)}
            aria-label="Cerrar aviso"
            className="flex size-11 items-center justify-center rounded-xl hover:bg-white/40"
          >
            <X className="size-5" strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
