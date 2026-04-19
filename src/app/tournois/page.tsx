"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Target, AlertTriangle } from "lucide-react";
import TournamentCard from "@/components/TournamentCard";
import TournamentRow from "@/components/TournamentRow";
import { createClient } from "@/lib/supabase";
import { Tournament, REGIONS } from "@/lib/types";

export const runtime = "edge";

const PER_PAGE = 9;

export default function TournoisPage() {
  return (
    <Suspense fallback={
      <div className="animate-page-in">
        <div className="pt-[88px] px-4 sm:px-6 lg:px-10 bg-gradient-to-b from-[rgba(232,34,10,0.04)] to-transparent border-b border-[rgba(255,255,255,0.08)]">
          <div className="max-w-[1200px] mx-auto pb-6">
            <div className="font-barlow-condensed font-black text-[1.5rem] xs:text-[1.8rem] sm:text-[2.4rem] uppercase tracking-[0.5px]">Tous les tournois</div>
            <div className="text-[0.85rem] xs:text-[0.88rem] text-[#555] mt-1">Chargement...</div>
          </div>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-[3px] border-[rgba(232,34,10,0.3)] border-t-[#e8220a] rounded-full animate-spin" />
        </div>
      </div>
    }>
      <TournoisContent />
    </Suspense>
  );
}

function TournoisContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const supabase = createClient();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [search, setSearch] = useState(initialQ);
  const [typeFilter, setTypeFilter] = useState("");
  const [region, setRegion] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sort, setSort] = useState("date");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Tournament | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Inscriptions
  const [inscriptionCounts, setInscriptionCounts] = useState<Record<string, number>>({});
  const [myInscriptions, setMyInscriptions] = useState<Set<string>>(new Set());
  const [registerLoadingId, setRegisterLoadingId] = useState<string | null>(null);

  // Ratings
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({});

  useEffect(() => {
    async function init() {
      try {
        const [{ data: { session } }, { data }] = await Promise.all([
          supabase.auth.getSession(),
          supabase.from("tournois").select("*").order("date_tournoi", { ascending: true }),
        ]);
        const userId = session?.user?.id || null;
        if (userId) setCurrentUserId(userId);
        if (data) setTournaments(data);

        // Fetch inscription counts per tournament
        const { data: counts } = await supabase
          .from("inscriptions")
          .select("tournoi_id");
        if (counts) {
          const map: Record<string, number> = {};
          counts.forEach((row: { tournoi_id: string }) => {
            map[row.tournoi_id] = (map[row.tournoi_id] || 0) + 1;
          });
          setInscriptionCounts(map);
        }

        // Fetch ratings aggregated per tournament
        const { data: avisRows } = await supabase
          .from("avis")
          .select("tournoi_id, note");
        if (avisRows) {
          const agg: Record<string, { sum: number; count: number }> = {};
          avisRows.forEach((a: { tournoi_id: string; note: number }) => {
            if (!agg[a.tournoi_id]) agg[a.tournoi_id] = { sum: 0, count: 0 };
            agg[a.tournoi_id].sum += a.note;
            agg[a.tournoi_id].count += 1;
          });
          const ratingsMap: Record<string, { avg: number; count: number }> = {};
          for (const tid in agg) {
            ratingsMap[tid] = {
              avg: Math.round((agg[tid].sum / agg[tid].count) * 10) / 10,
              count: agg[tid].count,
            };
          }
          setRatings(ratingsMap);
        }

        // Fetch current user's inscriptions
        if (userId) {
          const { data: myRegs } = await supabase
            .from("inscriptions")
            .select("tournoi_id")
            .eq("user_id", userId);
          if (myRegs) {
            setMyInscriptions(new Set(myRegs.map((r: { tournoi_id: string }) => r.tournoi_id)));
          }
        }
      } catch {
        // Supabase unavailable — show empty state
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset page on filter change
  useEffect(() => setPage(1), [search, typeFilter, region, dateFilter, sort]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("tournois").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      alert("Erreur lors de la suppression : " + error.message);
    } else {
      setTournaments((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  }

  async function handleToggleRegister(tournoiId: string) {
    if (!currentUserId) return;
    setRegisterLoadingId(tournoiId);
    const isRegistered = myInscriptions.has(tournoiId);

    if (isRegistered) {
      const { error } = await supabase
        .from("inscriptions")
        .delete()
        .eq("user_id", currentUserId)
        .eq("tournoi_id", tournoiId);
      if (!error) {
        setMyInscriptions((prev) => { const s = new Set(prev); s.delete(tournoiId); return s; });
        setInscriptionCounts((prev) => ({ ...prev, [tournoiId]: Math.max((prev[tournoiId] || 1) - 1, 0) }));
      }
    } else {
      const { error } = await supabase
        .from("inscriptions")
        .insert([{ user_id: currentUserId, tournoi_id: tournoiId }]);
      if (!error) {
        setMyInscriptions((prev) => new Set(prev).add(tournoiId));
        setInscriptionCounts((prev) => ({ ...prev, [tournoiId]: (prev[tournoiId] || 0) + 1 }));
      }
    }
    setRegisterLoadingId(null);
  }

  const filtered = useMemo(() => {
    let data = [...tournaments];
    const q = search.toLowerCase();
    const now = new Date();

    if (q) data = data.filter((t) => t.nom.toLowerCase().includes(q) || t.ville.toLowerCase().includes(q) || t.region.toLowerCase().includes(q));
    if (typeFilter) data = data.filter((t) => t.type_jeu === typeFilter);
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
    else if (sort === "prize") data.sort((a, b) => (b.prize ?? 0) - (a.prize ?? 0));
    else if (sort === "places") data.sort((a, b) => (a.nb_joueurs - (a.players ?? 0)) - (b.nb_joueurs - (b.players ?? 0)));

    return data;
  }, [tournaments, search, typeFilter, region, dateFilter, sort]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const hasFilters = search || typeFilter || region || dateFilter;

  function resetFilters() {
    setSearch("");
    setTypeFilter("");
    setRegion("");
    setDateFilter("");
  }

  return (
    <div className="animate-page-in">
      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(0,0,0,0.7)] backdrop-blur-sm px-4">
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[18px] p-6 sm:p-8 max-w-[440px] w-full animate-fade-up">
            <div className="text-center mb-6">
              <AlertTriangle className="w-12 h-12 text-[#f59e0b] mx-auto mb-3" />
              <div className="font-barlow-condensed font-black text-[1.4rem] uppercase mb-2">Supprimer ce tournoi ?</div>
              <div className="text-[0.88rem] text-[#777]">
                Tu es sur le point de supprimer <strong className="text-white">&quot;{deleteTarget.nom}&quot;</strong>. Cette action est irréversible.
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-3 rounded-[10px] font-barlow-condensed font-bold text-[0.95rem] cursor-pointer bg-transparent text-white border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-[10px] font-barlow-condensed font-bold text-[0.95rem] cursor-pointer border-none bg-[#dc2626] text-white hover:bg-[#b91c1c] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting ? <div className="spinner" /> : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="pt-[80px] xs:pt-[88px] px-3 xs:px-4 sm:px-6 lg:px-10 bg-gradient-to-b from-[rgba(232,34,10,0.04)] to-transparent border-b border-[rgba(255,255,255,0.08)]">
        <div className="max-w-[1200px] xl:max-w-[1400px] mx-auto pb-6">
          <div className="font-barlow-condensed font-black text-[1.5rem] xs:text-[1.8rem] sm:text-[2.4rem] uppercase tracking-[0.5px]">Tous les tournois</div>
          <div className="text-[0.88rem] text-[#777] mt-1">
            {loading ? (
              <span className="text-[#555]">Chargement...</span>
            ) : (
              <><span className="text-[#e8220a] font-bold">{filtered.length}</span> tournois trouvés</>
            )}
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="px-3 xs:px-4 sm:px-6 lg:px-10 py-3 sm:py-[1.2rem] border-b border-[rgba(255,255,255,0.08)] bg-[#111] sticky top-[56px] xs:top-[60px] z-50">
        <div className="max-w-[1200px] xl:max-w-[1400px] mx-auto flex flex-col sm:flex-row gap-2 sm:gap-[10px] sm:items-center sm:flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-0 sm:min-w-[220px]">
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

          {/* Type + Region + Date filters */}
          <div className="flex flex-col xs:flex-row gap-2 sm:gap-[10px] flex-wrap">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="flex-1 sm:flex-none !bg-[#181818] !rounded-[10px] !px-3 sm:!px-[14px] !py-[10px] !text-[0.82rem] xs:!text-[0.85rem] sm:!text-[0.88rem] !w-auto">
              <option value="">Tous les types</option>
              <option value="traditionnel">Traditionnel</option>
              <option value="electronique">Électronique</option>
            </select>

            <select value={region} onChange={(e) => setRegion(e.target.value)} className="flex-1 sm:flex-none !bg-[#181818] !rounded-[10px] !px-3 sm:!px-[14px] !py-[10px] !text-[0.82rem] xs:!text-[0.85rem] sm:!text-[0.88rem] !w-auto">
              <option value="">Toutes les régions</option>
              {REGIONS.map((r) => <option key={r}>{r}</option>)}
            </select>

            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="flex-1 sm:flex-none !bg-[#181818] !rounded-[10px] !px-3 sm:!px-[14px] !py-[10px] !text-[0.82rem] xs:!text-[0.85rem] sm:!text-[0.88rem] !w-auto">
              <option value="">Toutes les dates</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois-ci</option>
              <option value="next">3 prochains mois</option>
            </select>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:ml-auto">
            {hasFilters && (
              <button onClick={resetFilters} className="bg-transparent border-none text-[#777] text-[0.8rem] cursor-pointer">
                ✕ Réinitialiser
              </button>
            )}
            {/* View switch - hidden on mobile (always grid) */}
            <div className="hidden md:flex bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-lg overflow-hidden ml-auto md:ml-0">
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
      <div className="max-w-[1200px] xl:max-w-[1400px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-10 py-5 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-[3px] border-[rgba(232,34,10,0.3)] border-t-[#e8220a] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Sort bar */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-[0.82rem] text-[#777]">{filtered.length} tournoi{filtered.length > 1 ? "s" : ""}</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="!bg-transparent !border-none !text-[#777] !text-[0.82rem] !w-auto !p-0 cursor-pointer">
                <option value="date">Trier par date</option>
                <option value="prize">Trier par dotation</option>
                <option value="places">Trier par places restantes</option>
              </select>
            </div>

            {/* Grid view (always on mobile, toggle on desktop) */}
            {(view === "grid" || typeof window !== "undefined") && filtered.length > 0 && (
              <div className={`${view === "list" ? "hidden sm:hidden lg:hidden" : ""}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4">
                  {paged.map((t, i) => {
                    const tid = String(t.id);
                    return (
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
                        players={inscriptionCounts[tid] ?? t.players ?? 0}
                        prize={t.prize ?? 0}
                        statut={t.statut}
                        delay={i}
                        isOwner={!!currentUserId && t.user_id === currentUserId}
                        onDelete={() => setDeleteTarget(t)}
                        isRegistered={myInscriptions.has(tid)}
                        onToggleRegister={currentUserId ? () => handleToggleRegister(tid) : undefined}
                        registerLoading={registerLoadingId === tid}
                        currentUserId={currentUserId}
                        avgRating={ratings[tid]?.avg ?? 0}
                        ratingCount={ratings[tid]?.count ?? 0}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mobile cards fallback when list view is selected */}
            {view === "list" && filtered.length > 0 && (
              <>
                {/* Cards for mobile */}
                <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                  {paged.map((t, i) => {
                    const tid = String(t.id);
                    return (
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
                        players={inscriptionCounts[tid] ?? t.players ?? 0}
                        prize={t.prize ?? 0}
                        statut={t.statut}
                        delay={i}
                        isOwner={!!currentUserId && t.user_id === currentUserId}
                        onDelete={() => setDeleteTarget(t)}
                        isRegistered={myInscriptions.has(tid)}
                        onToggleRegister={currentUserId ? () => handleToggleRegister(tid) : undefined}
                        registerLoading={registerLoadingId === tid}
                        currentUserId={currentUserId}
                        avgRating={ratings[tid]?.avg ?? 0}
                        ratingCount={ratings[tid]?.count ?? 0}
                      />
                    );
                  })}
                </div>
                {/* List rows for tablet+ */}
                <div className="hidden md:flex flex-col gap-[10px]">
                  <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_auto] gap-3 lg:gap-4 px-3 lg:px-[1.4rem] text-[0.72rem] font-bold uppercase tracking-[1px] text-[#777]">
                    <div>Tournoi</div><div>Date</div><div>Région</div><div>Dotation</div><div>Joueurs</div><div></div>
                  </div>
                  {paged.map((t, i) => {
                    const tid = String(t.id);
                    return (
                      <TournamentRow
                        key={t.id}
                        id={t.id}
                        nom={t.nom}
                        ville={t.ville}
                        region={t.region}
                        date_tournoi={t.date_tournoi}
                        format={t.format}
                        type_jeu={t.type_jeu}
                        nb_joueurs={t.nb_joueurs}
                        players={inscriptionCounts[tid] ?? t.players ?? 0}
                        prize={t.prize ?? 0}
                        statut={t.statut}
                        delay={i}
                        isOwner={!!currentUserId && t.user_id === currentUserId}
                        onDelete={() => setDeleteTarget(t)}
                        isRegistered={myInscriptions.has(tid)}
                        onToggleRegister={currentUserId ? () => handleToggleRegister(tid) : undefined}
                        registerLoading={registerLoadingId === tid}
                        currentUserId={currentUserId}
                        avgRating={ratings[tid]?.avg ?? 0}
                        ratingCount={ratings[tid]?.count ?? 0}
                      />
                    );
                  })}
                </div>
              </>
            )}

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-[#777]">
                <Target className="w-12 h-12 text-[#777] mx-auto mb-4 opacity-40" />
                <div className="font-barlow-condensed font-extrabold text-[1.4rem] text-[#666] mb-2">
                  {hasFilters ? "Aucun tournoi trouvé" : "Aucun tournoi pour le moment"}
                </div>
                <div className="text-[0.88rem]">
                  {hasFilters ? "Essaie de modifier tes critères de recherche" : "Les tournois apparaîtront ici dès qu'ils seront publiés"}
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-[6px] mt-8 sm:mt-10 flex-wrap">
                {page > 1 && (
                  <button onClick={() => { setPage(page - 1); window.scrollTo({ top: 200, behavior: "smooth" }); }} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#141414] text-[#777] text-[0.85rem] cursor-pointer flex items-center justify-center transition-all hover:bg-[#e8220a] hover:text-white hover:border-[#e8220a] font-barlow">
                    ‹
                  </button>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => { setPage(p); window.scrollTo({ top: 200, behavior: "smooth" }); }}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border text-[0.85rem] cursor-pointer flex items-center justify-center transition-all font-barlow ${p === page ? "bg-[#e8220a] text-white border-[#e8220a]" : "border-[rgba(255,255,255,0.08)] bg-[#141414] text-[#777] hover:bg-[#e8220a] hover:text-white hover:border-[#e8220a]"}`}
                  >
                    {p}
                  </button>
                ))}
                {page < totalPages && (
                  <button onClick={() => { setPage(page + 1); window.scrollTo({ top: 200, behavior: "smooth" }); }} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#141414] text-[#777] text-[0.85rem] cursor-pointer flex items-center justify-center transition-all hover:bg-[#e8220a] hover:text-white hover:border-[#e8220a] font-barlow">
                    ›
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
