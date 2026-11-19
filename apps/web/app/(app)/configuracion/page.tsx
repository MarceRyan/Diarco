import type { Metadata } from "next";
import { PantallaConfiguracion } from "./pantalla";

export const metadata: Metadata = { title: "Configuración" };

export default function PaginaConfiguracion() {
  return <PantallaConfiguracion />;
}
