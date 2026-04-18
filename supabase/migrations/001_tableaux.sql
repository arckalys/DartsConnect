-- Table pour stocker les tableaux générés
CREATE TABLE IF NOT EXISTS tableaux (
  id         uuid      DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp DEFAULT now(),
  tournoi_id uuid      REFERENCES tournois(id) ON DELETE CASCADE,
  poules     jsonb,
  bracket    jsonb,
  genere_at  timestamp DEFAULT now()
);

-- Sécurité RLS
ALTER TABLE tableaux ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire le tableau d'un tournoi
CREATE POLICY "Lecture publique"
  ON tableaux FOR SELECT
  USING (true);

-- Seul l'organisateur du tournoi peut créer un tableau
CREATE POLICY "Création par organisateur"
  ON tableaux FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM tournois WHERE id = tournoi_id)
  );

-- Seul l'organisateur peut supprimer/régénérer
CREATE POLICY "Suppression par organisateur"
  ON tableaux FOR DELETE
  USING (
    auth.uid() = (SELECT user_id FROM tournois WHERE id = tournoi_id)
  );
