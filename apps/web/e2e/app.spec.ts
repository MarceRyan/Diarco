/**
 * Recorrido con sesión: entra, visita cada sección y guarda una captura.
 * Necesita E2E_EMAIL y E2E_PASSWORD; si faltan, estas pruebas se omiten.
 * Las que cambian datos solo corren con E2E_MUTAR=1 (CI con el usuario demo).
 */
import { expect, test, type Page } from "@playwright/test";

const correo = process.env.E2E_EMAIL;
const clave = process.env.E2E_PASSWORD;
const puedeMutar = process.env.E2E_MUTAR === "1";

test.skip(!correo || !clave, "Define E2E_EMAIL y E2E_PASSWORD para las pruebas con sesión");

async function entrar(page: Page) {
  // La guía de bienvenida se marca como vista para que no tape las pantallas.
  await page.addInitScript(() => {
    for (const id of ["d3b07384-d9a0-4c9e-8f1a-000000000001"]) localStorage.setItem(`diarco-guia-vista-${id}`, "si");
  });
  await page.goto("/login");
  await page.getByLabel("Correo").fill(correo!);
  await page.getByLabel("Contraseña").fill(clave!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/hoy$/);
}

const SECCIONES = [
  { ruta: "/hoy", titulo: /¡Hola/ },
  { ruta: "/habitos", titulo: "Tus hábitos" },
  { ruta: "/horario", titulo: "Tu semana" },
  { ruta: "/bitacora", titulo: "Tu bitácora" },
  { ruta: "/pendientes", titulo: "Pendientes" },
  { ruta: "/chispa", titulo: "Mi Chispa" },
  { ruta: "/estadisticas", titulo: "Tu progreso" },
  { ruta: "/logros", titulo: "Tus logros" },
  { ruta: "/configuracion", titulo: "Ajustes" },
];

test("recorre todas las secciones y guarda capturas", async ({ page }, info) => {
  await entrar(page);
  for (const s of SECCIONES) {
    await page.goto(s.ruta);
    await expect(page.getByRole("heading", { level: 1, name: s.titulo })).toBeVisible();
    // Espera a que desaparezcan los esqueletos de carga antes de capturar.
    await expect(page.locator(".animate-pulse")).toHaveCount(0, { timeout: 15_000 });
    await page.screenshot({
      path: info.outputPath(`${s.ruta.slice(1)}.png`),
      fullPage: true,
      animations: "disabled",
    });
  }
});

test("el horario cambia entre semana y día y navega entre semanas", async ({ page }) => {
  await entrar(page);
  await page.goto("/horario");
  await page.getByRole("button", { name: "Semana", exact: true }).click();
  await expect(page.getByRole("region", { name: "Horario de la semana" })).toBeVisible();
  await page.getByRole("button", { name: "Semana anterior" }).click();
  await expect(page.getByRole("button", { name: "Esta semana" })).toBeVisible();
  await page.getByRole("button", { name: "Día", exact: true }).click();
  await expect(page.getByRole("group", { name: "Día de la semana" })).toBeVisible();
});

test("marcar y desmarcar un hábito de hoy", async ({ page }) => {
  test.skip(!puedeMutar, "Solo con E2E_MUTAR=1: cambia datos");
  await entrar(page);
  // Filas de hábito: botones con aria-pressed (el localizador no cambia al alternar su estado).
  const filas = page.getByRole("region", { name: "Tus hábitos de hoy" }).locator("button[aria-pressed]");
  test.skip((await filas.count()) === 0, "Hoy no hay hábitos programados");
  const fila = filas.first();
  const inicial = await fila.getAttribute("aria-pressed");
  const otro = inicial === "true" ? "false" : "true";
  page.on("dialog", (d) => d.accept()); // desmarcar con nota pide confirmación
  await fila.click();
  await expect(fila).toHaveAttribute("aria-pressed", otro);
  await page.keyboard.press("Escape"); // cierra la celebración si apareció
  await fila.click();
  await expect(fila).toHaveAttribute("aria-pressed", inicial!);
});
