import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ServiceWorker from "@/components/ServiceWorker";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "DartsTournois — Tournois de fléchettes en France",
  description: "Trouvez, créez et inscrivez-vous aux tournois de fléchettes partout en France.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#e8220a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DartsTournois" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-barlow bg-[#0a0a0a] text-white min-h-screen overflow-x-hidden">
        <ServiceWorker />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
