"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Printer, Target, ArrowLeft, LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Tournament } from "@/lib/types";
import type { Poule, BracketRound } from "@/lib/bracket";

export const runtime = "edge";

interface TableauRow {
  id: string;
  genere_at: string;
  poules: Poule[];
  bracket: BracketRound[];
}

const ROUND_COLORS: Record<string, string> = {
  "Huitièmes de finale": "#6366f1",
  "Quarts de finale": "#f97316",
  "Demi-finales": "#e8220a",
  "Finale": "#f59e0b",
};

export default function TableauPage() {
  const params = useParams();
  const tournoiId = params.id as string;
  const supabase = createClient();

  const [tournoi, setTournoi] = useState<Tournament | null>(null);
  const [tableau, setTableau] = useState<TableauRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: tabs }] = await Promise.all([
        supabase.from("tournois").select("*").eq("id", tournoiId).single(),
        supabase
          .from("tableaux")
          .select("*")
          .eq("tournoi_id", tournoiId)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      if (!t) { setNotFound(true); setLoading(false); return; }
      setTournoi(t as Tournament);
      if (tabs && tabs.length > 0) setTableau(tabs[0] as TableauRow);
      setLoading(false);
    }
    load();
  }, [tournoiId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="animate-page-in min-h-screen pt-[80px] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[rgba(232,34,10,0.3)] border-t-[#e8220a] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !tournoi) {
    return (
      <div className="animate-page-in min-h-screen pt-[80px] flex flex-col items-center justify-center text-center px-4">
        <Target className="w-12 h-12 text-[#777] mb-4 opacity-40" />
        <div className="font-barlow-condensed font-black text-[1.6rem] uppercase mb-2">Tournoi introuvable</div>
        <Link href="/tournois" className="text-[#e8220a] text-[0.88rem] font-bold mt-4">← Retour aux tournois</Link>
      </div>
    );
  }

  const dateStr = new Date(tournoi.date_tournoi).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <>
      {/* ── Print styles ─────────────────────────────────────────────── */}
      <style>{`
        @media print {
          @page { size: A4; margin: 1.2cm; }
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-card { background: white !important; border: 1px solid #ddd !important; border-radius: 6px; page-break-inside: avoid; }
          .print-section { page-break-before: auto; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 6px 10px; font-size: 11px; text-align: left; }
          th { background: #f5f5f5; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .bracket-match { border: 1px solid #ddd; border-radius: 4px; padding: 8px 12px; margin-bottom: 4px; background: white; }
          .round-title { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; color: black; border-bottom: 2px solid black; padding-bottom: 4px; }
          .score-box { display: inline-block; border-bottom: 1px solid #999; min-width: 28px; margin-left: 8px; }
          .match-vs { color: #666; font-size: 10px; margin: 0 6px; }
          .poule-header { font-size: 13px; font-weight: 900; background: black !important; color: white !important; padding: 6px 10px; }
          .print-logo { display: flex !important; align-items: center; gap: 10px; }
          .matches-list { margin-top: 8px; }
          .match-line { font-size: 11px; padding: 4px 0; border-bottom: 1px dashed #eee; display: flex; align-items: center; justify-content: space-between; }
          .bracket-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>

      <div className="animate-page-in min-h-screen pt-[72px] xs:pt-[80px]">

        {/* ── Screen header ─────────────────────────────────────────── */}
        <div className="no-print px-3 xs:px-4 sm:px-6 lg:px-10 py-4 sm:py-6 border-b border-[rgba(255,255,255,0.06)]">
          <div className="max-w-[900px] mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[0.82rem] text-[#777] mb-2">
                <Link href="/tournois" className="hover:text-white transition-colors no-underline text-[#777]">Tournois</Link>
                <span>/</span>
                <Link href={`/tournois/${tournoiId}`} className="hover:text-white transition-colors no-underline text-[#777] truncate max-w-[160px]">{tournoi.nom}</Link>
                <span>/</span>
                <span className="text-white">Tableau</span>
              </div>
              <div className="font-barlow-condensed font-black text-[1.4rem] xs:text-[1.8rem] sm:text-[2.2rem] uppercase leading-none">
                Tableau <span className="text-[#e8220a]">officiel</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/tournois/${tournoiId}/dashboard`}
                className="no-print flex items-center gap-2 text-[0.82rem] text-[#777] font-bold no-underline hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Link>
              {tableau && (
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-[#e8220a] text-white border-none font-barlow-condensed font-bold text-[0.9rem] px-4 py-[10px] rounded-[10px] cursor-pointer hover:bg-[#b81a08] transition-all shadow-red-glow-lg"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Printable document ────────────────────────────────────── */}
        <div className="px-3 xs:px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-[900px] mx-auto" id="tableau-print">

          {/* Print logo header */}
          <div className="print-only print-logo mb-6">
            <div style={{ width: 36, height: 36, background: "#e8220a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, textTransform: "uppercase", letterSpacing: 1 }}>DartsTournois</div>
              <div style={{ fontSize: 11, color: "#666" }}>dartstournois.fr</div>
            </div>
          </div>

          {/* Tournament header */}
          <div className="bg-[#141414] print-card rounded-[14px] p-5 sm:p-7 mb-6 border border-[rgba(255,255,255,0.08)]">
            <div className="font-barlow-condensed font-black text-[1.6rem] sm:text-[2rem] uppercase text-white mb-3 print:text-black">{tournoi.nom}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Date", val: dateStr },
                { label: "Lieu", val: tournoi.adresse ? `${tournoi.adresse}, ${tournoi.ville}` : tournoi.ville },
                { label: "Format", val: tournoi.format },
                { label: "Joueurs", val: `${tableau?.poules?.reduce((s, p) => s + p.joueurs.length, 0) ?? "—"}` },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div className="text-[0.7rem] font-bold uppercase tracking-[1px] text-[#777] print:text-gray-500 mb-1">{label}</div>
                  <div className="text-[0.88rem] text-white print:text-black font-medium">{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* No tableau yet */}
          {!tableau && (
            <div className="text-center py-16 text-[#777]">
              <LayoutGrid className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <div className="font-barlow-condensed font-extrabold text-[1.4rem] text-[#666] mb-2">Tableau non généré</div>
              <div className="text-[0.88rem] mb-6">L&apos;organisateur n&apos;a pas encore généré le tableau de ce tournoi.</div>
              <Link href={`/tournois/${tournoiId}/dashboard`} className="text-[#e8220a] font-bold text-[0.88rem] no-underline hover:underline">
                Aller au dashboard →
              </Link>
            </div>
          )}

          {tableau && (
            <>
              {/* ── PHASE DE POULES ─────────────────────────────────── */}
              <div className="print-section mb-8">
                <div className="flex items-center gap-3 mb-5 no-print">
                  <div className="h-px flex-1 bg-[rgba(255,255,255,0.08)]" />
                  <div className="font-barlow-condensed font-black text-[1.1rem] uppercase tracking-[1px] text-[#e8220a]">Phase de poules</div>
                  <div className="h-px flex-1 bg-[rgba(255,255,255,0.08)]" />
                </div>
                <div className="print-only round-title" style={{ display: "none" }}>Phase de poules</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tableau.poules.map((poule) => (
                    <div key={poule.id} className="bg-[#141414] print-card border border-[rgba(255,255,255,0.08)] rounded-[14px] overflow-hidden">
                      {/* Poule header */}
                      <div className="poule-header bg-[#e8220a] px-4 py-3 font-barlow-condensed font-black text-[1.05rem] uppercase tracking-[0.5px] text-white">
                        {poule.nom}
                        <span className="font-normal text-[0.75rem] ml-2 opacity-80">— {poule.joueurs.length} joueurs</span>
                      </div>

                      {/* Standings table */}
                      <table className="w-full text-[0.82rem] border-collapse">
                        <thead>
                          <tr className="border-b border-[rgba(255,255,255,0.06)] print:border-gray-200">
                            <th className="text-left px-3 py-2 text-[#777] font-bold uppercase text-[0.68rem] tracking-[0.8px] print:text-gray-500">Joueur</th>
                            {["J", "G", "N", "D", "Pts"].map((h) => (
                              <th key={h} className="text-center px-2 py-2 text-[#777] font-bold uppercase text-[0.68rem] tracking-[0.8px] w-8 print:text-gray-500">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {poule.joueurs.map((j, ji) => (
                            <tr key={j.inscription_id} className={`border-b border-[rgba(255,255,255,0.04)] print:border-gray-100 ${ji % 2 === 0 ? "bg-[rgba(255,255,255,0.02)] print:bg-gray-50" : ""}`}>
                              <td className="px-3 py-2 text-white print:text-black font-medium">{j.nom}</td>
                              {[0, 1, 2, 3, 4].map((ci) => (
                                <td key={ci} className="text-center px-1 py-2 text-[#555] print:text-gray-400">
                                  <span className="score-box inline-block border-b border-[rgba(255,255,255,0.2)] print:border-gray-400 min-w-[20px]">&nbsp;</span>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Matches list */}
                      <div className="matches-list px-4 py-3 border-t border-[rgba(255,255,255,0.06)] print:border-gray-200">
                        <div className="text-[0.7rem] font-bold uppercase tracking-[0.8px] text-[#777] print:text-gray-500 mb-2">Matches</div>
                        {poule.matches.map(([i, j], mi) => (
                          <div key={mi} className="match-line flex items-center justify-between py-[5px] border-b border-[rgba(255,255,255,0.04)] print:border-dashed print:border-gray-200 last:border-0">
                            <span className="text-[0.82rem] text-white print:text-black">
                              <span className="font-medium">{poule.joueurs[i]?.nom}</span>
                              <span className="text-[#555] print:text-gray-500 mx-2 text-[0.75rem]">vs</span>
                              <span className="font-medium">{poule.joueurs[j]?.nom}</span>
                            </span>
                            <span className="text-[0.78rem] text-[#444] print:text-gray-400 ml-4 flex items-center gap-1 shrink-0">
                              <span className="score-box inline-block border-b border-[rgba(255,255,255,0.15)] print:border-gray-400 min-w-[24px]">&nbsp;</span>
                              <span className="mx-1">–</span>
                              <span className="score-box inline-block border-b border-[rgba(255,255,255,0.15)] print:border-gray-400 min-w-[24px]">&nbsp;</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── PHASE FINALE ────────────────────────────────────── */}
              <div className="print-section">
                <div className="flex items-center gap-3 mb-5 no-print">
                  <div className="h-px flex-1 bg-[rgba(255,255,255,0.08)]" />
                  <div className="font-barlow-condensed font-black text-[1.1rem] uppercase tracking-[1px] text-[#e8220a]">Phase finale</div>
                  <div className="h-px flex-1 bg-[rgba(255,255,255,0.08)]" />
                </div>
                <div className="print-only round-title" style={{ display: "none" }}>Phase finale</div>

                <div className="bracket-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tableau.bracket.map((round) => {
                    const color = ROUND_COLORS[round.nom] || "#e8220a";
                    const isFinal = round.nom === "Finale";
                    return (
                      <div
                        key={round.nom}
                        className={`bg-[#141414] print-card border rounded-[14px] overflow-hidden ${
                          isFinal
                            ? "border-[rgba(245,158,11,0.3)] sm:col-span-2 lg:col-span-1"
                            : "border-[rgba(255,255,255,0.08)]"
                        }`}
                      >
                        {/* Round title */}
                        <div
                          className="px-4 py-3 font-barlow-condensed font-black text-[1rem] uppercase tracking-[0.5px]"
                          style={{ background: `${color}18`, borderBottom: `2px solid ${color}40`, color: color }}
                        >
                          {round.nom}
                        </div>

                        {/* Matches */}
                        <div className="p-3 flex flex-col gap-2">
                          {round.matches.map((match, mi) => {
                            const isBye1 = match.j1 === "— (bye)";
                            const isBye2 = match.j2 === "— (bye)";
                            return (
                              <div key={match.id} className="bracket-match bg-[#111] print:bg-white border border-[rgba(255,255,255,0.06)] print:border-gray-200 rounded-[8px] p-3">
                                <div className="text-[0.68rem] font-bold uppercase tracking-[0.8px] text-[#555] print:text-gray-400 mb-2">
                                  Match {mi + 1}
                                </div>
                                <div className="flex flex-col gap-[6px]">
                                  {/* J1 */}
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`text-[0.83rem] font-medium truncate ${isBye1 ? "text-[#555] italic print:text-gray-400" : "text-white print:text-black"}`}>
                                      {match.j1}
                                    </span>
                                    {!isBye1 && (
                                      <span className="shrink-0 inline-block border-b border-[rgba(255,255,255,0.2)] print:border-gray-400 min-w-[28px]">&nbsp;</span>
                                    )}
                                  </div>
                                  <div className="text-[0.68rem] text-[#444] print:text-gray-400 pl-1">vs</div>
                                  {/* J2 */}
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`text-[0.83rem] font-medium truncate ${isBye2 ? "text-[#555] italic print:text-gray-400" : "text-white print:text-black"}`}>
                                      {match.j2}
                                    </span>
                                    {!isBye2 && (
                                      <span className="shrink-0 inline-block border-b border-[rgba(255,255,255,0.2)] print:border-gray-400 min-w-[28px]">&nbsp;</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Qualifications reminder */}
              <div className="mt-6 bg-[#111] print:bg-white border border-[rgba(255,255,255,0.06)] print:border-gray-200 rounded-[10px] px-4 py-3 text-[0.8rem] text-[#777] print:text-gray-600">
                <strong className="text-white print:text-black">Règle de qualification :</strong>{" "}
                Les 2 premiers de chaque poule (par points) sont qualifiés pour la phase finale.
                En cas d&apos;égalité de points, la différence de legs prévaut.
              </div>
            </>
          )}

          {/* Print footer */}
          <div className="print-only mt-8" style={{ display: "none", textAlign: "center", fontSize: 10, color: "#999", borderTop: "1px solid #eee", paddingTop: 8 }}>
            dartstournois.fr — Tableau généré automatiquement
            {tableau && ` — ${new Date(tableau.genere_at).toLocaleDateString("fr-FR")}`}
          </div>
        </div>

        {/* Screen back link */}
        <div className="no-print px-3 xs:px-4 sm:px-6 lg:px-10 pb-10 max-w-[900px] mx-auto">
          <Link href={`/tournois/${tournoiId}`} className="text-[0.85rem] text-[#777] no-underline hover:text-white transition-colors flex items-center gap-1">
            ← Retour au tournoi
          </Link>
        </div>
      </div>
    </>
  );
}

