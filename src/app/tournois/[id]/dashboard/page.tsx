"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Target, Users, Ban, Clock, CheckCircle, LayoutGrid, Printer, RefreshCw, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Tournament, STATUS_LABELS } from "@/lib/types";
import { generateTableau, Joueur } from "@/lib/bracket";
import { fmtDate } from "@/lib/data";

export const runtime = "edge";

interface Inscription {
  id: string;
  user_id: string;
  created_at: string;
  statut: string;
  user_meta?: { pseudo?: string; prenom?: string; nom?: string; email?: string };
}

interface TableauRow {
  id: string;
  genere_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const tournoiId = params.id as string;
  const supabase = createClient();

  const [tournoi, setTournoi] = useState<Tournament | null>(null);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [tableau, setTableau] = useState<TableauRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [generationLoading, setGenerationLoading] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [generationSuccess, setGenerationSuccess] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/auth");
        return;
      }
      setUserEmail(session.user.email || "");

      const { data, error } = await supabase
        .from("tournois")
        .select("*")
        .eq("id", tournoiId)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (data.user_id !== session.user.id) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      setTournoi(data as Tournament);

      // Fetch inscriptions
      const { data: insData } = await supabase
        .from("inscriptions")
        .select("id, user_id, created_at, statut")
        .eq("tournoi_id", tournoiId)
        .order("created_at", { ascending: true });

      if (insData && insData.length > 0) {
        const userIds = insData.map((i: Inscription) => i.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, pseudo, prenom, nom, email")
          .in("id", userIds);

        const profileMap = new Map(
          (profiles || []).map((p: { id: string; pseudo?: string; prenom?: string; nom?: string; email?: string }) => [p.id, p])
        );

        const enriched = insData.map((i: Inscription) => ({
          ...i,
          user_meta: profileMap.get(i.user_id) || {},
        }));
        setInscriptions(enriched);
      }

      // Fetch existing tableau
      const { data: tabData } = await supabase
        .from("tableaux")
        .select("id, genere_at")
        .eq("tournoi_id", tournoiId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (tabData && tabData.length > 0) {
        setTableau(tabData[0] as TableauRow);
      }

      setLoading(false);
    }
    load();
  }, [tournoiId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleStatut(inscriptionId: string, currentStatut: string) {
    const newStatut = currentStatut === "confirme" ? "en_attente" : "confirme";
    const { error } = await supabase
      .from("inscriptions")
      .update({ statut: newStatut })
      .eq("id", inscriptionId);
    if (!error) {
      setInscriptions((prev) =>
        prev.map((i) => (i.id === inscriptionId ? { ...i, statut: newStatut } : i))
      );
    }
  }

  async function doGenerate() {
    if (!tournoi) return;
    setGenerationLoading(true);
    setGenerationError("");
    setGenerationSuccess("");

    try {
      // Build joueurs list from inscriptions
      const joueurs: Joueur[] = inscriptions.map((ins) => {
        const meta = ins.user_meta || {};
        const nom =
          meta.pseudo ||
          [meta.prenom, meta.nom].filter(Boolean).join(" ") ||
          meta.email ||
          "Joueur anonyme";
        return { inscription_id: ins.id, user_id: ins.user_id, nom };
      });

      if (joueurs.length < 4) {
        setGenerationError("Il faut au moins 4 joueurs pour générer un tableau.");
        setGenerationLoading(false);
        return;
      }

      // Delete existing tableau if any
      if (tableau) {
        await supabase.from("tableaux").delete().eq("tournoi_id", tournoiId);
      }

      const data = generateTableau(joueurs);

      // Save to Supabase
      const { data: saved, error: saveErr } = await supabase
        .from("tableaux")
        .insert({
          tournoi_id: tournoiId,
          poules: data.poules,
          bracket: data.bracket,
          genere_at: new Date().toISOString(),
        })
        .select("id, genere_at")
        .single();

      if (saveErr) {
        setGenerationError("Erreur lors de la sauvegarde : " + saveErr.message);
        setGenerationLoading(false);
        return;
      }

      setTableau(saved as TableauRow);
      setGenerationSuccess("Tableau généré avec succès !");

      // Send email to organizer
      if (tournoi.contact_email || userEmail) {
        fetch("/api/emails/tableau", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: tournoi.contact_email || userEmail,
            tournoi: { id: tournoiId, nom: tournoi.nom },
          }),
        }).catch(() => {/* silent */});
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      setGenerationError(msg);
    } finally {
      setGenerationLoading(false);
    }
  }

  // ─── Loading / Error states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="animate-page-in min-h-screen pt-[80px] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[rgba(232,34,10,0.3)] border-t-[#e8220a] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || unauthorized) {
    return (
      <div className="animate-page-in min-h-screen pt-[80px] px-4 sm:px-6 pb-12 flex flex-col items-center justify-center text-center">
        <Ban className="w-12 h-12 text-[#777] mx-auto mb-4 opacity-40" />
        <div className="font-barlow-condensed font-black text-[1.6rem] uppercase mb-2">
          {notFound ? "Tournoi introuvable" : "Accès refusé"}
        </div>
        <div className="text-[0.88rem] text-[#777] mb-6">
          {notFound
            ? "Ce tournoi n'existe pas ou a été supprimé."
            : "Seul le créateur du tournoi peut accéder au tableau de bord."}
        </div>
        <button onClick={() => router.push("/tournois")} className="bg-[#e8220a] text-white border-none font-barlow-condensed font-bold text-[1rem] px-8 py-3 rounded-[10px] cursor-pointer transition-all shadow-red-glow-lg hover:bg-[#b81a08]">
          ← Retour aux tournois
        </button>
      </div>
    );
  }

  if (!tournoi) return null;

  const pct = tournoi.nb_joueurs > 0 ? Math.round((inscriptions.length / tournoi.nb_joueurs) * 100) : 0;
  const confirmes = inscriptions.filter((i) => i.statut === "confirme").length;
  const enAttente = inscriptions.filter((i) => i.statut !== "confirme").length;
  const isFull = inscriptions.length >= tournoi.nb_joueurs;

  return (
    <div className="animate-page-in min-h-screen pt-[72px] xs:pt-[80px] px-3 xs:px-4 sm:px-6 pb-10 sm:pb-12">
      <div className="max-w-[960px] mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[0.82rem] text-[#777] mb-6 sm:mb-8">
          <Link href="/tournois" className="text-[#777] no-underline hover:text-white transition-colors">Tournois</Link>
          <span>/</span>
          <Link href={`/tournois/${tournoiId}`} className="text-[#777] no-underline hover:text-white transition-colors truncate">{tournoi.nom}</Link>
          <span>/</span>
          <span className="text-white">Dashboard</span>
        </div>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="font-barlow-condensed font-black text-[1.4rem] xs:text-[1.8rem] sm:text-[2.4rem] uppercase leading-[1.1] mb-2">
            Tableau de bord
          </div>
          <div className="text-[0.88rem] text-[#777]">{tournoi.nom}</div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 sm:mb-8">
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[12px] p-4">
            <div className="text-[0.72rem] font-bold uppercase tracking-[1px] text-[#777] mb-2">Date</div>
            <div className="text-[0.92rem] text-white font-medium">{fmtDate(tournoi.date_tournoi)}</div>
          </div>
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[12px] p-4">
            <div className="text-[0.72rem] font-bold uppercase tracking-[1px] text-[#777] mb-2">Lieu</div>
            <div className="text-[0.92rem] text-white font-medium truncate">{tournoi.ville}</div>
          </div>
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[12px] p-4">
            <div className="text-[0.72rem] font-bold uppercase tracking-[1px] text-[#777] mb-2">Format</div>
            <div className="text-[0.92rem] text-white font-medium">{tournoi.format}</div>
          </div>
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[12px] p-4">
            <div className="text-[0.72rem] font-bold uppercase tracking-[1px] text-[#777] mb-2">Statut</div>
            <div className="text-[0.92rem] text-white font-medium">{STATUS_LABELS[tournoi.statut]}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-5 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.25)] rounded-[8px] flex items-center justify-center">
              <Users className="w-[18px] h-[18px] text-[#e8220a]" />
            </div>
            <div className="font-barlow-condensed font-extrabold text-[1.1rem] uppercase">Statistiques</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div>
              <div className="font-barlow-condensed text-[2rem] font-black text-[#e8220a] leading-none">{inscriptions.length}</div>
              <div className="text-[0.78rem] text-[#777] mt-1">Inscrits</div>
            </div>
            <div>
              <div className="font-barlow-condensed text-[2rem] font-black text-white leading-none">{tournoi.nb_joueurs - inscriptions.length}</div>
              <div className="text-[0.78rem] text-[#777] mt-1">Places restantes</div>
            </div>
            <div>
              <div className="font-barlow-condensed text-[2rem] font-black text-[#22c55e] leading-none">{confirmes}</div>
              <div className="text-[0.78rem] text-[#777] mt-1">Confirmés</div>
            </div>
            <div>
              <div className="font-barlow-condensed text-[2rem] font-black text-[#f97316] leading-none">{enAttente}</div>
              <div className="text-[0.78rem] text-[#777] mt-1">En attente</div>
            </div>
          </div>
          <div className="h-[8px] bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#e8220a] transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <div className="text-[0.75rem] text-[#777] mt-2 text-right">
            {inscriptions.length}/{tournoi.nb_joueurs} joueurs ({Math.min(pct, 100)}%)
          </div>
        </div>

        {/* ── Tableau de tournoi ─────────────────────────────────────────── */}
        <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-5 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.25)] rounded-[8px] flex items-center justify-center">
                <LayoutGrid className="w-[18px] h-[18px] text-[#e8220a]" />
              </div>
              <div className="font-barlow-condensed font-extrabold text-[1.1rem] uppercase">Tableau de tournoi</div>
            </div>
            {tableau && (
              <Link
                href={`/tournois/${tournoiId}/tableau`}
                className="flex items-center gap-2 text-[0.82rem] font-bold text-[#e8220a] no-underline hover:underline"
              >
                <Printer className="w-4 h-4" />
                Voir &amp; Imprimer
              </Link>
            )}
          </div>

          {/* Messages */}
          {generationError && (
            <div className="flex items-center gap-2 bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.25)] text-[#f87171] rounded-[10px] px-4 py-3 text-[0.85rem] mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {generationError}
            </div>
          )}
          {generationSuccess && (
            <div className="flex items-center gap-2 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.25)] text-[#22c55e] rounded-[10px] px-4 py-3 text-[0.85rem] mb-4">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {generationSuccess}{" "}
              <Link href={`/tournois/${tournoiId}/tableau`} className="font-bold underline text-[#22c55e]">
                Voir le tableau →
              </Link>
            </div>
          )}

          {tableau ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111] border border-[rgba(255,255,255,0.06)] rounded-[10px] p-4">
              <div>
                <div className="text-[0.9rem] text-white font-medium mb-1">Tableau généré</div>
                <div className="text-[0.78rem] text-[#777]">
                  Généré le{" "}
                  {new Date(tableau.genere_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/tournois/${tournoiId}/tableau`}
                  className="flex items-center gap-2 bg-[#e8220a] text-white font-barlow-condensed font-bold text-[0.9rem] px-4 py-2 rounded-[8px] no-underline hover:bg-[#b81a08] transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Voir le tableau
                </Link>
                <button
                  onClick={doGenerate}
                  disabled={generationLoading}
                  title="Régénérer le tableau"
                  className="flex items-center gap-2 bg-transparent border border-[rgba(255,255,255,0.1)] text-[#777] font-barlow-condensed font-bold text-[0.85rem] px-3 py-2 rounded-[8px] cursor-pointer hover:text-white hover:border-[rgba(255,255,255,0.3)] transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${generationLoading ? "animate-spin" : ""}`} />
                  Régénérer
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#111] border border-[rgba(255,255,255,0.06)] rounded-[10px] p-5">
              {isFull ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-[0.9rem] text-white font-medium mb-1">
                      Tournoi complet !
                    </div>
                    <div className="text-[0.78rem] text-[#777]">
                      Tous les joueurs sont inscrits. Générez le tableau pour répartir les poules.
                    </div>
                  </div>
                  <button
                    onClick={doGenerate}
                    disabled={generationLoading}
                    className="flex items-center gap-2 bg-[#e8220a] text-white border-none font-barlow-condensed font-bold text-[0.95rem] px-5 py-[10px] rounded-[10px] cursor-pointer hover:bg-[#b81a08] transition-all shadow-red-glow-lg disabled:opacity-60 whitespace-nowrap"
                  >
                    {generationLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LayoutGrid className="w-4 h-4" />
                    )}
                    Générer le tableau
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-[0.9rem] text-white font-medium mb-1">
                      Tournoi non complet ({inscriptions.length}/{tournoi.nb_joueurs})
                    </div>
                    <div className="text-[0.78rem] text-[#777]">
                      Le tableau sera généré avec les joueurs actuellement inscrits.
                    </div>
                  </div>
                  <button
                    onClick={doGenerate}
                    disabled={generationLoading || inscriptions.length < 4}
                    className="flex items-center gap-2 bg-transparent border border-[rgba(232,34,10,0.4)] text-[#e8220a] font-barlow-condensed font-bold text-[0.9rem] px-5 py-[10px] rounded-[10px] cursor-pointer hover:bg-[rgba(232,34,10,0.08)] transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {generationLoading ? (
                      <div className="w-4 h-4 border-2 border-[#e8220a] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LayoutGrid className="w-4 h-4" />
                    )}
                    Forcer la génération
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inscriptions list */}
        <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.25)] rounded-[8px] flex items-center justify-center">
              <Target className="w-[18px] h-[18px] text-[#e8220a]" />
            </div>
            <div className="font-barlow-condensed font-extrabold text-[1.1rem] uppercase">
              Joueurs inscrits ({inscriptions.length})
            </div>
          </div>

          {inscriptions.length === 0 ? (
            <div className="text-center py-10 text-[#777]">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <div className="text-[0.88rem]">Aucun joueur inscrit pour le moment</div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="hidden sm:grid grid-cols-[auto_2fr_1.5fr_1fr_auto] gap-3 px-4 text-[0.72rem] font-bold uppercase tracking-[1px] text-[#777] mb-1">
                <div className="w-8">#</div>
                <div>Joueur</div>
                <div>Date d&apos;inscription</div>
                <div>Statut</div>
                <div className="w-[100px]">Action</div>
              </div>
              {inscriptions.map((ins, idx) => {
                const meta = ins.user_meta || {};
                const displayName = meta.pseudo || [meta.prenom, meta.nom].filter(Boolean).join(" ") || meta.email || "Joueur anonyme";
                const fullName = meta.prenom && meta.nom ? `${meta.prenom} ${meta.nom}` : "";
                const isConfirme = ins.statut === "confirme";

                return (
                  <div
                    key={ins.id}
                    className="bg-[#111] border border-[rgba(255,255,255,0.06)] rounded-[10px] px-4 py-3 sm:grid sm:grid-cols-[auto_2fr_1.5fr_1fr_auto] sm:items-center gap-3"
                  >
                    <div className="hidden sm:block w-8 text-[0.82rem] text-[#555] font-bold">{idx + 1}</div>
                    <div>
                      <Link
                        href={`/joueurs/${ins.user_id}`}
                        className="text-[0.9rem] text-white font-medium no-underline hover:text-[#e8220a] transition-colors"
                      >
                        {displayName}
                      </Link>
                      {fullName && fullName !== displayName && (
                        <div className="text-[0.78rem] text-[#777]">{fullName}</div>
                      )}
                    </div>
                    <div className="text-[0.82rem] text-[#777] mt-1 sm:mt-0">
                      {new Date(ins.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <span className={`inline-flex items-center gap-1 text-[0.72rem] font-bold uppercase tracking-[0.5px] px-2 py-1 rounded-full ${
                        isConfirme
                          ? "bg-[rgba(34,197,94,0.12)] text-[#22c55e]"
                          : "bg-[rgba(249,115,22,0.12)] text-[#f97316]"
                      }`}>
                        {isConfirme ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {isConfirme ? "Confirmé" : "En attente"}
                      </span>
                    </div>
                    <div className="mt-2 sm:mt-0 w-[100px]">
                      <button
                        onClick={() => toggleStatut(ins.id, ins.statut)}
                        className={`text-[0.75rem] font-bold px-3 py-[5px] rounded-lg cursor-pointer border transition-all ${
                          isConfirme
                            ? "bg-[rgba(249,115,22,0.08)] border-[rgba(249,115,22,0.2)] text-[#f97316] hover:bg-[rgba(249,115,22,0.15)]"
                            : "bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.2)] text-[#22c55e] hover:bg-[rgba(34,197,94,0.15)]"
                        }`}
                      >
                        {isConfirme ? "Remettre en attente" : "Confirmer"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="mt-8 sm:mt-10">
          <Link href={`/tournois/${tournoiId}`} className="text-[0.85rem] text-[#777] no-underline hover:text-white transition-colors flex items-center gap-1">
            ← Retour au tournoi
          </Link>
        </div>
      </div>
    </div>
  );
}
