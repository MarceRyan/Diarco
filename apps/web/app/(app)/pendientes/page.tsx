import type { Metadata } from "next";
import { PantallaPendientes } from "./pantalla";

export const metadata: Metadata = { title: "Pendientes" };

export default function PaginaPendientes() {
  return <PantallaPendientes />;
}
