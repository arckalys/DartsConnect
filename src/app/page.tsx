"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Dartboard from "@/components/Dartboard";
import TournamentCard from "@/components/TournamentCard";
import Footer from "@/components/Footer";
import { MOCK_TOURNAMENTS } from "@/lib/data";

export const runtime = "edge";

export default function HomePage() {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  // Stats
  const totalPlayers = MOCK_TOURNAMENTS.reduce((s, t) => s + t.players, 0);
  const totalRegions = [...new Set(MOCK_TOURNAMENTS.map((t) => t.region))].length;
  const upcoming = [...MOCK_TOURNAMENTS]
    .sort((a, b) => new Date(a.date_tournoi).getTime() - new Date(b.date_tournoi).getTime())
    .slice(0, 3);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((r) => observer.observe(r));
    return () => observer.disconnect();
  }, []);

  function heroSearch() {
    const q = searchRef.current?.value || "";
    router.push(`/tournois${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  }

  return (
    <div className="animate-page-in">
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center px-10 overflow-hidden">
        {/* Background overlay */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[rgba(10,10,10,1)] via-[rgba(10,10,10,0.7)] to-[rgba(10,10,10,0.15)]" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[rgba(10,10,10,0.5)] via-transparent to-[rgba(10,10,10,0.5)]" />

        {/* Dartboard */}
        <Dartboard />

        {/* Content */}
        <div className="relative z-[1] max-w-[620px] animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.4)] rounded-full px-[14px] py-[5px] text-[0.72rem] font-bold tracking-[1.5px] uppercase text-[#e8220a] mb-6">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
            </svg>
            Tournois de fléchettes
          </div>
          <h1 className="font-barlow-condensed font-black text-[clamp(3rem,6vw,5rem)] leading-[1.0] mb-5 uppercase tracking-tight">
            Trouvez votre<br />
            <span className="text-[#e8220a]">prochain tournoi</span>
          </h1>
          <p className="text-[1rem] text-[#aaa] leading-[1.7] mb-9 max-w-[480px]">
            Tous les tournois de fléchettes en France réunis sur une seule plateforme. Cherchez, trouvez et inscrivez-vous en quelques clics.
          </p>
          <div className="flex gap-[10px]">
            <input
              ref={searchRef}
              className="flex-1 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] rounded-[10px] px-[18px] py-[13px] text-white font-barlow text-[0.95rem] outline-none transition-colors focus:border-[rgba(232,34,10,0.5)] placeholder:text-[#555]"
              type="text"
              placeholder="Ville, tournoi, région..."
              onKeyDown={(e) => e.key === "Enter" && heroSearch()}
            />
            <button
              onClick={heroSearch}
              className="bg-[#e8220a] text-white font-barlow-condensed font-bold text-[1rem] px-[26px] py-[13px] rounded-[10px] flex items-center gap-2 transition-all shadow-red-glow-lg hover:bg-[#b81a08] whitespace-nowrap"
            >
              Chercher
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="bg-[#111] border-t border-b border-[rgba(255,255,255,0.08)] px-10 py-8 flex justify-center">
        <div className="flex-1 max-w-[280px] text-center px-8 border-r border-[rgba(255,255,255,0.08)]">
          <div className="font-barlow-condensed text-[2.8rem] font-black text-[#e8220a] leading-none mb-1">{MOCK_TOURNAMENTS.length}</div>
          <div className="text-[0.85rem] text-[#777] font-medium">Tournois</div>
        </div>
        <div className="flex-1 max-w-[280px] text-center px-8 border-r border-[rgba(255,255,255,0.08)]">
          <div className="font-barlow-condensed text-[2.8rem] font-black text-[#e8220a] leading-none mb-1">{totalRegions}</div>
          <div className="text-[0.85rem] text-[#777] font-medium">Régions</div>
        </div>
        <div className="flex-1 max-w-[280px] text-center px-8">
          <div className="font-barlow-condensed text-[2.8rem] font-black text-[#e8220a] leading-none mb-1">{totalPlayers}</div>
          <div className="text-[0.85rem] text-[#777] font-medium">Joueurs inscrits</div>
        </div>
      </div>

      {/* ── MAIN SECTION ── */}
      <div className="py-14 px-10 max-w-[1200px] mx-auto">
        {/* Quick nav cards */}
        <div className="grid grid-cols-3 gap-4 mb-14 reveal">
          <Link href="/tournois" className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] px-6 py-5 flex items-center gap-4 no-underline text-white transition-all hover:border-[rgba(232,34,10,0.35)] hover:bg-[rgba(232,34,10,0.05)] hover:-translate-y-[2px] group">
            <div className="w-11 h-11 rounded-[10px] flex items-center justify-center text-[1.3rem] shrink-0 bg-[rgba(232,34,10,0.15)]">📅</div>
            <div>
              <h3 className="font-barlow-condensed font-bold text-[1.05rem] mb-[2px]">Tous les tournois</h3>
              <p className="text-[0.8rem] text-[#777]">Parcourir les événements</p>
            </div>
            <span className="ml-auto text-[#777] text-[1.1rem] transition-all group-hover:translate-x-1 group-hover:text-[#e8220a]">→</span>
          </Link>
          <Link href="/auth" className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] px-6 py-5 flex items-center gap-4 no-underline text-white transition-all hover:border-[rgba(232,34,10,0.35)] hover:bg-[rgba(232,34,10,0.05)] hover:-translate-y-[2px] group">
            <div className="w-11 h-11 rounded-[10px] flex items-center justify-center text-[1.3rem] shrink-0 bg-[rgba(34,197,94,0.12)]">🏆</div>
            <div>
              <h3 className="font-barlow-condensed font-bold text-[1.05rem] mb-[2px]">Mes inscriptions</h3>
              <p className="text-[0.8rem] text-[#777]">Suivre mes tournois</p>
            </div>
            <span className="ml-auto text-[#777] text-[1.1rem] transition-all group-hover:translate-x-1 group-hover:text-[#e8220a]">→</span>
          </Link>
          <Link href="/tournois/creer" className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] px-6 py-5 flex items-center gap-4 no-underline text-white transition-all hover:border-[rgba(232,34,10,0.35)] hover:bg-[rgba(232,34,10,0.05)] hover:-translate-y-[2px] group">
            <div className="w-11 h-11 rounded-[10px] flex items-center justify-center text-[1.3rem] shrink-0 bg-[rgba(255,140,0,0.12)]">➕</div>
            <div>
              <h3 className="font-barlow-condensed font-bold text-[1.05rem] mb-[2px]">Créer un tournoi</h3>
              <p className="text-[0.8rem] text-[#777]">Publier mon événement</p>
            </div>
            <span className="ml-auto text-[#777] text-[1.1rem] transition-all group-hover:translate-x-1 group-hover:text-[#e8220a]">→</span>
          </Link>
        </div>

        {/* Upcoming tournaments */}
        <div className="reveal">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-barlow-condensed font-extrabold text-[1.8rem] uppercase tracking-[0.5px]">Prochains tournois</h2>
            <Link href="/tournois" className="text-[0.85rem] text-[#e8220a] no-underline font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              Voir tout →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {upcoming.map((t, i) => (
              <TournamentCard
                key={t.id}
                nom={t.nom}
                ville={t.ville}
                region={t.region}
                date_tournoi={t.date_tournoi}
                format={t.format}
                nb_joueurs={t.nb_joueurs}
                players={t.players}
                prize={t.prize}
                statut={t.statut}
                delay={i}
              />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
