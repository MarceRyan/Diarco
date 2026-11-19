import type { Metadata } from "next";
import { FormularioNuevaContrasena } from "./formulario";

export const metadata: Metadata = { title: "Nueva contraseña" };

/** Se llega desde el enlace del correo de recuperación (ya con la sesión iniciada por /auth/confirm). */
export default function PaginaNuevaContrasena() {
  return <FormularioNuevaContrasena />;
}
