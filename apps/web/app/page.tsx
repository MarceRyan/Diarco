import { redirect } from "next/navigation";

/** La raíz lleva a Hoy; proxy.ts redirige a /login si no hay sesión. */
export default function Inicio() {
  redirect("/hoy");
}
