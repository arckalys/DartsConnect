// ─── Types ────────────────────────────────────────────────────────────────────

export interface Joueur {
  inscription_id: string;
  user_id: string;
  nom: string;
}

export interface Poule {
  id: number;
  nom: string;    // "Poule A"
  lettre: string; // "A"
  joueurs: Joueur[];
  matches: Array<[number, number]>; // paires d'indices dans joueurs[]
}

export interface BracketMatch {
  id: string;
  j1: string; // "Qualifié A1" | "Vainqueur QF1" | "— (bye)"
  j2: string;
}

export interface BracketRound {
  nom: string;
  matches: BracketMatch[];
}

export interface TableauData {
  config: {
    nb_joueurs_total: number;
    nb_poules: number;
    joueurs_par_poule: number;
    qualifies_par_poule: number;
  };
  poules: Poule[];
  bracket: BracketRound[];
}

// ─── Config poules selon nombre de joueurs ────────────────────────────────────

function getGroupConfig(n: number): { nbPoules: number; parPoule: number } {
  if (n <= 8)  return { nbPoules: 2, parPoule: 4 };
  if (n <= 12) return { nbPoules: 3, parPoule: 4 };
  if (n <= 16) return { nbPoules: 4, parPoule: 4 };
  if (n <= 24) return { nbPoules: 4, parPoule: 6 };
  if (n <= 32) return { nbPoules: 4, parPoule: 8 };
  return             { nbPoules: 8, parPoule: 8 };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function roundRobinPairs(n: number): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      pairs.push([i, j]);
    }
  }
  return pairs;
}

// ─── Bracket par nombre de poules ─────────────────────────────────────────────

function makeBracket(nbPoules: number): BracketRound[] {
  if (nbPoules === 2) {
    // 4 qualifiés → SF + F
    return [
      {
        nom: "Demi-finales",
        matches: [
          { id: "sf1", j1: "Qualifié A1", j2: "Qualifié B2" },
          { id: "sf2", j1: "Qualifié B1", j2: "Qualifié A2" },
        ],
      },
      {
        nom: "Finale",
        matches: [{ id: "f", j1: "Vainqueur SF1", j2: "Vainqueur SF2" }],
      },
    ];
  }

  if (nbPoules === 3) {
    // 6 qualifiés → QF (A1 et B1 ont un bye) + SF + F
    return [
      {
        nom: "Quarts de finale",
        matches: [
          { id: "qf1", j1: "Qualifié A1", j2: "— (bye)" },
          { id: "qf2", j1: "Qualifié C2", j2: "Qualifié C1" },
          { id: "qf3", j1: "Qualifié B1", j2: "— (bye)" },
          { id: "qf4", j1: "Qualifié B2", j2: "Qualifié A2" },
        ],
      },
      {
        nom: "Demi-finales",
        matches: [
          { id: "sf1", j1: "Qualifié A1", j2: "Vainqueur QF2" },
          { id: "sf2", j1: "Qualifié B1", j2: "Vainqueur QF4" },
        ],
      },
      {
        nom: "Finale",
        matches: [{ id: "f", j1: "Vainqueur SF1", j2: "Vainqueur SF2" }],
      },
    ];
  }

  if (nbPoules === 4) {
    // 8 qualifiés → QF + SF + F (croisement standard)
    return [
      {
        nom: "Quarts de finale",
        matches: [
          { id: "qf1", j1: "Qualifié A1", j2: "Qualifié D2" },
          { id: "qf2", j1: "Qualifié B1", j2: "Qualifié C2" },
          { id: "qf3", j1: "Qualifié C1", j2: "Qualifié B2" },
          { id: "qf4", j1: "Qualifié D1", j2: "Qualifié A2" },
        ],
      },
      {
        nom: "Demi-finales",
        matches: [
          { id: "sf1", j1: "Vainqueur QF1", j2: "Vainqueur QF2" },
          { id: "sf2", j1: "Vainqueur QF3", j2: "Vainqueur QF4" },
        ],
      },
      {
        nom: "Finale",
        matches: [{ id: "f", j1: "Vainqueur SF1", j2: "Vainqueur SF2" }],
      },
    ];
  }

  // 8 poules → 16 qualifiés → H + QF + SF + F
  return [
    {
      nom: "Huitièmes de finale",
      matches: [
        { id: "h1", j1: "Qualifié A1", j2: "Qualifié H2" },
        { id: "h2", j1: "Qualifié B1", j2: "Qualifié G2" },
        { id: "h3", j1: "Qualifié C1", j2: "Qualifié F2" },
        { id: "h4", j1: "Qualifié D1", j2: "Qualifié E2" },
        { id: "h5", j1: "Qualifié E1", j2: "Qualifié D2" },
        { id: "h6", j1: "Qualifié F1", j2: "Qualifié C2" },
        { id: "h7", j1: "Qualifié G1", j2: "Qualifié B2" },
        { id: "h8", j1: "Qualifié H1", j2: "Qualifié A2" },
      ],
    },
    {
      nom: "Quarts de finale",
      matches: [
        { id: "qf1", j1: "Vainqueur H1", j2: "Vainqueur H2" },
        { id: "qf2", j1: "Vainqueur H3", j2: "Vainqueur H4" },
        { id: "qf3", j1: "Vainqueur H5", j2: "Vainqueur H6" },
        { id: "qf4", j1: "Vainqueur H7", j2: "Vainqueur H8" },
      ],
    },
    {
      nom: "Demi-finales",
      matches: [
        { id: "sf1", j1: "Vainqueur QF1", j2: "Vainqueur QF2" },
        { id: "sf2", j1: "Vainqueur QF3", j2: "Vainqueur QF4" },
      ],
    },
    {
      nom: "Finale",
      matches: [{ id: "f", j1: "Vainqueur SF1", j2: "Vainqueur SF2" }],
    },
  ];
}

// ─── Génération principale ────────────────────────────────────────────────────

export function generateTableau(joueurs: Joueur[]): TableauData {
  const n = joueurs.length;
  const { nbPoules, parPoule } = getGroupConfig(n);

  const shuffled = shuffle(joueurs);

  // Répartition équilibrée dans les poules
  const poules: Poule[] = Array.from({ length: nbPoules }, (_, i) => ({
    id: i,
    nom: `Poule ${String.fromCharCode(65 + i)}`,
    lettre: String.fromCharCode(65 + i),
    joueurs: [],
    matches: [],
  }));

  shuffled.forEach((j, idx) => {
    poules[idx % nbPoules].joueurs.push(j);
  });

  poules.forEach((p) => {
    p.matches = roundRobinPairs(p.joueurs.length);
  });

  return {
    config: {
      nb_joueurs_total: n,
      nb_poules: nbPoules,
      joueurs_par_poule: parPoule,
      qualifies_par_poule: 2,
    },
    poules,
    bracket: makeBracket(nbPoules),
  };
}
