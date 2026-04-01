import Link from "next/link";
import { STATUS_LABELS } from "@/lib/types";
import type { TournamentStatus } from "@/lib/types";
import { fmtShort } from "@/lib/data";

interface Props {
  id?: string | number;
  nom: string;
  ville: string;
  region: string;
  date_tournoi: string;
  format: string;
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
}

const statusClass: Record<TournamentStatus, string> = {
  open: "bg-[rgba(34,197,94,0.12)] text-[#22c55e]",
  soon: "bg-[rgba(249,115,22,0.12)] text-[#f97316]",
  full: "bg-[rgba(255,255,255,0.06)] text-[#777]",
  closed: "bg-[rgba(248,113,113,0.1)] text-[#f87171]",
};

export default function TournamentRow({ id, nom, region, date_tournoi, format, nb_joueurs, players, prize, statut, delay = 0, isOwner, onDelete, isRegistered, onToggleRegister, registerLoading, currentUserId }: Props) {
  const isFull = players >= nb_joueurs && !isRegistered;

  return (
    <div
      className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-xl px-[1.4rem] py-[1.1rem] grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_auto] items-center gap-4 text-white transition-all duration-200 animate-fade-up hover:border-[rgba(232,34,10,0.35)] hover:bg-[rgba(232,34,10,0.02)]"
      style={{ animationDelay: `${delay * 0.04}s` }}
    >
      <Link href={id ? `/tournois/${id}` : "#"} className="no-underline text-white">
        <div className="font-barlow-condensed font-extrabold text-[1rem] hover:text-[#e8220a] transition-colors">{nom}</div>
        <div className="text-[0.78rem] text-[#777] mt-[2px] flex items-center gap-[5px]">
          <span className={`inline-block text-[0.6rem] font-bold uppercase tracking-[1px] px-[7px] py-[2px] rounded-full ${statusClass[statut]}`}>
            {STATUS_LABELS[statut]}
          </span>
          <span>{format}</span>
          {isRegistered && (
            <span className="inline-block text-[0.6rem] font-bold uppercase tracking-[1px] px-[7px] py-[2px] rounded-full bg-[rgba(34,197,94,0.15)] text-[#22c55e]">
              Inscrit ✓
            </span>
          )}
        </div>
      </Link>
      <div className="text-[0.85rem] text-[#ccc]">{fmtShort(date_tournoi)}</div>
      <div className="text-[0.82rem] text-[#777]">{region.split("-")[0].trim()}</div>
      <div className="font-barlow-condensed font-extrabold text-[1.1rem] text-[#e8220a]">{prize}€</div>
      <div className="text-[0.8rem] text-[#777]">
        <strong className="text-white">{players}</strong>/{nb_joueurs}
      </div>
      <div className="flex items-center gap-2">
        {isOwner && id && (
          <>
            <Link
              href={`/tournois/${id}/modifier`}
              onClick={(e) => e.stopPropagation()}
              className="text-[0.75rem] font-bold px-[10px] py-[5px] rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-[#ccc] no-underline transition-all hover:bg-[rgba(255,255,255,0.1)] hover:text-white"
            >
              ✏️
            </Link>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="text-[0.75rem] font-bold px-[10px] py-[5px] rounded-lg bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)] text-[#f87171] cursor-pointer transition-all hover:bg-[rgba(248,113,113,0.15)]"
            >
              🗑️
            </button>
          </>
        )}
        {onToggleRegister ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleRegister(); }}
            disabled={registerLoading || (isFull && !isRegistered) || statut === "closed"}
            className={`text-[0.78rem] font-bold px-[14px] py-[6px] rounded-lg whitespace-nowrap transition-all duration-200 cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed ${
              isRegistered
                ? "bg-[rgba(248,113,113,0.08)] border-[rgba(248,113,113,0.2)] text-[#f87171] hover:bg-[rgba(248,113,113,0.15)]"
                : "bg-[rgba(232,34,10,0.1)] border-[rgba(232,34,10,0.25)] text-[#e8220a] hover:bg-[rgba(232,34,10,0.2)]"
            }`}
          >
            {registerLoading ? "..." : isRegistered ? "Se désinscrire" : isFull ? "Complet" : "S'inscrire"}
          </button>
        ) : (
          <Link
            href={currentUserId === null ? "/auth" : "#"}
            className="bg-[rgba(232,34,10,0.1)] border border-[rgba(232,34,10,0.25)] text-[#e8220a] text-[0.78rem] font-bold px-[14px] py-[6px] rounded-lg whitespace-nowrap transition-all duration-200 hover:bg-[rgba(232,34,10,0.2)] no-underline"
          >
            S&apos;inscrire
          </Link>
        )}
      </div>
    </div>
  );
}
