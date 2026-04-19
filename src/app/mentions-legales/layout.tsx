import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site DartsTournois.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://dartstournois.fr/mentions-legales" },
};

export default function MentionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
