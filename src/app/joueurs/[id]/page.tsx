"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Trophy, Users, Star, User as UserIcon, Target } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { fmtDate } from "@/lib/data";

export const runtime = "edge";

interface PublicProfile {
  id: string;
  pseudo: string | null;
  prenom: string | null;
  nom: string | null;
  bio: string | null;
  region: string | null;
  niveau: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

interface TournoiLite {
  id: string;
  nom: string;
  ville: string;
  date_tournoi: string;
  format: string;
}

function deriveNiveau(niveauExplicit: string | null): string {
  return niveauExplicit?.trim() || "";
}

const niveauClass: Record<string, string> = {
  Débutant: "bg-[rgba(156,163,175,0.15)] border-[rgba(156,163,175,0.3)] text-[#9ca3af]",
  Intermédiaire: "bg-[rgba(59,130,246,0.15)] border-[rgba(59,130,246,0.3)] text-[#3b82f6]",
  Confirmé: "bg-[rgba(168,85,247,0.15)] border-[rgba(168,85,247,0.3)] text-[#a855f7]",
  Expert: "bg-[rgba(232,34,10,0.15)] border-[rgba(232,34,10,0.3)] text-[#e8220a]",
};

export default function JoueurPage() {
  const params = useParams();
  const userId = params.id as string;
  const supabase = createClient();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [tournoisJoues, setTournoisJoues] = useState<TournoiLite[]>([]);
  const [tournoisOrganises, setTournoisOrganises] = useState<TournoiLite[]>([]);
  const [avgOrganizerRating, setAvgOrganizerRating] = useState<{ avg: number; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      // Fetch public profile (no email column)
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("id, pseudo, prenom, nom, bio, region, niveau, avatar_url, created_at")
        .eq("id", userId)
        .maybeSingle();

      if (profileErr || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(profileData as PublicProfile);

      // Fetch tournaments played (via inscriptions)
      const { data: inscriptions } = await supabase
        .from("inscriptions")
        .select("tournoi_id")
        .eq("user_id", userId);

      const playedIds = (inscriptions || []).map((i: { tournoi_id: string }) => i.tournoi_id);
      if (playedIds.length > 0) {
        const { data: playedT } = await supabase
          .from("tournois")
          .select("id, nom, ville, date_tournoi, format")
          .in("id", playedIds)
          .order("date_tournoi", { ascending: false });
        if (playedT) setTournoisJoues(playedT as TournoiLite[]);
      }

      // Fetch tournaments organized
      const { data: organizedT } = await supabase
        .from("tournois")
        .select("id, nom, ville, date_tournoi, format")
        .eq("user_id", userId)
        .order("date_tournoi", { ascending: false });
      if (organizedT) setTournoisOrganises(organizedT as TournoiLite[]);

      // Fetch average organizer rating (avis on his tournaments)
      if (organizedT && organizedT.length > 0) {
        const organizedIds = organizedT.map((t: { id: string }) => t.id);
        const { data: avisRows } = await supabase
          .from("avis")
          .select("note")
          .in("tournoi_id", organizedIds);
        if (avisRows && avisRows.length > 0) {
          const sum = avisRows.reduce((s: number, a: { note: number }) => s + a.note, 0);
          setAvgOrganizerRating({
            avg: Math.round((sum / avisRows.length) * 10) / 10,
            count: avisRows.length,
          });
        }
      }

      setLoading(false);
    }
    load();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="animate-page-in min-h-screen pt-[80px] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[rgba(232,34,10,0.3)] border-t-[#e8220a] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="animate-page-in min-h-screen pt-[80px] px-4 sm:px-6 pb-12 flex flex-col items-center justify-center text-center">
        <UserIcon className="w-12 h-12 text-[#777] mx-auto mb-4 opacity-40" />
        <div className="font-barlow-condensed font-black text-[1.6rem] uppercase mb-2">Joueur introuvable</div>
        <div className="text-[0.88rem] text-[#777] mb-6">Ce profil n&apos;existe pas.</div>
        <Link href="/tournois" className="bg-[#e8220a] text-white no-underline font-barlow-condensed font-bold text-[1rem] px-8 py-3 rounded-[10px] transition-all shadow-red-glow-lg hover:bg-[#b81a08]">
          ← Voir les tournois
        </Link>
      </div>
    );
  }

  const displayName = profile.pseudo || [profile.prenom, profile.nom].filter(Boolean).join(" ") || "Joueur";
  const fullName = [profile.prenom, profile.nom].filter(Boolean).join(" ");
  const initials = ((profile.prenom?.charAt(0) || "") + (profile.nom?.charAt(0) || "")).toUpperCase()
    || (profile.pseudo?.substring(0, 2) || "??").toUpperCase();
  const niveau = deriveNiveau(profile.niveau);
  const joinedDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : "";

