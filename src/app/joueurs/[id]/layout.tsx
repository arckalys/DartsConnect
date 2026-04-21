import type { Metadata } from "next";
import { createClient as createSbClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase";

export const runtime = "edge";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

async function getProfile(id: string) {
  try {
    const supabase = createSbClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from("profiles")
      .select("pseudo, prenom, nom, region, bio")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as { pseudo: string | null; prenom: string | null; nom: string | null; region: string | null; bio: string | null };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getProfile(id);

  if (!p) {
    return {
      title: "Joueur introuvable",
      robots: { index: false, follow: false },
    };
  }

  const displayName = p.pseudo || [p.prenom, p.nom].filter(Boolean).join(" ") || "Joueur";
  const title = `${displayName} - Profil joueur`;
  const description = p.bio
    ? p.bio.substring(0, 155)
    : `Profil de ${displayName}${p.region ? ` (${p.region})` : ""} sur DartsTournois. Tournois joués et organisés.`;
  const url = `https://dartstournois.fr/joueurs/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      url,
      title: `${displayName} | DartsTournois`,
      description,
    },
  };
}

export default function JoueurLayout({ children }: Props) {
  return <>{children}</>;
}
