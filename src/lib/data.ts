import { Tournament } from "./types";

// Données fictives en attendant les vraies données Supabase
export const MOCK_TOURNAMENTS: (Tournament & { players: number; prize: number })[] = [
  { id: 1, nom: "Open de Paris — Fléchettes 2026", ville: "Paris", region: "Île-de-France", date_tournoi: "2026-04-12", prize: 500, format: "Simple", players: 18, nb_joueurs: 32, statut: "open" },
  { id: 2, nom: "Championnat de Lyon 501", ville: "Lyon", region: "Auvergne-Rhône-Alpes", date_tournoi: "2026-04-19", prize: 300, format: "Doublette", players: 28, nb_joueurs: 32, statut: "soon" },
  { id: 3, nom: "Grand Prix Marseille Summer", ville: "Marseille", region: "Provence-Alpes-Côte d'Azur", date_tournoi: "2026-05-03", prize: 1000, format: "Simple", players: 8, nb_joueurs: 64, statut: "open" },
  { id: 4, nom: "Tournoi des Flandres", ville: "Lille", region: "Hauts-de-France", date_tournoi: "2026-04-26", prize: 200, format: "Simple", players: 16, nb_joueurs: 16, statut: "full" },
  { id: 5, nom: "Open Bordelais de Fléchettes", ville: "Bordeaux", region: "Nouvelle-Aquitaine", date_tournoi: "2026-05-10", prize: 400, format: "Triplette", players: 6, nb_joueurs: 24, statut: "open" },
  { id: 6, nom: "Nantes Darts Challenge", ville: "Nantes", region: "Pays de la Loire", date_tournoi: "2026-05-17", prize: 250, format: "Simple", players: 12, nb_joueurs: 32, statut: "open" },
  { id: 7, nom: "Toulouse Open 2026", ville: "Toulouse", region: "Occitanie", date_tournoi: "2026-06-07", prize: 600, format: "Doublette", players: 4, nb_joueurs: 32, statut: "open" },
  { id: 8, nom: "Strasbourg Darts Masters", ville: "Strasbourg", region: "Grand Est", date_tournoi: "2026-05-24", prize: 350, format: "Simple", players: 22, nb_joueurs: 24, statut: "soon" },
  { id: 9, nom: "Breizh Darts Open", ville: "Rennes", region: "Bretagne", date_tournoi: "2026-06-14", prize: 150, format: "Simple", players: 10, nb_joueurs: 32, statut: "open" },
  { id: 10, nom: "Normandie Challenge Cup", ville: "Rouen", region: "Normandie", date_tournoi: "2026-04-05", prize: 200, format: "Doublette", players: 32, nb_joueurs: 32, statut: "full" },
  { id: 11, nom: "Montpellier Darts Festival", ville: "Montpellier", region: "Occitanie", date_tournoi: "2026-07-12", prize: 800, format: "Simple", players: 0, nb_joueurs: 64, statut: "open" },
  { id: 12, nom: "Dijon Classic Fléchettes", ville: "Dijon", region: "Bourgogne-Franche-Comté", date_tournoi: "2026-05-30", prize: 180, format: "Simple", players: 14, nb_joueurs: 24, statut: "open" },
];

export function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function fmtShort(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}
