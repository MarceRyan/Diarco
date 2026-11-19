import type { Metadata } from "next";
import { PantallaHorario } from "./pantalla";

export const metadata: Metadata = { title: "Horario" };

export default function PaginaHorario() {
  return <PantallaHorario />;
}
