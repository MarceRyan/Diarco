import type { Metadata } from "next";
import { PantallaChispa } from "./pantalla";

export const metadata: Metadata = { title: "Mi Chispa" };

export default function PaginaChispa() {
  return <PantallaChispa />;
}
