import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ViraUpp",
  description: "Copiloto de crescimento para vídeos curtos",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
