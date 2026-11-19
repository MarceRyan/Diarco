import type { Metadata } from "next";
import { PantallaBitacora } from "./pantalla";

export const metadata: Metadata = { title: "Bitácora" };

export default function PaginaBitacora() {
  return <PantallaBitacora />;
}
