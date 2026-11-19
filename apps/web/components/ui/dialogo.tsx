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
 * y es accesible sin librerías. En móvil se muestra como hoja inferior.
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
      className="m-0 mt-auto w-full max-w-none rounded-t-3xl bg-fondo p-0 text-texto sm:m-auto sm:max-w-lg sm:rounded-3xl"
    >
      {abierto && (
        <div className="flex max-h-[90dvh] flex-col">
          <header className="flex items-center justify-between border-b border-borde px-5 py-3">
            <h2 id={idTitulo} className="font-titulo text-lg font-semibold">
              {titulo}
            </h2>
            <Boton variante="fantasma" icono aria-label="Cerrar" onClick={onCerrar}>
              <X className="size-5" aria-hidden />
            </Boton>
          </header>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}
