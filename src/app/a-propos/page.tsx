"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, FileText, Target } from "lucide-react";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase";

export const runtime = "edge";

export default function AProposPage() {
  const [stats, setStats] = useState({ tournois: 0, regions: 0, joueurs: 0 });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: tournois } = await supabase.from("tournois").select("region");
      const { data: inscriptions } = await supabase.from("inscriptions").select("user_id");

      const regions = new Set((tournois || []).map((t: { region: string }) => t.region));
      const joueurs = new Set((inscriptions || []).map((i: { user_id: string }) => i.user_id));

      setStats({
        tournois: tournois?.length || 0,
        regions: regions.size,
        joueurs: joueurs.size,
      });
    }
    load();
  }, []);

  const steps = [
    { icon: <Search className="w-7 h-7" />, emoji: "🔍", title: "Cherchez un tournoi", desc: "Trouvez un tournoi près de chez vous grâce à nos filtres par région, format et date." },
    { icon: <FileText className="w-7 h-7" />, emoji: "📝", title: "Inscrivez-vous", desc: "Inscrivez-vous en quelques clics. Recevez une confirmation par email." },
    { icon: <Target className="w-7 h-7" />, emoji: "🎯", title: "Participez et notez", desc: "Participez au tournoi puis donnez votre avis pour aider la communauté." },
  ];

  const chiffres = [
    { value: stats.tournois, label: "Tournois créés" },
    { value: stats.regions, label: "Régions couvertes" },
    { value: stats.joueurs, label: "Joueurs inscrits" },
  ];

  return (
    <div className="animate-page-in min-h-screen flex flex-col">
      <div className="flex-1 pt-[72px] xs:pt-[80px] px-3 xs:px-4 sm:px-6 pb-10 sm:pb-16">
        <div className="max-w-[820px] mx-auto">

          {/* Hero */}
          <div className="text-center mb-12 sm:mb-16 pt-6 sm:pt-10">
            <h1 className="font-barlow-condensed font-black text-[1.8rem] xs:text-[2.2rem] sm:text-[3rem] uppercase leading-[1.1] mb-4">
              À propos de <span className="text-[#e8220a]">DartsTournois</span>
            </h1>
            <p className="text-[0.95rem] sm:text-[1.05rem] text-[#999] max-w-[560px] mx-auto leading-[1.7]">
              La plateforme qui connecte les joueurs de fléchettes à travers toute la France.
            </p>
          </div>

          {/* Notre mission */}
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-6 sm:p-8 mb-6 sm:mb-8">
            <h2 className="font-barlow-condensed font-extrabold text-[1.2rem] sm:text-[1.4rem] uppercase mb-4">Notre mission</h2>
            <p className="text-[0.9rem] sm:text-[0.95rem] text-[#ccc] leading-[1.8]">
              DartsTournois est né d&apos;un constat simple : il n&apos;existait pas de plateforme centralisée pour retrouver tous les tournois de fléchettes en France. Que vous soyez un joueur de fléchettes traditionnelles ou électroniques, débutant ou compétiteur, notre objectif est de vous permettre de trouver, créer et gérer des tournois facilement.
            </p>
            <p className="text-[0.9rem] sm:text-[0.95rem] text-[#ccc] leading-[1.8] mt-4">
              Nous croyons que les fléchettes méritent une communauté unie et connectée. DartsTournois est l&apos;outil qui rend cela possible.
            </p>
          </div>

          {/* Comment ça marche */}
          <div className="mb-6 sm:mb-8">
            <h2 className="font-barlow-condensed font-extrabold text-[1.2rem] sm:text-[1.4rem] uppercase mb-6 text-center">Comment ça marche</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              {steps.map((step, i) => (
                <div key={i} className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-5 sm:p-6 text-center">
                  <div className="text-[2.4rem] mb-3">{step.emoji}</div>
                  <div className="font-barlow-condensed font-bold text-[1rem] sm:text-[1.05rem] uppercase mb-2">{step.title}</div>
                  <p className="text-[0.82rem] sm:text-[0.85rem] text-[#999] leading-[1.6]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chiffres clés */}
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-6 sm:p-8 mb-8 sm:mb-10">
            <h2 className="font-barlow-condensed font-extrabold text-[1.2rem] sm:text-[1.4rem] uppercase mb-6 text-center">Chiffres clés</h2>
            <div className="grid grid-cols-3 gap-4">
              {chiffres.map((c, i) => (
                <div key={i} className="text-center">
                  <div className="font-barlow-condensed font-black text-[2rem] sm:text-[2.8rem] text-[#e8220a] leading-none">{c.value}</div>
                  <div className="text-[0.78rem] sm:text-[0.85rem] text-[#777] mt-1">{c.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/tournois"
              className="inline-flex items-center gap-2 bg-[#e8220a] text-white border-none font-barlow-condensed font-bold text-[1rem] px-8 py-3 rounded-[10px] no-underline transition-all shadow-red-glow-lg hover:bg-[#b81a08]"
            >
              Voir les tournois
            </Link>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
