import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez l'équipe DartsTournois pour toute question, suggestion ou demande d'aide concernant les tournois de fléchettes.",
  alternates: { canonical: "https://dartstournois.fr/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
