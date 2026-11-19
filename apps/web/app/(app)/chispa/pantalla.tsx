"use client";

import { CasaChispa } from "@/components/casa-chispa/panel";
import { Encabezado } from "@/components/ui/estados";

export function PantallaChispa() {
  return (
    <>
      <Encabezado titulo="La casa de Chispa" subtitulo="Cada hábito es leña: mírala crecer y pasear por su jardín" />
      <CasaChispa />
    </>
  );
}
