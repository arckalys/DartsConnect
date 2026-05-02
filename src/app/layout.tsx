import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ServiceWorker from "@/components/ServiceWorker";
import CookieBanner from "@/components/CookieBanner";

export const runtime = "edge";

const SITE_URL = "https://dartstournois.fr";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DartsTournois - Trouvez votre prochain tournoi de fléchettes",
    template: "%s | DartsTournois",
  },
  description:
    "La plateforme qui regroupe tous les tournois de fléchettes en France. Cherchez, trouvez et inscrivez-vous en quelques clics.",
  keywords: [
    "tournoi fléchettes",
    "darts France",
    "compétition fléchettes",
    "inscription tournoi darts",
    "tournoi darts France",
    "fléchettes compétition",
    "championnat fléchettes",
    "organiser tournoi fléchettes",
  ],
  authors: [{ name: "DartsTournois" }],
  creator: "DartsTournois",
  publisher: "DartsTournois",
  applicationName: "DartsTournois",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "DartsTournois",
    title: "DartsTournois - Tous les tournois de fléchettes en France",
    description:
      "Trouvez et inscrivez-vous aux tournois de fléchettes près de chez vous. Tournois officiels et non officiels dans toute la France.",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "DartsTournois",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DartsTournois - Tous les tournois de fléchettes en France",
    description:
      "Trouvez et inscrivez-vous aux tournois de fléchettes près de chez vous.",
    images: ["/icons/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192.png",
  },
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
        <meta name="theme-color" content="#b91c0a" />
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
        <CookieBanner />
      </body>
    </html>
  );
}
