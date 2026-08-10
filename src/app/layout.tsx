import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sigma Flow · Plataforma de Ingeniería Hidráulica",
  description: "Plataforma de Ingeniería Hidráulica de Sigma Flow: diseño de líneas de conducción, bombeo, cruceros y reportes para agua potable.",
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
