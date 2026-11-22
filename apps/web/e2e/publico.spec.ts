/** Pantallas públicas y protección de rutas: no necesitan cuenta. */
import { expect, test } from "@playwright/test";

test("el login muestra el formulario y el enlace para recuperar la contraseña", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "¡Qué bueno verte!" })).toBeVisible();
  await expect(page.getByLabel("Correo")).toBeVisible();
  await expect(page.getByLabel("Contraseña")).toBeVisible();
  await expect(page.getByRole("link", { name: "¿Olvidaste tu contraseña?" })).toBeVisible();
});

test("el registro pide nombre, correo y contraseña y valida en español", async ({ page }) => {
  await page.goto("/registro");
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(page.getByText("Escribe tu nombre")).toBeVisible();
  await expect(page.getByText("Correo inválido")).toBeVisible();
  await expect(page.getByText("Mínimo 8 caracteres").first()).toBeVisible();
});

test("recuperar contraseña valida el correo", async ({ page }) => {
  await page.goto("/recuperar");
  await expect(page.getByRole("heading", { name: "¿Olvidaste tu contraseña?" })).toBeVisible();
  await page.getByLabel("Correo").fill("esto-no-es-un-correo");
  await page.getByRole("button", { name: "Enviarme el enlace" }).click();
  await expect(page.getByText("Escribe un correo válido")).toBeVisible();
});

for (const ruta of ["/hoy", "/habitos", "/horario", "/bitacora", "/pendientes", "/chispa", "/estadisticas", "/logros", "/configuracion", "/nueva-contrasena"]) {
  test(`sin sesión, ${ruta} lleva al login`, async ({ page }) => {
    await page.goto(ruta);
    await expect(page).toHaveURL(/\/login$/);
  });
}
