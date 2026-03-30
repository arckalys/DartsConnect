import { STATUS_LABELS } from "@/lib/types";
import type { TournamentStatus } from "@/lib/types";
import { fmtDate } from "@/lib/data";

interface Props {
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
}

const statusClass: Record<TournamentStatus, string> = {
  open: "bg-[rgba(34,197,94,0.12)] text-[#22c55e]",
  soon: "bg-[rgba(249,115,22,0.12)] text-[#f97316]",
  full: "bg-[rgba(255,255,255,0.06)] text-[#777]",
  closed: "bg-[rgba(248,113,113,0.1)] text-[#f87171]",
};

export default function TournamentCard({ nom, ville, region, date_tournoi, format, nb_joueurs, players, prize, statut, delay = 0 }: Props) {
  const pct = Math.round((players / nb_joueurs) * 100);

  return (
    <div
      className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] overflow-hidden cursor-pointer text-white transition-all duration-200 flex flex-col animate-fade-up hover:border-[rgba(232,34,10,0.4)] hover:-translate-y-[3px]"
      style={{ animationDelay: `${delay * 0.05}s` }}
    >
      {/* Top */}
      <div className="px-[1.4rem] pt-[1.2rem] pb-[0.8rem] border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex gap-[6px] mb-2 flex-wrap">
          <span className={`inline-block text-[0.65rem] font-bold uppercase tracking-[1px] px-[9px] py-[3px] rounded-full ${statusClass[statut]}`}>
            {STATUS_LABELS[statut]}
          </span>
          <span className="inline-block text-[0.65rem] font-bold uppercase tracking-[1px] px-[9px] py-[3px] rounded-full bg-[rgba(255,255,255,0.06)] text-[#aaa]">
            {format}
          </span>
        </div>
        <div className="flex justify-between items-start gap-2">
          <div className="font-barlow-condensed font-extrabold text-[1.05rem] leading-[1.25]">{nom}</div>
          <div className="font-barlow-condensed font-extrabold text-[1.1rem] text-[#e8220a] whitespace-nowrap">{prize}€</div>
        </div>
      </div>

      {/* Body */}
      <div className="px-[1.4rem] py-[1rem] pb-[1.2rem] flex-1 flex flex-col justify-between">
        <div className="flex flex-col gap-[5px] mb-4">
          <div className="flex items-center gap-[7px] text-[0.8rem] text-[#777]">
            <svg className="w-[13px] h-[13px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {fmtDate(date_tournoi)}
          </div>
          <div className="flex items-center gap-[7px] text-[0.8rem] text-[#777]">
            <svg className="w-[13px] h-[13px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {ville}, {region}
          </div>
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="flex-1">
            <div className="text-[0.75rem] text-[#777] mb-1">
              <strong className="text-white">{players}</strong>/{nb_joueurs} joueurs
            </div>
            <div className="h-[3px] bg-[rgba(255,255,255,0.06)] rounded-sm">
              <div className="h-full rounded-sm bg-[#e8220a] transition-all duration-400" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <span className="text-[0.78rem] font-bold text-[#e8220a] whitespace-nowrap flex items-center gap-[3px] hover:gap-[6px] transition-all duration-200">
            {statut === "full" ? "Voir →" : "S'inscrire →"}
          </span>
        </div>
      </div>
    </div>
  );
}
