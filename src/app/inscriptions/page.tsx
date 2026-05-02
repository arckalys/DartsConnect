"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, AlertTriangle, Trophy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Tournament } from "@/lib/types";
import { fmtDate } from "@/lib/data";

export const runtime = "edge";

interface Inscription {
  id: string;
  created_at: string;
  tournoi_id: string;
  tournois: Tournament;
}

export default function InscriptionsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [unregisteringId, setUnregisteringId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Inscription | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      setAuthenticated(true);

      const { data } = await supabase
        .from("inscriptions")
        .select("id, created_at, tournoi_id, tournois(*)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setInscriptions(data as unknown as Inscription[]);
      }
      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUnregister() {
    if (!confirmTarget) return;
    setUnregisteringId(confirmTarget.id);
    const { error } = await supabase
      .from("inscriptions")
      .delete()
      .eq("id", confirmTarget.id);
    if (!error) {
      setInscriptions((prev) => prev.filter((i) => i.id !== confirmTarget.id));
    }
    setUnregisteringId(null);
    setConfirmTarget(null);
  }

  if (loading) {
    return (
      <div className="animate-page-in min-h-screen pt-[80px] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[rgba(232,34,10,0.3)] border-t-[#b91c0a] rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="animate-page-in min-h-screen pt-[80px] px-6 pb-12 flex flex-col items-center justify-center text-center">
        <Lock className="w-12 h-12 text-[#777] mx-auto mb-4 opacity-40" />
        <div className="font-barlow-condensed font-black text-[1.6rem] uppercase mb-2">Connexion requise</div>
        <div className="text-[0.88rem] text-[#777] mb-6">Connecte-toi pour voir tes inscriptions aux tournois.</div>
        <button
          onClick={() => router.push("/auth")}
          className="bg-[#b91c0a] text-white border-none font-barlow-condensed font-bold text-[1rem] px-8 py-3 rounded-[10px] cursor-pointer transition-all shadow-red-glow-lg hover:bg-[#b81a08]"
        >
          Se connecter →
        </button>
      </div>
    );
  }

  return (
    <div className="animate-page-in min-h-screen">
      {/* Confirm unregister modal */}
      {confirmTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(0,0,0,0.7)] backdrop-blur-sm">
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] xs:rounded-[18px] p-5 xs:p-6 sm:p-8 max-w-[440px] w-full mx-3 xs:mx-4 animate-fade-up">
            <div className="text-center mb-6">
              <AlertTriangle className="w-12 h-12 text-[#f59e0b] mx-auto mb-3" />
              <div className="font-barlow-condensed font-black text-[1.4rem] uppercase mb-2">Se désinscrire ?</div>
              <div className="text-[0.88rem] text-[#777]">
                Tu es sur le point de te désinscrire de <strong className="text-white">&quot;{confirmTarget.tournois.nom}&quot;</strong>.
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmTarget(null)}
                disabled={!!unregisteringId}
                className="flex-1 py-3 rounded-[10px] font-barlow-condensed font-bold text-[0.95rem] cursor-pointer bg-transparent text-white border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                onClick={handleUnregister}
                disabled={!!unregisteringId}
                className="flex-1 py-3 rounded-[10px] font-barlow-condensed font-bold text-[0.95rem] cursor-pointer border-none bg-[#dc2626] text-white hover:bg-[#b91c1c] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {unregisteringId ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Se désinscrire"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="pt-[80px] xs:pt-[88px] px-3 xs:px-4 sm:px-6 lg:px-10 bg-gradient-to-b from-[rgba(232,34,10,0.04)] to-transparent border-b border-[rgba(255,255,255,0.08)]">
        <div className="max-w-[1200px] xl:max-w-[1400px] mx-auto pb-6">
          <div className="font-barlow-condensed font-black text-[1.5rem] xs:text-[1.8rem] sm:text-[2.4rem] uppercase tracking-[0.5px]">Mes inscriptions</div>
          <div className="text-[0.88rem] text-[#777] mt-1">
            <span className="text-[#b91c0a] font-bold">{inscriptions.length}</span> tournoi{inscriptions.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] xl:max-w-[1400px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-10 py-5 sm:py-8">
        {inscriptions.length === 0 ? (
          <div className="text-center py-16 text-[#777]">
            <Trophy className="w-12 h-12 text-[#777] mx-auto mb-4 opacity-40" />
            <div className="font-barlow-condensed font-extrabold text-[1.4rem] text-[#666] mb-2">Aucune inscription</div>
            <div className="text-[0.88rem] mb-6">Tu n&apos;es inscrit à aucun tournoi pour le moment.</div>
            <Link
              href="/tournois"
              className="inline-block bg-[#b91c0a] text-white border-none font-barlow-condensed font-bold text-[1rem] px-8 py-3 rounded-[10px] transition-all shadow-red-glow-lg hover:bg-[#b81a08] no-underline"
            >
              Voir les tournois →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {inscriptions.map((insc, i) => {
              const t = insc.tournois;
              if (!t) return null;
              return (
                <div
                  key={insc.id}
                  className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 xs:px-4 sm:px-[1.4rem] py-3 xs:py-4 sm:py-[1.1rem] flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-white transition-all duration-200 animate-fade-up hover:border-[rgba(232,34,10,0.35)]"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  {/* Tournament info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-barlow-condensed font-extrabold text-[1.1rem] truncate">{t.nom}</div>
                    <div className="text-[0.82rem] text-[#777] mt-1 flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <svg className="w-[12px] h-[12px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {fmtDate(t.date_tournoi)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-[12px] h-[12px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        {t.ville}, {t.region}
                      </span>
                      <span className="text-[#aaa]">{t.format}</span>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center gap-3 sm:gap-3 sm:shrink-0">
                    <div className="inline-flex items-center gap-[6px] bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.25)] rounded-full px-3 py-1 text-[0.75rem] font-bold text-[#22c55e] whitespace-nowrap">
                      <Check className="w-3.5 h-3.5 inline -mt-[1px]" /> Inscrit
                    </div>
                    <button
                      onClick={() => setConfirmTarget(insc)}
                      className="text-[0.78rem] font-bold px-[14px] py-[6px] rounded-lg bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)] text-[#f87171] cursor-pointer transition-all hover:bg-[rgba(248,113,113,0.15)] whitespace-nowrap"
                    >
                      Se désinscrire
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
