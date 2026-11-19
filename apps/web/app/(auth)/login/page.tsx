import type { Metadata } from "next";
import { Suspense } from "react";
import { FormularioLogin } from "./formulario";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function PaginaLogin() {
  return (
    // El formulario lee ?error= de la URL, que solo existe en la petición.
    <Suspense>
      <FormularioLogin />
    </Suspense>
  );
}
