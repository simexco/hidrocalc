import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HidroCalc — Sigma Flow · Calculadora Hidráulica Profesional",
  description: "Herramienta técnica para ingenieros en infraestructura hidráulica — Sigma Flow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#F1F5F9] antialiased">
        {children}
      </body>
    </html>
  );
}
