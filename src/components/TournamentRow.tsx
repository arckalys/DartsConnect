import { STATUS_LABELS } from "@/lib/types";
import type { TournamentStatus } from "@/lib/types";
import { fmtShort } from "@/lib/data";

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

export default function TournamentRow({ nom, region, date_tournoi, format, nb_joueurs, players, prize, statut, delay = 0 }: Props) {
  return (
    <div
      className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-xl px-[1.4rem] py-[1.1rem] grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_auto] items-center gap-4 cursor-pointer text-white transition-all duration-200 animate-fade-up hover:border-[rgba(232,34,10,0.35)] hover:bg-[rgba(232,34,10,0.02)]"
      style={{ animationDelay: `${delay * 0.04}s` }}
    >
      <div>
        <div className="font-barlow-condensed font-extrabold text-[1rem]">{nom}</div>
        <div className="text-[0.78rem] text-[#777] mt-[2px] flex items-center gap-[5px]">
          <span className={`inline-block text-[0.6rem] font-bold uppercase tracking-[1px] px-[7px] py-[2px] rounded-full ${statusClass[statut]}`}>
            {STATUS_LABELS[statut]}
          </span>
          <span>{format}</span>
        </div>
      </div>
      <div className="text-[0.85rem] text-[#ccc]">{fmtShort(date_tournoi)}</div>
      <div className="text-[0.82rem] text-[#777]">{region.split("-")[0].trim()}</div>
      <div className="font-barlow-condensed font-extrabold text-[1.1rem] text-[#e8220a]">{prize}€</div>
      <div className="text-[0.8rem] text-[#777]">
        <strong className="text-white">{players}</strong>/{nb_joueurs}
      </div>
      <div className="bg-[rgba(232,34,10,0.1)] border border-[rgba(232,34,10,0.25)] text-[#e8220a] text-[0.78rem] font-bold px-[14px] py-[6px] rounded-lg whitespace-nowrap transition-all duration-200 hover:bg-[rgba(232,34,10,0.2)]">
        {statut === "full" ? "Voir" : "S'inscrire"}
      </div>
    </div>
  );
}
