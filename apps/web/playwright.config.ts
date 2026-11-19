/**
 * Pruebas de punta a punta de Diarco.
 *
 * Variables:
 *  - E2E_URL: dirección de la app (por defecto http://localhost:3000).
 *  - E2E_EMAIL / E2E_PASSWORD: usuario para las pruebas con sesión (si faltan, se omiten).
 *  - E2E_MUTAR=1: permite pruebas que cambian datos (marcar hábitos). Solo en CI con el usuario demo.
 *
 * En CI se usa el Chromium de Playwright y se levanta `next start`; en local se usa
 * el Edge instalado y se reutiliza el servidor que ya esté corriendo (pnpm dev:web).
 */
import { defineConfig, devices } from "@playwright/test";

const enCI = Boolean(process.env.CI);
const url = process.env.E2E_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: false,
  retries: enCI ? 1 : 0,
  reporter: enCI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: url,
    locale: "es-PE",
    timezoneId: "America/Lima",
    trace: "retain-on-failure",
    channel: enCI ? undefined : "msedge",
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "movil", use: { ...devices["Pixel 7"] } },
  ],
  webServer: enCI
    ? { command: "pnpm start", url, reuseExistingServer: false, timeout: 120_000 }
    : undefined,
});
