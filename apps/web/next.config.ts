import type { NextConfig } from "next";

const esDesarrollo = process.env.NODE_ENV !== "production";

/** Origen de Supabase (el único servidor externo al que habla la app). */
function origenSupabase(): string[] {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    const ws = url.protocol === "https:" ? `wss://${url.host}` : `ws://${url.host}`;
    return [url.origin, ws];
  } catch {
    return [];
  }
}

/**
 * Política de seguridad de contenido: la página solo carga código, estilos e
 * imágenes propios y solo se conecta a sí misma y a Supabase. 'unsafe-inline'
 * en scripts lo necesitan los scripts de arranque de Next y el del tema.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${esDesarrollo ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${origenSupabase().join(" ")}${esDesarrollo ? " ws: wss:" : ""}`,
  "media-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'", // nadie puede meter Diarco dentro de otra página (clickjacking)
  ...(esDesarrollo ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const cabecerasDeSeguridad = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // La app no usa cámara, micrófono, ubicación ni pagos.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // @diarco/shared se publica como código TypeScript fuente; Next lo compila.
  transpilePackages: ["@diarco/shared"],
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: cabecerasDeSeguridad },
      // El service worker siempre se revisa al abrir la app (así llegan las actualizaciones).
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
    ];
  },
};

export default nextConfig;
