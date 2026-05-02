"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Target, Calendar, Trophy, Plus, ArrowRight } from "lucide-react";
import TournamentCard from "@/components/TournamentCard";
import CarouselActu from "@/components/CarouselActu";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase";
import { Tournament } from "@/lib/types";
import type { CarouselSlide } from "@/components/CarouselActu";

export const runtime = "edge";

export default function HomePage() {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [inscriptionsCount, setInscriptionsCount] = useState(0);
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>([]);

  useEffect(() => {
    const supabase = createClient();

    async function fetchAll() {
      try {
        const [{ data: tournoiData }, { count }, { data: carouselData }] = await Promise.all([
          supabase.from("tournois").select("*").order("date_tournoi", { ascending: true }),
          supabase.from("inscriptions").select("id", { count: "exact", head: true }),
          supabase.from("carousel").select("id, url, titre, description").eq("actif", true).order("ordre", { ascending: true }),
        ]);
        if (tournoiData) setTournaments(tournoiData);
        setInscriptionsCount(count ?? 0);
        if (carouselData) setCarouselSlides(carouselData);
      } catch {
        // Supabase unavailable — show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchAll();

    // Realtime : mise à jour dès qu'un joueur s'inscrit ou se désinscrit
    const channel = supabase
      .channel("inscriptions-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "inscriptions" }, () => {
        supabase
          .from("inscriptions")
          .select("id", { count: "exact", head: true })
          .then(({ count }) => setInscriptionsCount(count ?? 0));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Stats
  const totalRegions = [...new Set(tournaments.map((t) => t.region))].length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = tournaments
    .filter((t) => new Date(t.date_tournoi) >= today)
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
  }, [loading]);

  function heroSearch() {
    const q = searchRef.current?.value || "";
    router.push(`/tournois${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  }

  return (
    <div className="animate-page-in">
      {/* ── HERO ── */}
      <section className="relative min-h-[70vh] xs:min-h-[75vh] sm:min-h-[80vh] lg:min-h-screen flex items-center px-3 xs:px-4 sm:px-6 lg:px-10 overflow-hidden bg-[#080808]">
        {/* Radial red glow */}
        <div className="absolute inset-0 z-0" style={{ background: "radial-gradient(ellipse 60% 70% at 75% 50%, rgba(232,34,10,0.07), transparent)" }} />

        {/* Horizontal red accent line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px z-[2] bg-[rgba(232,34,10,0.15)]" />

        {/* Content — 2 colonnes sur grand écran */}
        <div className="relative z-[1] w-full max-w-[1280px] mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-14 xl:gap-20 pt-[80px] xs:pt-[70px] sm:pt-10 lg:pt-0 pb-6 lg:pb-0">

          {/* Gauche : texte + recherche */}
          <div className="flex-1 min-w-0 max-w-[580px] animate-fade-up">
            <div className="inline-flex items-center gap-2 bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.4)] rounded-full px-3 sm:px-[14px] py-[5px] text-[0.62rem] xs:text-[0.65rem] sm:text-[0.72rem] font-bold tracking-[1.5px] uppercase text-[#b91c0a] mb-4 sm:mb-6">
              <Target className="w-[14px] h-[14px]" />
              Tournois de fléchettes
            </div>
            <h1 className="font-barlow-condensed font-black text-[1.8rem] xs:text-[2.2rem] sm:text-[clamp(2.8rem,5vw,4rem)] lg:text-[clamp(2.6rem,4.5vw,3.8rem)] xl:text-[clamp(3rem,5vw,4.4rem)] leading-[1.0] mb-4 sm:mb-5 uppercase tracking-tight">
              Trouvez votre<br />
              <span className="text-[#b91c0a]">prochain tournoi</span>
            </h1>
            <p className="text-[0.85rem] xs:text-[0.9rem] sm:text-[1rem] text-[#aaa] leading-[1.7] mb-6 sm:mb-9 max-w-[480px]">
              Tous les tournois de fléchettes en France réunis sur une seule plateforme. Cherchez, trouvez et inscrivez-vous en quelques clics.
            </p>
            <div className="flex gap-[10px] flex-col sm:flex-row">
              <input
                ref={searchRef}
                className="flex-1 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] rounded-[10px] px-3 xs:px-[18px] py-[11px] xs:py-[13px] text-white font-barlow text-[0.9rem] xs:text-[0.95rem] outline-none transition-colors focus:border-[rgba(232,34,10,0.5)] placeholder:text-[#555]"
                type="text"
                placeholder="Ville, tournoi, région..."
                onKeyDown={(e) => e.key === "Enter" && heroSearch()}
              />
              <button
                onClick={heroSearch}
                className="bg-[#b91c0a] text-white font-barlow-condensed font-bold text-[0.95rem] xs:text-[1rem] px-[18px] xs:px-[26px] py-[11px] xs:py-[13px] rounded-[10px] flex items-center justify-center gap-2 transition-all shadow-red-glow-lg hover:bg-[#b81a08] whitespace-nowrap"
              >
                Chercher
                <ArrowRight className="w-[14px] h-[14px]" />
              </button>
            </div>
          </div>

          {/* Droite : carousel actualités */}
          <div
            className="w-full lg:flex-1 lg:max-w-[540px] xl:max-w-[580px] animate-fade-up"
            style={{ animationDelay: "0.12s" }}
          >
            <CarouselActu slides={carouselSlides} />
          </div>

        </div>
      </section>

      {/* ── STATS ── */}
      <div className="bg-[#111] border-t border-b border-[rgba(255,255,255,0.08)] px-3 xs:px-4 sm:px-6 lg:px-10 py-5 sm:py-8 flex justify-center">
        <div className="flex flex-col sm:flex-row w-full max-w-[840px]">
          <div className="flex-1 text-center px-3 xs:px-4 sm:px-8 py-2 sm:py-0 border-b sm:border-b-0 sm:border-r border-[rgba(255,255,255,0.08)] last:border-0">
            <div className="font-barlow-condensed text-[1.8rem] xs:text-[2.2rem] sm:text-[2.8rem] xl:text-[3.2rem] font-black text-[#b91c0a] leading-none mb-1">{tournaments.length}</div>
            <div className="text-[0.82rem] xs:text-[0.85rem] text-[#777] font-medium">Tournois</div>
          </div>
          <div className="flex-1 text-center px-3 xs:px-4 sm:px-8 py-2 sm:py-0 border-b sm:border-b-0 sm:border-r border-[rgba(255,255,255,0.08)] last:border-0">
            <div className="font-barlow-condensed text-[1.8rem] xs:text-[2.2rem] sm:text-[2.8rem] xl:text-[3.2rem] font-black text-[#b91c0a] leading-none mb-1">{totalRegions}</div>
            <div className="text-[0.82rem] xs:text-[0.85rem] text-[#777] font-medium">Régions</div>
          </div>
          <div className="flex-1 text-center px-3 xs:px-4 sm:px-8 py-2 sm:py-0">
            <div className="font-barlow-condensed text-[1.8rem] xs:text-[2.2rem] sm:text-[2.8rem] xl:text-[3.2rem] font-black text-[#b91c0a] leading-none mb-1">{inscriptionsCount}</div>
            <div className="text-[0.82rem] xs:text-[0.85rem] text-[#777] font-medium">Joueurs inscrits</div>
          </div>
        </div>
      </div>

      {/* ── MAIN SECTION ── */}
      <div className="py-8 sm:py-14 px-3 xs:px-4 sm:px-6 lg:px-10 max-w-[1200px] xl:max-w-[1400px] mx-auto">
        {/* Quick nav cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-14 reveal">
          <Link href="/tournois" className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] px-4 xs:px-5 sm:px-6 py-3 xs:py-4 sm:py-5 flex items-center gap-3 xs:gap-4 no-underline text-white transition-all hover:border-[rgba(232,34,10,0.35)] hover:bg-[rgba(232,34,10,0.05)] hover:-translate-y-[2px] group">
            <div className="w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 rounded-[10px] flex items-center justify-center shrink-0 bg-[rgba(232,34,10,0.15)]"><Calendar className="w-5 h-5 text-[#b91c0a]" /></div>
            <div>
              <h3 className="font-barlow-condensed font-bold text-[1rem] sm:text-[1.05rem] mb-[2px]">Tous les tournois</h3>
              <p className="text-[0.8rem] text-[#777]">Parcourir les événements</p>
            </div>
            <span className="ml-auto text-[#777] text-[1.1rem] transition-all group-hover:translate-x-1 group-hover:text-[#b91c0a]">→</span>
          </Link>
          <Link href="/inscriptions" className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] px-4 xs:px-5 sm:px-6 py-3 xs:py-4 sm:py-5 flex items-center gap-3 xs:gap-4 no-underline text-white transition-all hover:border-[rgba(232,34,10,0.35)] hover:bg-[rgba(232,34,10,0.05)] hover:-translate-y-[2px] group">
            <div className="w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 rounded-[10px] flex items-center justify-center shrink-0 bg-[rgba(34,197,94,0.12)]"><Trophy className="w-5 h-5 text-[#22c55e]" /></div>
            <div>
              <h3 className="font-barlow-condensed font-bold text-[1rem] sm:text-[1.05rem] mb-[2px]">Mes inscriptions</h3>
              <p className="text-[0.8rem] text-[#777]">Suivre mes tournois</p>
            </div>
            <span className="ml-auto text-[#777] text-[1.1rem] transition-all group-hover:translate-x-1 group-hover:text-[#b91c0a]">→</span>
          </Link>
          <Link href="/tournois/creer" className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] px-4 xs:px-5 sm:px-6 py-3 xs:py-4 sm:py-5 flex items-center gap-3 xs:gap-4 no-underline text-white transition-all hover:border-[rgba(232,34,10,0.35)] hover:bg-[rgba(232,34,10,0.05)] hover:-translate-y-[2px] group sm:col-span-2 md:col-span-1">
            <div className="w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 rounded-[10px] flex items-center justify-center shrink-0 bg-[rgba(255,140,0,0.12)]"><Plus className="w-5 h-5 text-[#ff8c00]" /></div>
            <div>
              <h3 className="font-barlow-condensed font-bold text-[1rem] sm:text-[1.05rem] mb-[2px]">Créer un tournoi</h3>
              <p className="text-[0.8rem] text-[#777]">Publier mon événement</p>
            </div>
            <span className="ml-auto text-[#777] text-[1.1rem] transition-all group-hover:translate-x-1 group-hover:text-[#b91c0a]">→</span>
          </Link>
        </div>

        {/* Upcoming tournaments */}
        <div className="reveal">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-barlow-condensed font-extrabold text-[1.2rem] xs:text-[1.4rem] sm:text-[1.8rem] uppercase tracking-[0.5px]">Prochains tournois</h2>
            <Link href="/tournois" className="text-[0.85rem] text-[#b91c0a] no-underline font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              Voir tout →
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-[3px] border-[rgba(232,34,10,0.3)] border-t-[#b91c0a] rounded-full animate-spin" />
            </div>
          ) : upcoming.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map((t, i) => (
                <TournamentCard
                  key={t.id}
                  id={t.id}
                  nom={t.nom}
                  ville={t.ville}
                  region={t.region}
                  date_tournoi={t.date_tournoi}
                  format={t.format}
                  type_jeu={t.type_jeu}
                  nb_joueurs={t.nb_joueurs}
                  players={t.players ?? 0}
                  prize={t.prize ?? 0}
                  statut={t.statut}
                  delay={i}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-[#777]">
              <div className="mb-4 opacity-40"><Target className="w-12 h-12 mx-auto text-[#777]" /></div>
              <div className="font-barlow-condensed font-extrabold text-[1.4rem] text-[#666] mb-2">Aucun tournoi pour le moment</div>
              <div className="text-[0.88rem]">Les tournois apparaîtront ici dès qu&apos;ils seront publiés</div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
