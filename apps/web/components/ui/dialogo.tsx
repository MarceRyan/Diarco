"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Boton } from "./boton";

interface PropsDialogo {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
}

/**
 * Diálogo modal basado en <dialog> nativo: atrapa el foco, se cierra con Esc
 * y es accesible sin librerías. En móvil sube como una hoja desde abajo.
 */
export function Dialogo({ abierto, onCerrar, titulo, children }: PropsDialogo) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()} // clic en el fondo
      aria-labelledby={idTitulo}
      className="m-0 mt-auto w-full max-w-none rounded-t-[28px] border-2 border-b-0 border-borde bg-tarjeta p-0 text-texto sm:m-auto sm:max-w-lg sm:rounded-[28px] sm:border-b-4"
    >
      {abierto && (
        <div className="flex max-h-[90dvh] animate-entrar flex-col">
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-borde-fuerte sm:hidden" aria-hidden />
          <header className="flex items-center justify-between px-5 pt-3 pb-1">
            <h2 id={idTitulo} className="font-titulo text-2xl font-bold">
              {titulo}
            </h2>
            <Boton variante="fantasma" icono aria-label="Cerrar" onClick={onCerrar}>
              <X className="size-5" strokeWidth={2.5} aria-hidden />
            </Boton>
          </header>
          <div className="overflow-y-auto px-5 pt-2 pb-6">{children}</div>
        </div>
      )}
    </dialog>
  );
}
