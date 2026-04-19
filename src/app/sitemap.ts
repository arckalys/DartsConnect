import type { MetadataRoute } from "next";
import { createClient as createSbClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase";

export const runtime = "edge";

const SITE_URL = "https://dartstournois.fr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/tournois`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/a-propos`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = createSbClient(supabaseUrl, supabaseAnonKey);
    const { data } = await supabase
      .from("tournois")
      .select("id, created_at, date_tournoi")
      .order("date_tournoi", { ascending: false })
      .limit(5000);

    if (data) {
      dynamicRoutes = data.map((t: { id: string; created_at?: string; date_tournoi?: string }) => ({
        url: `${SITE_URL}/tournois/${t.id}`,
        lastModified: t.created_at ? new Date(t.created_at) : now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
    }
  } catch {
    // If Supabase is unreachable at build time, still ship the static sitemap
  }

  return [...staticRoutes, ...dynamicRoutes];
}
