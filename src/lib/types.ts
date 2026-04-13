export type TournamentStatus = "open" | "soon" | "full" | "closed";
export type TournamentFormat = "Simple" | "Doublette" | "Équipe" | "Mixte";

export type TournamentType = "traditionnel" | "electronique";

export const TYPE_LABELS: Record<TournamentType, string> = {
  traditionnel: "Traditionnel",
  electronique: "Électronique",
};

export type PaymentType = "especes" | "en_ligne";

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
  type_paiement?: PaymentType;
  prix_inscription?: number;
  stripe_account_id?: string;
  forfait_paye?: boolean;
}

export interface UserProfile {
  prenom?: string;
  nom?: string;
  pseudo?: string;
  moyenne?: string;
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

