"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Target, Check, Calendar, MapPin, FileText, Info } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Tournament, STATUS_LABELS } from "@/lib/types";
import type { TournamentStatus } from "@/lib/types";
import { fmtDate } from "@/lib/data";

export const runtime = "edge";

const statusClass: Record<TournamentStatus, string> = {
  open: "bg-[rgba(34,197,94,0.12)] text-[#22c55e] border-[rgba(34,197,94,0.25)]",
  soon: "bg-[rgba(249,115,22,0.12)] text-[#f97316] border-[rgba(249,115,22,0.25)]",
  full: "bg-[rgba(255,255,255,0.06)] text-[#777] border-[rgba(255,255,255,0.08)]",
  closed: "bg-[rgba(248,113,113,0.1)] text-[#f87171] border-[rgba(248,113,113,0.25)]",
};

export default function TournoiDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tournoiId = params.id as string;
  const supabase = createClient();

  const [tournoi, setTournoi] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [inscriptionCount, setInscriptionCount] = useState(0);
  const [registerLoading, setRegisterLoading] = useState(false);

  useEffect(() => {
    async function load() {
      // Fetch tournament
      const { data, error } = await supabase
        .from("tournois")
        .select("*")
        .eq("id", tournoiId)
        .single();

      if (error || !data) {
        console.error("Tournoi fetch error:", error?.message, error?.details, error?.hint);
        setNotFound(true);
        setLoading(false);
        return;
      }
      setTournoi(data as Tournament);

      // Fetch inscription count
      const { data: countData } = await supabase
        .from("inscriptions")
        .select("id")
        .eq("tournoi_id", tournoiId);
      if (countData) setInscriptionCount(countData.length);

      // Check current user
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
        const { data: myReg } = await supabase
          .from("inscriptions")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("tournoi_id", tournoiId)
          .maybeSingle();
        if (myReg) setIsRegistered(true);
      }

      setLoading(false);
    }
    load();
  }, [tournoiId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleToggleRegister() {
    if (!currentUserId || !tournoi) return;
    setRegisterLoading(true);

    if (isRegistered) {
      const { error } = await supabase
        .from("inscriptions")
        .delete()
        .eq("user_id", currentUserId)
        .eq("tournoi_id", tournoiId);
      if (!error) {
        setIsRegistered(false);
        setInscriptionCount((c) => Math.max(c - 1, 0));
      }
    } else {
      const { error } = await supabase
        .from("inscriptions")
        .insert([{ user_id: currentUserId, tournoi_id: tournoiId }]);
      if (!error) {
        setIsRegistered(true);
        setInscriptionCount((c) => c + 1);
      }
    }
    setRegisterLoading(false);
  }

  if (loading) {
    return (
      <div className="animate-page-in min-h-screen pt-[80px] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[rgba(232,34,10,0.3)] border-t-[#e8220a] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !tournoi) {
    return (
      <div className="animate-page-in min-h-screen pt-[80px] px-4 sm:px-6 pb-12 flex flex-col items-center justify-center text-center">
        <Target className="w-12 h-12 text-[#777] mx-auto mb-4 opacity-40" />
        <div className="font-barlow-condensed font-black text-[1.6rem] uppercase mb-2">Tournoi introuvable</div>
        <div className="text-[0.88rem] text-[#777] mb-6">Ce tournoi n&apos;existe pas ou a été supprimé.</div>
        <button onClick={() => router.push("/tournois")} className="bg-[#e8220a] text-white border-none font-barlow-condensed font-bold text-[1rem] px-8 py-3 rounded-[10px] cursor-pointer transition-all shadow-red-glow-lg hover:bg-[#b81a08]">
          ← Voir les tournois
        </button>
      </div>
    );
  }

  const pct = tournoi.nb_joueurs > 0 ? Math.round((inscriptionCount / tournoi.nb_joueurs) * 100) : 0;
  const isFull = inscriptionCount >= tournoi.nb_joueurs && !isRegistered;

  return (
    <div className="animate-page-in min-h-screen pt-[72px] xs:pt-[80px] px-3 xs:px-4 sm:px-6 pb-10 sm:pb-12">
      <div className="max-w-[820px] xl:max-w-[960px] mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[0.82rem] text-[#777] mb-6 sm:mb-8">
          <Link href="/tournois" className="text-[#777] no-underline hover:text-white transition-colors">Tournois</Link>
          <span>/</span>
          <span className="text-white truncate">{tournoi.nom}</span>
        </div>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
            <span className={`inline-flex items-center text-[0.7rem] sm:text-[0.75rem] font-bold uppercase tracking-[1px] px-2 sm:px-3 py-[4px] sm:py-[5px] rounded-full border ${statusClass[tournoi.statut]}`}>
              {STATUS_LABELS[tournoi.statut]}
            </span>
            <span className="inline-flex items-center text-[0.7rem] sm:text-[0.75rem] font-bold uppercase tracking-[1px] px-2 sm:px-3 py-[4px] sm:py-[5px] rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-[#aaa]">
              {tournoi.format}
            </span>
            {isRegistered && (
              <span className="inline-flex items-center text-[0.7rem] sm:text-[0.75rem] font-bold uppercase tracking-[1px] px-2 sm:px-3 py-[4px] sm:py-[5px] rounded-full bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.25)] text-[#22c55e]">
                <Check className="w-3.5 h-3.5 inline -mt-[1px]" /> Inscrit
              </span>
            )}
          </div>
          <h1 className="font-barlow-condensed font-black text-[1.4rem] xs:text-[1.8rem] sm:text-[2.4rem] xl:text-[2.8rem] uppercase leading-[1.1] mb-2">
            {tournoi.nom}
          </h1>
        </div>

        {/* Registration card - shown first on mobile */}
        <div className="md:hidden mb-6">
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-4 xs:p-5 sm:p-6">
            <div className="font-barlow-condensed font-extrabold text-[1.1rem] uppercase mb-4">Inscription</div>

            {/* Player count */}
            <div className="mb-4">
              <div className="flex justify-between text-[0.82rem] mb-2">
                <span className="text-[#777]">Joueurs inscrits</span>
                <span className="text-white font-bold">{inscriptionCount}/{tournoi.nb_joueurs}</span>
              </div>
              <div className="h-[6px] bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#e8220a] transition-all duration-500"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="text-[0.75rem] text-[#777] mt-1 text-right">{Math.min(pct, 100)}% rempli</div>
            </div>

            {/* Format info */}
            <div className="flex flex-col gap-2 mb-4 pb-4 border-b border-[rgba(255,255,255,0.06)]">
              <div className="flex justify-between text-[0.82rem]">
                <span className="text-[#777]">Format</span>
                <span className="text-white font-medium">{tournoi.format}</span>
              </div>
              <div className="flex justify-between text-[0.82rem]">
                <span className="text-[#777]">Statut</span>
                <span className={`font-medium ${tournoi.statut === "open" ? "text-[#22c55e]" : tournoi.statut === "soon" ? "text-[#f97316]" : "text-[#777]"}`}>
                  {STATUS_LABELS[tournoi.statut]}
                </span>
              </div>
            </div>

            {/* Register button */}
            {currentUserId ? (
              <button
                onClick={handleToggleRegister}
                disabled={registerLoading || (isFull && !isRegistered) || tournoi.statut === "closed"}
                className={`w-full py-[13px] rounded-[10px] font-barlow-condensed font-bold text-[1.05rem] cursor-pointer border transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isRegistered
                    ? "bg-[rgba(248,113,113,0.1)] border-[rgba(248,113,113,0.25)] text-[#f87171] hover:bg-[rgba(248,113,113,0.2)]"
                    : "bg-[#e8220a] border-[#e8220a] text-white shadow-red-glow-lg hover:bg-[#b81a08]"
                }`}
              >
                {registerLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isRegistered ? (
                  "Se désinscrire"
                ) : isFull ? (
                  "Complet"
                ) : (
                  "S'inscrire au tournoi"
                )}
              </button>
            ) : (
              <Link
                href="/auth"
                className="w-full py-[13px] rounded-[10px] font-barlow-condensed font-bold text-[1.05rem] border-none bg-[#e8220a] text-white shadow-red-glow-lg hover:bg-[#b81a08] no-underline flex items-center justify-center gap-2 transition-all"
              >
                Se connecter pour s&apos;inscrire
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-5 sm:gap-6">
          {/* Left column - Info */}
          <div className="flex flex-col gap-5 sm:gap-6">

            {/* Date & Location */}
            <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-5 sm:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.25)] rounded-[8px] flex items-center justify-center shrink-0"><Calendar className="w-[18px] h-[18px] text-[#e8220a]" /></div>
                  <div>
                    <div className="text-[0.75rem] font-bold uppercase tracking-[1px] text-[#777] mb-1">Date et heure</div>
                    <div className="text-[0.95rem] text-white font-medium">{fmtDate(tournoi.date_tournoi)}</div>
                    {tournoi.heure && <div className="text-[0.85rem] text-[#aaa] mt-[2px]">{tournoi.heure}</div>}
                  </div>
                </div>

                <div className="h-px bg-[rgba(255,255,255,0.06)]" />

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.25)] rounded-[8px] flex items-center justify-center shrink-0"><MapPin className="w-[18px] h-[18px] text-[#e8220a]" /></div>
                  <div>
                    <div className="text-[0.75rem] font-bold uppercase tracking-[1px] text-[#777] mb-1">Lieu</div>
                    <div className="text-[0.95rem] text-white font-medium">{tournoi.ville}, {tournoi.region}</div>
                    {tournoi.adresse && <div className="text-[0.85rem] text-[#aaa] mt-[2px]">{tournoi.adresse}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {tournoi.description && (
              <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.25)] rounded-[8px] flex items-center justify-center shrink-0"><FileText className="w-[18px] h-[18px] text-[#e8220a]" /></div>
                  <div className="text-[0.75rem] font-bold uppercase tracking-[1px] text-[#777]">Description</div>
                </div>
                <div className="text-[0.9rem] text-[#ccc] leading-[1.7] whitespace-pre-line">{tournoi.description}</div>
              </div>
            )}

            {/* Infos pratiques */}
            {tournoi.infos_pratiques && (
              <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.25)] rounded-[8px] flex items-center justify-center shrink-0"><Info className="w-[18px] h-[18px] text-[#e8220a]" /></div>
                  <div className="text-[0.75rem] font-bold uppercase tracking-[1px] text-[#777]">Informations pratiques</div>
                </div>
                <div className="text-[0.9rem] text-[#ccc] leading-[1.7] whitespace-pre-line">{tournoi.infos_pratiques}</div>
              </div>
            )}
          </div>

          {/* Right column - Registration card (desktop only) */}
          <div className="hidden md:block">
            <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-6 sticky top-[80px]">
              <div className="font-barlow-condensed font-extrabold text-[1.1rem] uppercase mb-5">Inscription</div>

              {/* Player count */}
              <div className="mb-5">
                <div className="flex justify-between text-[0.82rem] mb-2">
                  <span className="text-[#777]">Joueurs inscrits</span>
                  <span className="text-white font-bold">{inscriptionCount}/{tournoi.nb_joueurs}</span>
                </div>
                <div className="h-[6px] bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#e8220a] transition-all duration-500"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="text-[0.75rem] text-[#777] mt-1 text-right">{Math.min(pct, 100)}% rempli</div>
              </div>

              {/* Format info */}
              <div className="flex flex-col gap-2 mb-5 pb-5 border-b border-[rgba(255,255,255,0.06)]">
                <div className="flex justify-between text-[0.82rem]">
                  <span className="text-[#777]">Format</span>
                  <span className="text-white font-medium">{tournoi.format}</span>
                </div>
                <div className="flex justify-between text-[0.82rem]">
                  <span className="text-[#777]">Statut</span>
                  <span className={`font-medium ${tournoi.statut === "open" ? "text-[#22c55e]" : tournoi.statut === "soon" ? "text-[#f97316]" : "text-[#777]"}`}>
                    {STATUS_LABELS[tournoi.statut]}
                  </span>
                </div>
              </div>

              {/* Register button */}
              {currentUserId ? (
                <button
                  onClick={handleToggleRegister}
                  disabled={registerLoading || (isFull && !isRegistered) || tournoi.statut === "closed"}
                  className={`w-full py-[13px] rounded-[10px] font-barlow-condensed font-bold text-[1.05rem] cursor-pointer border transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isRegistered
                      ? "bg-[rgba(248,113,113,0.1)] border-[rgba(248,113,113,0.25)] text-[#f87171] hover:bg-[rgba(248,113,113,0.2)]"
                      : "bg-[#e8220a] border-[#e8220a] text-white shadow-red-glow-lg hover:bg-[#b81a08]"
                  }`}
                >
                  {registerLoading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isRegistered ? (
                    "Se désinscrire"
                  ) : isFull ? (
                    "Complet"
                  ) : (
                    "S'inscrire au tournoi"
                  )}
                </button>
              ) : (
                <Link
                  href="/auth"
                  className="w-full py-[13px] rounded-[10px] font-barlow-condensed font-bold text-[1.05rem] border-none bg-[#e8220a] text-white shadow-red-glow-lg hover:bg-[#b81a08] no-underline flex items-center justify-center gap-2 transition-all"
                >
                  Se connecter pour s&apos;inscrire
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-8 sm:mt-10">
          <Link href="/tournois" className="text-[0.85rem] text-[#777] no-underline hover:text-white transition-colors flex items-center gap-1">
            ← Retour aux tournois
          </Link>
        </div>
      </div>
    </div>
  );
}
