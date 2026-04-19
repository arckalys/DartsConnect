import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tous les tournois de fléchettes en France",
  description:
    "Parcourez tous les tournois de fléchettes disponibles en France. Filtrez par région, date et format.",
  alternates: { canonical: "https://dartstournois.fr/tournois" },
  openGraph: {
    title: "Tous les tournois de fléchettes en France - DartsTournois",
    description:
      "Parcourez tous les tournois de fléchettes disponibles en France. Filtrez par région, date et format.",
    url: "https://dartstournois.fr/tournois",
  },
};

export default function TournoisLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
