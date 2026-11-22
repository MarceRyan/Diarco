import type { MetadataRoute } from "next";

/** Nombre e ícono de Diarco al agregarla a la pantalla de inicio del celular. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Diarco",
    short_name: "Diarco",
    description: "Tus hábitos, tu horario y tu día, con rachas que se celebran.",
    start_url: "/hoy",
    display: "standalone",
    background_color: "#f6f4fd",
    theme_color: "#ff6a2b",
    lang: "es",
    icons: [
      { src: "/chispa-192.png", sizes: "192x192", type: "image/png" },
      { src: "/chispa-512.png", sizes: "512x512", type: "image/png" },
      { src: "/chispa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
