import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import Script from "next/script";
import { SCRIPT_TEMA } from "@/lib/tema";
import "./globals.css";

// Letras redondas y amigables; next/font las descarga en el build y las sirve desde la app.
const baloo = Baloo_2({ variable: "--font-baloo", subsets: ["latin"], weight: ["600", "700", "800"], display: "swap" });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: ["500", "600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Diarco", template: "%s · Diarco" },
  applicationName: "Diarco",
  appleWebApp: { title: "Diarco", capable: true, statusBarStyle: "default" },
  description: "Tus hábitos, tu horario y tu día, con rachas que se celebran.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4fd" },
    { media: "(prefers-color-scheme: dark)", color: "#15121d" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: el script del tema añade data-tema antes de hidratar,
    // y algunas extensiones del navegador agregan atributos al <body>.
    <html lang="es" className={`${baloo.variable} ${nunito.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-fondo font-sans font-medium text-texto" suppressHydrationWarning>
        {/* Aplica el tema guardado antes de pintar, para evitar un destello del tema equivocado. */}
        <Script id="tema" strategy="beforeInteractive">
          {SCRIPT_TEMA}
        </Script>
        {children}
      </body>
    </html>
  );
}
