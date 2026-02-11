import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "./components/QueryProvider";

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
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
