"use client";

import { useVigilanteLogros } from "@diarco/shared/hooks";
import { Award, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
        <div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-borde bg-fondo p-3 shadow-lg">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mandarina-suave text-mandarina-texto" aria-hidden>
            <Award className="size-5" />
          </span>
          <Link href="/logros" className="min-w-0 flex-1" onClick={() => setAviso(null)}>
            <span className="block text-sm font-semibold">
              {aviso.length === 1 ? "¡Logro desbloqueado!" : `¡${aviso.length} logros desbloqueados!`}
            </span>
            <span className="block truncate text-sm text-texto-suave">{aviso.join(", ")}</span>
          </Link>
          <button
            type="button"
            onClick={() => setAviso(null)}
            aria-label="Cerrar aviso"
            className="flex size-11 items-center justify-center rounded-xl text-texto-suave hover:bg-superficie"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
