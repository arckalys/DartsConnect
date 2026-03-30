"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import TournamentCard from "@/components/TournamentCard";
import TournamentRow from "@/components/TournamentRow";
import { MOCK_TOURNAMENTS } from "@/lib/data";
import { REGIONS } from "@/lib/types";

export const runtime = "edge";

const PER_PAGE = 9;

export default function TournoisPage() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [search, setSearch] = useState(initialQ);
  const [region, setRegion] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sort, setSort] = useState("date");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  // Reset page on filter change
  useEffect(() => setPage(1), [search, region, dateFilter, sort]);

  const filtered = useMemo(() => {
    let data = [...MOCK_TOURNAMENTS];
    const q = search.toLowerCase();
    const now = new Date();

    if (q) data = data.filter((t) => t.nom.toLowerCase().includes(q) || t.ville.toLowerCase().includes(q) || t.region.toLowerCase().includes(q));
    if (region) data = data.filter((t) => t.region === region);
    if (dateFilter === "week") {
      const end = new Date(now); end.setDate(end.getDate() + 7);
      data = data.filter((t) => { const d = new Date(t.date_tournoi); return d >= now && d <= end; });
    } else if (dateFilter === "month") {
      data = data.filter((t) => { const d = new Date(t.date_tournoi); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    } else if (dateFilter === "next") {
      const end = new Date(now); end.setMonth(end.getMonth() + 3);
      data = data.filter((t) => { const d = new Date(t.date_tournoi); return d >= now && d <= end; });
    }

    if (sort === "date") data.sort((a, b) => new Date(a.date_tournoi).getTime() - new Date(b.date_tournoi).getTime());
    else if (sort === "prize") data.sort((a, b) => b.prize - a.prize);
    else if (sort === "places") data.sort((a, b) => (a.nb_joueurs - a.players) - (b.nb_joueurs - b.players));

    return data;
  }, [search, region, dateFilter, sort]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const hasFilters = search || region || dateFilter;

  function resetFilters() {
    setSearch("");
    setRegion("");
    setDateFilter("");
  }

  return (
    <div className="animate-page-in">
      {/* Page header */}
      <div className="pt-[88px] px-10 bg-gradient-to-b from-[rgba(232,34,10,0.04)] to-transparent border-b border-[rgba(255,255,255,0.08)]">
        <div className="max-w-[1200px] mx-auto pb-6">
          <div className="font-barlow-condensed font-black text-[2.4rem] uppercase tracking-[0.5px]">Tous les tournois</div>
          <div className="text-[0.88rem] text-[#777] mt-1">
            <span className="text-[#e8220a] font-bold">{filtered.length}</span> tournois trouvés
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="px-10 py-[1.2rem] border-b border-[rgba(255,255,255,0.08)] bg-[#111] sticky top-[60px] z-50">
        <div className="max-w-[1200px] mx-auto flex gap-[10px] items-center flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full !bg-[#181818] !border-[rgba(255,255,255,0.08)] !rounded-[10px] !pl-[38px] !pr-[14px] !py-[10px] !text-[0.9rem] placeholder:!text-[#444]"
              type="text"
              placeholder="Rechercher un tournoi, une ville..."
            />
          </div>

          {/* Region filter */}
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="!bg-[#181818] !rounded-[10px] !px-[14px] !py-[10px] !text-[0.88rem] !w-auto">
            <option value="">Toutes les régions</option>
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>

          {/* Date filter */}
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="!bg-[#181818] !rounded-[10px] !px-[14px] !py-[10px] !text-[0.88rem] !w-auto">
            <option value="">Toutes les dates</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois-ci</option>
            <option value="next">3 prochains mois</option>
          </select>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto">
            {hasFilters && (
              <button onClick={resetFilters} className="bg-transparent border-none text-[#777] text-[0.8rem] cursor-pointer">
                ✕ Réinitialiser
              </button>
            )}
            {/* View switch */}
            <div className="flex bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-lg overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={`w-9 h-9 border-none cursor-pointer flex items-center justify-center transition-all ${view === "grid" ? "bg-[#e8220a] text-white" : "bg-transparent text-[#777]"}`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
              </button>
              <button
                onClick={() => setView("list")}
                className={`w-9 h-9 border-none cursor-pointer flex items-center justify-center transition-all ${view === "list" ? "bg-[#e8220a] text-white" : "bg-transparent text-[#777]"}`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-10 py-8">
        {/* Sort bar */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-[0.82rem] text-[#777]">{filtered.length} tournoi{filtered.length > 1 ? "s" : ""}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="!bg-transparent !border-none !text-[#777] !text-[0.82rem] !w-auto !p-0 cursor-pointer">
            <option value="date">Trier par date</option>
            <option value="prize">Trier par dotation</option>
            <option value="places">Trier par places restantes</option>
          </select>
        </div>

        {/* Grid view */}
        {view === "grid" && filtered.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {paged.map((t, i) => (
              <TournamentCard key={t.id} nom={t.nom} ville={t.ville} region={t.region} date_tournoi={t.date_tournoi} format={t.format} nb_joueurs={t.nb_joueurs} players={t.players} prize={t.prize} statut={t.statut} delay={i} />
            ))}
          </div>
        )}

        {/* List view */}
        {view === "list" && filtered.length > 0 && (
          <div className="flex flex-col gap-[10px]">
            <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_auto] gap-4 px-[1.4rem] text-[0.72rem] font-bold uppercase tracking-[1px] text-[#777]">
              <div>Tournoi</div><div>Date</div><div>Région</div><div>Dotation</div><div>Joueurs</div><div></div>
            </div>
            {paged.map((t, i) => (
              <TournamentRow key={t.id} nom={t.nom} ville={t.ville} region={t.region} date_tournoi={t.date_tournoi} format={t.format} nb_joueurs={t.nb_joueurs} players={t.players} prize={t.prize} statut={t.statut} delay={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-[#777]">
            <div className="text-[3rem] mb-4 opacity-40">🎯</div>
            <div className="font-barlow-condensed font-extrabold text-[1.4rem] text-[#666] mb-2">Aucun tournoi trouvé</div>
            <div className="text-[0.88rem]">Essaie de modifier tes critères de recherche</div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-[6px] mt-10">
            {page > 1 && (
              <button onClick={() => { setPage(page - 1); window.scrollTo({ top: 200, behavior: "smooth" }); }} className="w-9 h-9 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#141414] text-[#777] text-[0.85rem] cursor-pointer flex items-center justify-center transition-all hover:bg-[#e8220a] hover:text-white hover:border-[#e8220a] font-barlow">
                ‹
              </button>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => { setPage(p); window.scrollTo({ top: 200, behavior: "smooth" }); }}
                className={`w-9 h-9 rounded-lg border text-[0.85rem] cursor-pointer flex items-center justify-center transition-all font-barlow ${p === page ? "bg-[#e8220a] text-white border-[#e8220a]" : "border-[rgba(255,255,255,0.08)] bg-[#141414] text-[#777] hover:bg-[#e8220a] hover:text-white hover:border-[#e8220a]"}`}
              >
                {p}
              </button>
            ))}
            {page < totalPages && (
              <button onClick={() => { setPage(page + 1); window.scrollTo({ top: 200, behavior: "smooth" }); }} className="w-9 h-9 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#141414] text-[#777] text-[0.85rem] cursor-pointer flex items-center justify-center transition-all hover:bg-[#e8220a] hover:text-white hover:border-[#e8220a] font-barlow">
                ›
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
