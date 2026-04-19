"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Target, Check, Calendar, MapPin, FileText, Info, LayoutDashboard, Star } from "lucide-react";
import StarRating from "@/components/StarRating";
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
  const [isOwner, setIsOwner] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [inscriptionCount, setInscriptionCount] = useState(0);
  const [registerLoading, setRegisterLoading] = useState(false);

  // Rating state
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [allReviews, setAllReviews] = useState<Array<{ id: string; note: number; commentaire: string | null; created_at: string; pseudo: string }>>([]);

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

      // Fetch ratings + comments
      const { data: avisData } = await supabase
        .from("avis")
        .select("id, user_id, note, commentaire, created_at")
        .eq("tournoi_id", tournoiId)
        .order("created_at", { ascending: false });
      if (avisData && avisData.length > 0) {
        const avg = avisData.reduce((s: number, a: { note: number }) => s + a.note, 0) / avisData.length;
        setAvgRating(Math.round(avg * 10) / 10);
        setRatingCount(avisData.length);

        // Fetch pseudos for reviewers
        const reviewerIds = avisData.map((a: { user_id: string }) => a.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, pseudo, prenom")
          .in("id", reviewerIds);
        const pseudoMap: Record<string, string> = {};
        (profiles || []).forEach((p: { id: string; pseudo: string | null; prenom: string | null }) => {
          pseudoMap[p.id] = p.pseudo || p.prenom || "Joueur anonyme";
        });
        setAllReviews(
          avisData.map((a: { id: string; user_id: string; note: number; commentaire: string | null; created_at: string }) => ({
            id: a.id,
            note: a.note,
            commentaire: a.commentaire,
            created_at: a.created_at,
            pseudo: pseudoMap[a.user_id] || "Joueur anonyme",
          }))
        );
      }

      // Check current user
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const uid = session.user.id;
        setCurrentUserId(uid);
        if (data.user_id === uid) setIsOwner(true);

        const { data: myReg } = await supabase
          .from("inscriptions")
          .select("id")
          .eq("user_id", uid)
          .eq("tournoi_id", tournoiId)
          .maybeSingle();
        if (myReg) setIsRegistered(true);

        // Check if user can rate (inscribed + tournament date is past)
        const isPast = new Date(data.date_tournoi) < new Date();
        if (myReg && isPast) {
          setCanRate(true);
          const { data: myAvis } = await supabase
            .from("avis")
            .select("note, commentaire")
            .eq("user_id", uid)
            .eq("tournoi_id", tournoiId)
            .maybeSingle();
          if (myAvis) {
            setMyRating(myAvis.note);
            setMyComment(myAvis.commentaire || "");
            setCommentDraft(myAvis.commentaire || "");
          }
        }
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
      console.log("[inscription] insert result, error:", error);
      if (!error) {
        setIsRegistered(true);
        const newCount = inscriptionCount + 1;
        setInscriptionCount(newCount);

        // Get session email for player confirmation
        const { data: { session } } = await supabase.auth.getSession();
        const userEmail = session?.user?.email;
        console.log("[inscription] userEmail:", userEmail, "contact_email:", tournoi.contact_email);

        // Get user profile for organizer notification (non-blocking)
        let profile = null;
        try {
          const { data: p } = await supabase
            .from("profiles")
            .select("pseudo, prenom, nom")
            .eq("id", currentUserId)
            .maybeSingle();
          profile = p;
        } catch (e) {
          console.log("[inscription] profiles fetch failed, continuing:", e);
        }

        // Email 1: confirmation to player
        console.log("[inscription] sending confirmation email...");
        const emailTo = userEmail || session?.user?.user_metadata?.email;
        if (emailTo) {
          fetch("/api/emails/inscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: emailTo,
              tournoi: {
                id: tournoiId,
                nom: tournoi.nom,
                date_tournoi: tournoi.date_tournoi,
                heure: tournoi.heure,
                ville: tournoi.ville,
                adresse: tournoi.adresse,
                format: tournoi.format,
              },
            }),
          })
            .then((r) => r.json())
            .then((d) => console.log("[inscription email] response:", d))
            .catch((e) => console.error("[inscription email] fetch error:", e));
        } else {
          console.log("[inscription email] skipped: no email found in session");
        }

        // Email 2: notification to organizer
        console.log("[nouveau-inscrit] sending organizer email...");
        if (tournoi.contact_email) {
          fetch("/api/emails/nouveau-inscrit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: tournoi.contact_email,
              tournoi: { id: tournoiId, nom: tournoi.nom },
              joueur: profile || {},
              inscrits: newCount,
              max: tournoi.nb_joueurs,
            }),
          })
            .then((r) => r.json())
            .then((d) => console.log("[nouveau-inscrit email] response:", d))
            .catch((e) => console.error("[nouveau-inscrit email] fetch error:", e));
        } else {
          console.log("[nouveau-inscrit email] skipped: no contact_email on tournoi");
        }
      } else {
        console.error("[inscription] insert FAILED:", error.message, error.details, error.hint);
      }
    }
    setRegisterLoading(false);
  }

  async function persistAvis(note: number, commentaire: string) {
    if (!currentUserId) return;
    setRatingLoading(true);
    const prev = myRating;

    if (prev > 0) {
      await supabase
        .from("avis")
        .update({ note, commentaire: commentaire || null })
        .eq("user_id", currentUserId)
        .eq("tournoi_id", tournoiId);
    } else {
      await supabase
        .from("avis")
        .insert([{ user_id: currentUserId, tournoi_id: tournoiId, note, commentaire: commentaire || null }]);
    }

    setMyRating(note);
    setMyComment(commentaire);

    // Recalculate average + reload comments
    const { data: avisData } = await supabase
      .from("avis")
      .select("id, user_id, note, commentaire, created_at")
      .eq("tournoi_id", tournoiId)
      .order("created_at", { ascending: false });
    if (avisData && avisData.length > 0) {
      const avg = avisData.reduce((s: number, a: { note: number }) => s + a.note, 0) / avisData.length;
      setAvgRating(Math.round(avg * 10) / 10);
      setRatingCount(avisData.length);

      const reviewerIds = avisData.map((a: { user_id: string }) => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, pseudo, prenom")
        .in("id", reviewerIds);
      const pseudoMap: Record<string, string> = {};
      (profiles || []).forEach((p: { id: string; pseudo: string | null; prenom: string | null }) => {
        pseudoMap[p.id] = p.pseudo || p.prenom || "Joueur anonyme";
      });
      setAllReviews(
        avisData.map((a: { id: string; user_id: string; note: number; commentaire: string | null; created_at: string }) => ({
          id: a.id,
          note: a.note,
          commentaire: a.commentaire,
          created_at: a.created_at,
          pseudo: pseudoMap[a.user_id] || "Joueur anonyme",
        }))
      );
    }
    setRatingLoading(false);
  }

  async function handleRate(note: number) {
    await persistAvis(note, commentDraft);
  }

  async function handleSubmitComment() {
    if (myRating < 1) return;
    await persistAvis(myRating, commentDraft);
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
            {tournoi.type_jeu && (
              <span className={`inline-flex items-center text-[0.7rem] sm:text-[0.75rem] font-bold uppercase tracking-[1px] px-2 sm:px-3 py-[4px] sm:py-[5px] rounded-full border ${
                tournoi.type_jeu === "electronique"
                  ? "bg-[rgba(59,130,246,0.12)] border-[rgba(59,130,246,0.25)] text-[#3b82f6]"
                  : "bg-[rgba(168,85,247,0.12)] border-[rgba(168,85,247,0.25)] text-[#a855f7]"
              }`}>
                {tournoi.type_jeu === "electronique" ? "Électronique" : "Traditionnel"}
              </span>
            )}
            {isRegistered && (
              <span className="inline-flex items-center text-[0.7rem] sm:text-[0.75rem] font-bold uppercase tracking-[1px] px-2 sm:px-3 py-[4px] sm:py-[5px] rounded-full bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.25)] text-[#22c55e]">
                <Check className="w-3.5 h-3.5 inline -mt-[1px]" /> Inscrit
              </span>
            )}
          </div>
          <h1 className="font-barlow-condensed font-black text-[1.4rem] xs:text-[1.8rem] sm:text-[2.4rem] xl:text-[2.8rem] uppercase leading-[1.1] mb-3">
            {tournoi.nom}
          </h1>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Rating display */}
            {ratingCount > 0 && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                <span className="text-[0.92rem] font-bold text-white">{avgRating}</span>
                <span className="text-[0.82rem] text-[#777]">/5 ({ratingCount} avis)</span>
              </div>
            )}

            {/* Dashboard button - owner only */}
            {isOwner && (
              <Link
                href={`/tournois/${tournoiId}/dashboard`}
                className="inline-flex items-center gap-2 bg-[rgba(232,34,10,0.1)] border border-[rgba(232,34,10,0.25)] text-[#e8220a] text-[0.82rem] font-bold px-3 py-[6px] rounded-lg no-underline transition-all hover:bg-[rgba(232,34,10,0.2)]"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Tableau de bord
              </Link>
            )}
          </div>
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

            {/* Rating section */}
            {(canRate || ratingCount > 0 || (!currentUserId && tournoi && new Date(tournoi.date_tournoi) < new Date())) && (
              <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-[rgba(249,115,22,0.12)] border border-[rgba(249,115,22,0.25)] rounded-[8px] flex items-center justify-center shrink-0">
                    <Star className="w-[18px] h-[18px] text-[#f59e0b]" />
                  </div>
                  <div className="text-[0.75rem] font-bold uppercase tracking-[1px] text-[#777]">Évaluation</div>
                </div>

                {ratingCount > 0 && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="font-barlow-condensed text-[2.2rem] font-black text-[#f59e0b] leading-none">{avgRating}</div>
                    <div>
                      <StarRating value={Math.round(avgRating)} readonly size={18} />
                      <div className="text-[0.78rem] text-[#777] mt-1">{ratingCount} avis</div>
                    </div>
                  </div>
                )}

                {canRate && (
                  <div className={`${ratingCount > 0 ? "pt-4 border-t border-[rgba(255,255,255,0.06)]" : ""}`}>
                    <div className="text-[0.82rem] text-[#ccc] mb-2">
                      {myRating > 0 ? "Ta note :" : "Note ce tournoi :"}
                    </div>
                    <div className={`flex items-center gap-3 mb-3 ${ratingLoading ? "opacity-50 pointer-events-none" : ""}`}>
                      <StarRating value={myRating} onChange={handleRate} size={28} />
                      {myRating > 0 && (
                        <span className="text-[0.82rem] text-[#777]">{myRating}/5</span>
                      )}
                    </div>
                    {myRating > 0 && (
                      <div className="mt-3">
                        <div className="text-[0.78rem] text-[#777] mb-2">
                          Un commentaire ? (optionnel)
                        </div>
                        <textarea
                          value={commentDraft}
                          onChange={(e) => setCommentDraft(e.target.value)}
                          placeholder="Ton retour sur l'organisation, l'ambiance..."
                          rows={3}
                          maxLength={500}
                          className="w-full bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-[10px] px-3 py-2 text-[0.88rem] text-white placeholder:text-[#555] resize-none focus:outline-none focus:border-[rgba(245,158,11,0.4)]"
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[0.7rem] text-[#555]">{commentDraft.length}/500</span>
                          <button
                            onClick={handleSubmitComment}
                            disabled={ratingLoading || commentDraft === myComment}
                            className="bg-[#f59e0b] text-[#111] border-none text-[0.78rem] font-bold px-4 py-[6px] rounded-lg cursor-pointer transition-all hover:bg-[#e89608] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {ratingLoading ? "..." : myComment ? "Mettre à jour" : "Publier"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!currentUserId && (
                  <div className={`${ratingCount > 0 ? "pt-4 border-t border-[rgba(255,255,255,0.06)]" : ""}`}>
                    <Link href="/auth" className="text-[0.85rem] text-[#f59e0b] no-underline hover:underline">
                      Connectez-vous pour noter ce tournoi →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Reviews list */}
            {allReviews.filter((r) => r.commentaire && r.commentaire.trim()).length > 0 && (
              <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.25)] rounded-[8px] flex items-center justify-center shrink-0">
                    <Star className="w-[18px] h-[18px] text-[#e8220a]" />
                  </div>
                  <div className="text-[0.75rem] font-bold uppercase tracking-[1px] text-[#777]">
                    Avis des joueurs ({allReviews.filter((r) => r.commentaire && r.commentaire.trim()).length})
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  {allReviews
                    .filter((r) => r.commentaire && r.commentaire.trim())
                    .map((r) => (
                      <div key={r.id} className="border-b border-[rgba(255,255,255,0.06)] pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[rgba(232,34,10,0.15)] text-[#e8220a] flex items-center justify-center font-bold text-[0.78rem]">
                              {r.pseudo.charAt(0).toUpperCase()}
                            </div>
                            <div className="font-bold text-[0.88rem] text-white">{r.pseudo}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StarRating value={r.note} readonly size={14} />
                            <span className="text-[0.72rem] text-[#777]">
                              {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                        </div>
                        <div className="text-[0.88rem] text-[#ccc] leading-[1.6] whitespace-pre-line">{r.commentaire}</div>
                      </div>
                    ))}
                </div>
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
