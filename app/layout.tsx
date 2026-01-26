import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

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
      <body className={outfit.variable}>{children}</body>
    </html>
  );
}
