import type { Metadata } from "next";
import { PantallaHoy } from "./pantalla";

export const metadata: Metadata = { title: "Hoy" };

export default function PaginaHoy() {
  return <PantallaHoy />;
}
