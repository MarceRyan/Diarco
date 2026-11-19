"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Pantallas que se quedan en una columna angosta (menús pensados para el celular). */
const RUTAS_ANGOSTAS = ["/mas"];

/**
 * Ancho del área de contenido. Todas las secciones aprovechan el escritorio
 * (cada una reparte su contenido en columnas desde `lg`/`xl`); en el celular
 * todo queda en una sola columna.
 */
export function ContenedorPrincipal({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const angosta = RUTAS_ANGOSTAS.some((r) => ruta === r || ruta.startsWith(`${r}/`));
  return (
    <main
      className={`mx-auto w-full px-4 pt-6 pb-28 md:px-8 md:pt-10 md:pb-10 ${angosta ? "max-w-3xl" : "max-w-[96rem]"}`}
    >
      {children}
    </main>
  );
}
