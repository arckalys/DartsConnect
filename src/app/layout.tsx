import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "DartsConnect.FR — Tournois de fléchettes en France",
  description: "Tous les tournois de fléchettes en France réunis sur une seule plateforme.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-barlow bg-[#0a0a0a] text-white min-h-screen overflow-x-hidden">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
