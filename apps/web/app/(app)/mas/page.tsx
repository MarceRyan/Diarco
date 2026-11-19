import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { claseTarjeta, Encabezado } from "@/components/ui/estados";
import { CLASES_COLOR, SECUNDARIOS } from "@/lib/secciones";

export const metadata: Metadata = { title: "Más" };

/** Menú de secciones secundarias para la navegación móvil. */
export default function PaginaMas() {
  return (
    <>
      <Encabezado titulo="Más cosas" />
      <ul className="space-y-3">
        {SECUNDARIOS.map(({ href, etiqueta, descripcion, Icono, color }) => (
          <li key={href}>
            <Link
              href={href}
              className={`${claseTarjeta} flex min-h-18 items-center gap-4 px-4 py-3 transition-transform active:translate-y-[2px] active:border-b-2`}
            >
              <span className={`flex size-12 items-center justify-center rounded-2xl ${CLASES_COLOR[color].icono}`} aria-hidden>
                <Icono className="size-6" strokeWidth={2.5} />
              </span>
              <span className="flex-1">
                <span className="block font-titulo text-xl font-bold">{etiqueta}</span>
                <span className="block text-texto-suave">{descripcion}</span>
              </span>
              <ChevronRight className="size-6 text-texto-suave" strokeWidth={2.5} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
