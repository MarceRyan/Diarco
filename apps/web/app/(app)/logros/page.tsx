import type { Metadata } from "next";
import { PantallaLogros } from "./pantalla";

export const metadata: Metadata = { title: "Logros" };

export default function PaginaLogros() {
  return <PantallaLogros />;
}
