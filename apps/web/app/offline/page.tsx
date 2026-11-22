import type { Metadata } from "next";
import { Chispa } from "@/components/chispa";
import { BotonReintentar } from "./reintentar";

export const metadata: Metadata = { title: "Sin conexión" };

/** La muestra el service worker cuando no hay internet. */
export default function PaginaSinConexion() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <Chispa estado="dormida" tamano={110} />
      <h1 className="font-titulo text-3xl font-extrabold">Sin conexión</h1>
      <p className="max-w-xs text-texto-suave">Chispa necesita internet para traer tus hábitos. Revisa tu conexión y vuelve a intentar.</p>
      <BotonReintentar />
    </main>
  );
}
