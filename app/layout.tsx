import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UpFlow - Gestion des demandes de fonctionnalités",
  description: "Collectez et gérez les demandes de fonctionnalités avec le vote de la communauté",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
