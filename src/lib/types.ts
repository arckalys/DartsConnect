export type TournamentStatus = "open" | "soon" | "full" | "closed";
export type TournamentFormat = "Simple" | "Doublette" | "Équipe" | "Mixte";

export type TournamentType = "traditionnel" | "electronique";

export const TYPE_LABELS: Record<TournamentType, string> = {
  traditionnel: "Traditionnel",
  electronique: "Électronique",
};

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
  type_jeu?: TournamentType;
  nb_joueurs: number;
  players?: number;
  prize?: number;
  contact_nom?: string;
  contact_email?: string;
  contact_tel?: string;
  infos_pratiques?: string;
  statut: TournamentStatus;
  user_id?: string;
  created_at?: string;
  sessions_count?: number;
  first_session_date?: string;
}

export interface SessionTournoi {
  id: string;
  tournoi_id: string;
  nom: string;
  date_session: string;
  heure?: string;
  format?: string;
  nb_joueurs_max: number;
  type_jeu?: TournamentType;
  created_at?: string;
}

export interface UserProfile {
  prenom?: string;
  nom?: string;
  pseudo?: string;
  region?: string;
  bio?: string;
}

export const REGIONS = [
  // Métropole
  "Auvergne-Rhône-Alpes",
  "Bourgogne-Franche-Comté",
  "Bretagne",
  "Centre-Val de Loire",
  "Corse",
  "Grand Est",
  "Hauts-de-France",
  "Île-de-France",
  "Normandie",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Pays de la Loire",
  "Provence-Alpes-Côte d'Azur",
  // DOM-ROM
  "Guadeloupe",
  "Martinique",
  "Guyane",
  "La Réunion",
  "Mayotte",
  // Collectivités d'outre-mer
  "Nouvelle-Calédonie",
  "Polynésie française",
  "Saint-Barthélemy",
  "Saint-Martin",
  "Saint-Pierre-et-Miquelon",
  "Wallis-et-Futuna",
];

export const STATUS_LABELS: Record<TournamentStatus, string> = {
  open: "Inscriptions ouvertes",
  soon: "Bientôt complet",
  full: "Complet",
  closed: "Terminé",
};

