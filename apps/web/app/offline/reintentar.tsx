"use client";

import { RotateCw } from "lucide-react";
import { Boton } from "@/components/ui/boton";

export function BotonReintentar() {
  return (
    <Boton grande onClick={() => window.location.replace("/hoy")}>
      <RotateCw className="size-5" strokeWidth={2.5} aria-hidden />
      Reintentar
    </Boton>
  );
}
