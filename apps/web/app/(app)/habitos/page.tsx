import type { Metadata } from "next";
import { PantallaHabitos } from "./pantalla";

export const metadata: Metadata = { title: "Hábitos" };

export default function PaginaHabitos() {
  return <PantallaHabitos />;
}
