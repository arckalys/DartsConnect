import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos - La plateforme des fléchettes en France",
  description:
    "DartsTournois est la plateforme qui regroupe tous les tournois de fléchettes en France. Découvrez notre mission et nos valeurs.",
  alternates: { canonical: "https://dartstournois.fr/a-propos" },
};

export default function AProposLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
