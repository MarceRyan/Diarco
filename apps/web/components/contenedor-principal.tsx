"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Pantallas que aprovechan todo el ancho en escritorio (cuadrículas y gráficos). */
const RUTAS_ANCHAS = ["/horario", "/estadisticas"];

/**
 * Ancho del área de contenido: las pantallas de lectura y listas usan una
 * columna cómoda; el horario y el progreso se extienden en pantallas grandes.
 */
export function ContenedorPrincipal({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const ancha = RUTAS_ANCHAS.some((r) => ruta === r || ruta.startsWith(`${r}/`));
  return (
    <main
      className={`mx-auto w-full px-4 pt-6 pb-28 md:px-8 md:pt-10 md:pb-10 ${ancha ? "max-w-[96rem]" : "max-w-3xl"}`}
    >
      {children}
    </main>
  );
}
