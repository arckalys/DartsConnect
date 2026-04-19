import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité du site DartsTournois.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://dartstournois.fr/confidentialite" },
};

export default function ConfidentialiteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
