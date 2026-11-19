import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({ variable: "--font-sora", subsets: ["latin"], display: "swap" });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Diarco", template: "%s · Diarco" },
  description: "Bitácora diaria, horario semanal y hábitos con rachas.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121114" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${sora.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-fondo font-sans text-texto">{children}</body>
    </html>
  );
}
