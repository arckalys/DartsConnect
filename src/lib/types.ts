export type TournamentStatus = "open" | "soon" | "full" | "closed";
export type TournamentFormat = "Simple" | "Doublette" | "Équipe" | "Mixte";

export interface Tournament {
  id: string | number;
  nom: string;
  description?: string;
  ville: string;
  region: string;
  adresse?: string;
  date_tournoi: string;
  heure?: string;
  format: string;
  nb_joueurs: number;
  players?: number; // inscrits actuels (mock)
  prize?: number; // dotation (mock)
  contact_nom?: string;
  contact_email?: string;
  contact_tel?: string;
  infos_pratiques?: string;
  statut: TournamentStatus;
  user_id?: string;
  created_at?: string;
}

export interface UserProfile {
  prenom?: string;
  nom?: string;
  pseudo?: string;
  niveau?: string;
  region?: string;
  bio?: string;
}

export const REGIONS = [
  "Île-de-France",
  "Auvergne-Rhône-Alpes",
  "Provence-Alpes-Côte d'Azur",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Hauts-de-France",
  "Grand Est",
  "Normandie",
  "Bretagne",
  "Pays de la Loire",
  "Bourgogne-Franche-Comté",
  "Centre-Val de Loire",
  "Corse",
];

export const STATUS_LABELS: Record<TournamentStatus, string> = {
  open: "Inscriptions ouvertes",
  soon: "Bientôt complet",
  full: "Complet",
  closed: "Terminé",
};

export const NIVEAU_LABELS: Record<string, string> = {
  debutant: "🟢 Débutant",
  intermediaire: "🟡 Intermédiaire",
  confirme: "🔴 Confirmé",
  expert: "⭐ Expert",
};
