import type { Metadata } from "next";
import { PantallaEstadisticas } from "./pantalla";

export const metadata: Metadata = { title: "Estadísticas" };

export default function PaginaEstadisticas() {
  return <PantallaEstadisticas />;
}