  return (
    <div className="animate-page-in min-h-screen pt-[72px] xs:pt-[80px] px-3 xs:px-4 sm:px-6 pb-10 sm:pb-12">
      <div className="max-w-[820px] xl:max-w-[960px] mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[0.82rem] text-[#777] mb-6 sm:mb-8">
          <Link href="/" className="text-[#777] no-underline hover:text-white transition-colors">Accueil</Link>
          <span>/</span>
          <span className="text-white truncate">{displayName}</span>
        </div>

        {/* Profile header card */}
        <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-5 sm:p-7 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar */}
            <div className="shrink-0">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={displayName}
                  width={96}
                  height={96}
                  className="w-[80px] h-[80px] sm:w-[96px] sm:h-[96px] rounded-full object-cover border-2 border-[rgba(232,34,10,0.3)]"
                  unoptimized
                />
              ) : (
                <div className="w-[80px] h-[80px] sm:w-[96px] sm:h-[96px] rounded-full bg-[rgba(232,34,10,0.15)] border-2 border-[rgba(232,34,10,0.3)] flex items-center justify-center">
                  <span className="font-barlow-condensed font-black text-[2rem] sm:text-[2.4rem] text-[#e8220a]">
                    {initials}
                  </span>
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="font-barlow-condensed font-black text-[1.6rem] sm:text-[2rem] uppercase leading-[1.1] break-words">
                  {displayName}
                </h1>
                {niveau && (
                  <span className={`inline-flex items-center text-[0.7rem] font-bold uppercase tracking-[1px] px-3 py-[4px] rounded-full border ${niveauClass[niveau] || niveauClass.Débutant}`}>
                    {niveau}
                  </span>
                )}
              </div>

              {fullName && profile.pseudo && (
                <div className="text-[0.88rem] text-[#999] mb-2">{fullName}</div>
              )}


              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.85rem] text-[#777] mb-3">
                {profile.region && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-[14px] h-[14px]" />
                    {profile.region}
                  </div>
                )}
                {joinedDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-[14px] h-[14px]" />
                    Membre depuis {joinedDate}
                  </div>
                )}
              </div>

              {profile.bio && (
                <p className="text-[0.9rem] text-[#ccc] leading-[1.7] whitespace-pre-line mt-2">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
          <StatCard
            icon={<Trophy className="w-[18px] h-[18px] text-[#e8220a]" />}
            label="Tournois joués"
            value={tournoisJoues.length}
            tint="red"
          />
          <StatCard
            icon={<Users className="w-[18px] h-[18px] text-[#3b82f6]" />}
            label="Tournois organisés"
            value={tournoisOrganises.length}
            tint="blue"
          />
          <StatCard
            icon={<Star className="w-[18px] h-[18px] text-[#f59e0b]" />}
            label="Note organisateur"
            value={avgOrganizerRating ? `${avgOrganizerRating.avg}/5` : "—"}
            sublabel={avgOrganizerRating ? `${avgOrganizerRating.count} avis` : "Aucun avis"}
            tint="amber"
          />
          <StatCard
            icon={<MapPin className="w-[18px] h-[18px] text-[#22c55e]" />}
            label="Région"
            value={profile.region || "—"}
            tint="green"
          />
        </div>

        {/* Tournaments played */}
        {tournoisJoues.length > 0 && (
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-5 sm:p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.25)] rounded-[8px] flex items-center justify-center shrink-0">
                <Trophy className="w-[18px] h-[18px] text-[#e8220a]" />
              </div>
              <div className="text-[0.75rem] font-bold uppercase tracking-[1px] text-[#777]">
                Tournois joués ({tournoisJoues.length})
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {tournoisJoues.map((t) => (
                <TournoiListItem key={t.id} t={t} />
              ))}
            </div>
          </div>
        )}

        {/* Tournaments organized */}
        {tournoisOrganises.length > 0 && (
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-5 sm:p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-[rgba(59,130,246,0.12)] border border-[rgba(59,130,246,0.25)] rounded-[8px] flex items-center justify-center shrink-0">
                <Users className="w-[18px] h-[18px] text-[#3b82f6]" />
              </div>
              <div className="text-[0.75rem] font-bold uppercase tracking-[1px] text-[#777]">
                Tournois organisés ({tournoisOrganises.length})
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {tournoisOrganises.map((t) => (
                <TournoiListItem key={t.id} t={t} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {tournoisJoues.length === 0 && tournoisOrganises.length === 0 && (
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-8 text-center">
            <Target className="w-10 h-10 text-[#777] mx-auto mb-3 opacity-40" />
            <div className="text-[0.9rem] text-[#777]">
              Ce joueur n&apos;a pas encore participé ni organisé de tournoi.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sublabel,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  tint: "red" | "blue" | "amber" | "green";
}) {
  const bgMap = {
    red: "bg-[rgba(232,34,10,0.08)] border-[rgba(232,34,10,0.2)]",
    blue: "bg-[rgba(59,130,246,0.08)] border-[rgba(59,130,246,0.2)]",
    amber: "bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.2)]",
    green: "bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.2)]",
  };
  return (
    <div className={`border rounded-[12px] p-4 sm:p-5 ${bgMap[tint]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <div className="text-[0.72rem] sm:text-[0.75rem] font-bold uppercase tracking-[1px] text-[#999]">
          {label}
        </div>
      </div>
      <div className="font-barlow-condensed font-black text-[1.6rem] sm:text-[2rem] text-white leading-none">
        {value}
      </div>
      {sublabel && (
        <div className="text-[0.72rem] text-[#777] mt-1">{sublabel}</div>
      )}
    </div>
  );
}

function TournoiListItem({ t }: { t: TournoiLite }) {
  return (
    <Link
      href={`/tournois/${t.id}`}
      className="no-underline block bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] rounded-[10px] p-3 sm:p-4 transition-all hover:border-[rgba(232,34,10,0.3)] hover:bg-[rgba(232,34,10,0.03)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-barlow-condensed font-extrabold text-[1rem] text-white truncate">
            {t.nom}
          </div>
          <div className="flex items-center gap-3 text-[0.78rem] text-[#777] mt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-[12px] h-[12px]" />
              {fmtDate(t.date_tournoi)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-[12px] h-[12px]" />
              {t.ville}
            </span>
            <span className="inline-block text-[0.65rem] font-bold uppercase tracking-[1px] px-[8px] py-[2px] rounded-full bg-[rgba(255,255,255,0.06)] text-[#aaa]">
              {t.format}
            </span>
          </div>
        </div>
        <span className="text-[#e8220a] text-[0.82rem] font-bold shrink-0">Voir →</span>
      </div>
    </Link>
  );
}
