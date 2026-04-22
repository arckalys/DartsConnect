import Link from "next/link";
import { Check, Pencil, Trash2, Star } from "lucide-react";
import { STATUS_LABELS } from "@/lib/types";
import type { TournamentStatus } from "@/lib/types";
import { fmtDate } from "@/lib/data";

interface Props {
  id?: string | number;
  nom: string;
  ville: string;
  region: string;
  date_tournoi: string;
  format: string;
  type_jeu?: string;
  nb_joueurs: number;
  players: number;
  prize: number;
  statut: TournamentStatus;
  delay?: number;
  isOwner?: boolean;
  onDelete?: () => void;
  isRegistered?: boolean;
  onToggleRegister?: () => void;
  registerLoading?: boolean;
  currentUserId?: string | null;
  avgRating?: number;
  ratingCount?: number;
  sessionsCount?: number;
}

const statusClass: Record<TournamentStatus, string> = {
  open: "bg-[rgba(34,197,94,0.12)] text-[#22c55e]",
  soon: "bg-[rgba(249,115,22,0.12)] text-[#f97316]",
  full: "bg-[rgba(255,255,255,0.06)] text-[#777]",
  closed: "bg-[rgba(248,113,113,0.1)] text-[#f87171]",
};

export default function TournamentCard({ id, nom, ville, region, date_tournoi, format, type_jeu, nb_joueurs, players, prize, statut, delay = 0, isOwner, onDelete, isRegistered, onToggleRegister, registerLoading, currentUserId, avgRating = 0, ratingCount = 0, sessionsCount = 1 }: Props) {
  const pct = nb_joueurs > 0 ? Math.round((players / nb_joueurs) * 100) : 0;
  const isFull = players >= nb_joueurs && !isRegistered;

  return (
    <div
      className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] overflow-hidden text-white transition-all duration-200 flex flex-col animate-fade-up hover:border-[rgba(232,34,10,0.4)] hover:-translate-y-[3px]"
      style={{ animationDelay: `${delay * 0.05}s` }}
    >
      {/* Top - clickable link to detail */}
      <Link href={id ? `/tournois/${id}` : "#"} className="no-underline text-white">
        <div className="px-3 xs:px-[1.2rem] sm:px-[1.4rem] pt-[1rem] xs:pt-[1.2rem] pb-[0.8rem] border-b border-[rgba(255,255,255,0.08)]">
          <div className="flex gap-[6px] mb-2 flex-wrap">
            <span className={`inline-block text-[0.65rem] font-bold uppercase tracking-[1px] px-[9px] py-[3px] rounded-full ${statusClass[statut]}`}>
              {STATUS_LABELS[statut]}
            </span>
            <span className="inline-block text-[0.65rem] font-bold uppercase tracking-[1px] px-[9px] py-[3px] rounded-full bg-[rgba(255,255,255,0.06)] text-[#aaa]">
              {format}
            </span>
            {type_jeu && (
              <span className={`inline-block text-[0.65rem] font-bold uppercase tracking-[1px] px-[9px] py-[3px] rounded-full ${
                type_jeu === "electronique"
                  ? "bg-[rgba(59,130,246,0.12)] text-[#3b82f6]"
                  : "bg-[rgba(168,85,247,0.12)] text-[#a855f7]"
              }`}>
                {type_jeu === "electronique" ? "Élec." : "Trad."}
              </span>
            )}
            {isRegistered && (
              <span className="inline-block text-[0.65rem] font-bold uppercase tracking-[1px] px-[9px] py-[3px] rounded-full bg-[rgba(34,197,94,0.15)] text-[#22c55e]">
                <Check className="w-3 h-3 inline -mt-[1px]" /> Inscrit
              </span>
            )}
          </div>
          <div className="flex justify-between items-start gap-2 min-w-0">
            <div className="font-barlow-condensed font-extrabold text-[0.95rem] xs:text-[1rem] sm:text-[1.05rem] leading-[1.25] min-w-0 truncate">{nom}</div>
            <div className="font-barlow-condensed font-extrabold text-[1rem] xs:text-[1.05rem] sm:text-[1.1rem] text-[#e8220a] whitespace-nowrap shrink-0">{prize}€</div>
          </div>
        </div>

        {/* Body - info */}
        <div className="px-3 xs:px-[1.2rem] sm:px-[1.4rem] py-[0.8rem] xs:py-[1rem] flex flex-col gap-[5px]">
          <div className="flex items-center gap-[7px] text-[0.8rem] text-[#777]">
            <svg className="w-[13px] h-[13px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {sessionsCount > 1 ? "Plusieurs dates" : fmtDate(date_tournoi)}
          </div>
          <div className="flex items-center gap-[7px] text-[0.8rem] text-[#777]">
            <svg className="w-[13px] h-[13px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {ville}, {region}
          </div>
          {ratingCount > 0 && (
            <div className="flex items-center gap-[6px] text-[0.8rem] text-[#f59e0b] mt-[2px]">
              <Star className="w-[13px] h-[13px] fill-[#f59e0b] text-[#f59e0b] shrink-0" />
              <span className="font-bold text-white">{avgRating.toFixed(1)}</span>
              <span className="text-[#777] text-[0.75rem]">({ratingCount} avis)</span>
            </div>
          )}
        </div>
      </Link>

      {/* Actions area - outside the link */}
      <div className="px-3 xs:px-[1.2rem] sm:px-[1.4rem] pb-[1rem] xs:pb-[1.2rem] flex-1 flex flex-col justify-end">
        <div>
          <div className="flex items-end justify-between gap-2 mb-3">
            <div className="flex-1">
              <div className="text-[0.75rem] text-[#777] mb-1">
                <strong className="text-white">{players}</strong>/{nb_joueurs} joueurs
              </div>
              <div className="h-[3px] bg-[rgba(255,255,255,0.06)] rounded-sm">
                <div className="h-full rounded-sm bg-[#e8220a] transition-all duration-400" style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Register button */}
          {onToggleRegister && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleRegister(); }}
              disabled={registerLoading || (isFull && !isRegistered) || statut === "closed"}
              className={`w-full text-[0.82rem] font-bold py-[8px] rounded-lg cursor-pointer transition-all border flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                isRegistered
                  ? "bg-[rgba(248,113,113,0.08)] border-[rgba(248,113,113,0.2)] text-[#f87171] hover:bg-[rgba(248,113,113,0.15)]"
                  : "bg-[rgba(232,34,10,0.1)] border-[rgba(232,34,10,0.25)] text-[#e8220a] hover:bg-[rgba(232,34,10,0.2)]"
              }`}
            >
              {registerLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isRegistered ? (
                "Se désinscrire"
              ) : isFull ? (
                "Complet"
              ) : (
                "S'inscrire →"
              )}
            </button>
          )}

          {/* No toggle = not logged in, show link */}
          {!onToggleRegister && currentUserId === null && statut !== "closed" && (
            <Link
              href="/auth"
              className="w-full text-[0.82rem] font-bold py-[8px] rounded-lg transition-all border flex items-center justify-center gap-1 no-underline bg-[rgba(232,34,10,0.1)] border-[rgba(232,34,10,0.25)] text-[#e8220a] hover:bg-[rgba(232,34,10,0.2)]"
            >
              S&apos;inscrire →
            </Link>
          )}
        </div>

        {/* Owner actions */}
        {isOwner && id && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-[rgba(255,255,255,0.08)]">
            <Link
              href={`/tournois/${id}/modifier`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-center text-[0.78rem] font-bold py-[6px] rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-[#ccc] no-underline transition-all hover:bg-[rgba(255,255,255,0.1)] hover:text-white"
            >
              <Pencil className="w-3 h-3 inline -mt-[1px]" /> Modifier
            </Link>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="flex-1 text-[0.78rem] font-bold py-[6px] rounded-lg bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)] text-[#f87171] cursor-pointer transition-all hover:bg-[rgba(248,113,113,0.15)]"
            >
              <Trash2 className="w-3 h-3 inline -mt-[1px]" /> Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
