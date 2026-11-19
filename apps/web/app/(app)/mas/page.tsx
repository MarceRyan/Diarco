import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SECUNDARIOS } from "@/lib/secciones";
import { Encabezado } from "@/components/ui/estados";

export const metadata: Metadata = { title: "Más" };

/** Menú de secciones secundarias para la navegación móvil. */
export default function PaginaMas() {
  return (
    <>
      <Encabezado titulo="Más" />
      <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde">
        {SECUNDARIOS.map(({ href, etiqueta, descripcion, Icono }) => (
          <li key={href}>
            <Link href={href} className="flex min-h-16 items-center gap-4 px-4 py-3 hover:bg-superficie">
              <span className="flex size-10 items-center justify-center rounded-xl bg-violeta-suave text-violeta" aria-hidden>
                <Icono className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{etiqueta}</span>
                <span className="block text-sm text-texto-suave">{descripcion}</span>
              </span>
              <ChevronRight className="size-5 text-texto-suave" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
