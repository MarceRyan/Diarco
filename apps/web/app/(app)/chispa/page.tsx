import type { Metadata } from "next";
import { PantallaChispa } from "./pantalla";

export const metadata: Metadata = { title: "La casa de Chispa" };

export default function PaginaChispa() {
  return <PantallaChispa />;
}
