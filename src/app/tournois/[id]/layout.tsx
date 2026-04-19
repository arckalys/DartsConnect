import type { Metadata } from "next";
import { createClient as createSbClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase";

export const runtime = "edge";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

type TournoiRow = {
  id: string;
  nom: string | null;
  ville: string | null;
  adresse: string | null;
  date_tournoi: string | null;
  format: string | null;
  description: string | null;
  nb_joueurs: number | null;
};

async function getTournoi(id: string): Promise<TournoiRow | null> {
  try {
    const supabase = createSbClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from("tournois")
      .select("id, nom, ville, adresse, date_tournoi, format, description, nb_joueurs")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as TournoiRow;
  } catch {
    return null;
  }
}

function formatDateFr(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const t = await getTournoi(id);

  if (!t) {
    return {
      title: "Tournoi introuvable",
      robots: { index: false, follow: false },
    };
  }

  const nom = t.nom || "Tournoi de fléchettes";
  const ville = t.ville || "France";
  const dateStr = formatDateFr(t.date_tournoi);
  const format = t.format || "";
  const places = t.nb_joueurs ? `${t.nb_joueurs} places disponibles. ` : "";

  const title = `${nom} - ${ville}`;
  const description = `Tournoi de fléchettes à ${ville}${dateStr ? ` le ${dateStr}` : ""}.${format ? ` Format ${format}.` : ""} ${places}Inscrivez-vous sur DartsTournois.`;
  const url = `https://dartstournois.fr/tournois/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: `${title} | DartsTournois`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | DartsTournois`,
      description,
    },
  };
}

export default async function TournoiLayout({ params, children }: Props) {
  const { id } = await params;
  const t = await getTournoi(id);

  const jsonLd = t
    ? {
        "@context": "https://schema.org",
        "@type": "Event",
        name: t.nom || "Tournoi de fléchettes",
        startDate: t.date_tournoi || undefined,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: t.adresse || t.ville || "France",
          address: {
            "@type": "PostalAddress",
            addressLocality: t.ville || undefined,
            streetAddress: t.adresse || undefined,
            addressCountry: "FR",
          },
        },
        description:
          t.description ||
          `Tournoi de fléchettes à ${t.ville || "France"}${t.date_tournoi ? ` le ${formatDateFr(t.date_tournoi)}` : ""}.`,
        organizer: {
          "@type": "Organization",
          name: "DartsTournois",
          url: "https://dartstournois.fr",
        },
        url: `https://dartstournois.fr/tournois/${id}`,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
