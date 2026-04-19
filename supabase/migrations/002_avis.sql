-- Table pour les avis/notes des joueurs sur les tournois
CREATE TABLE IF NOT EXISTS avis (
  id           uuid      DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamp DEFAULT now(),
  user_id      uuid      REFERENCES auth.users NOT NULL,
  tournoi_id   uuid      REFERENCES tournois(id) ON DELETE CASCADE NOT NULL,
  note         integer   CHECK (note >= 1 AND note <= 5) NOT NULL,
  commentaire  text,
  UNIQUE(user_id, tournoi_id)
);

-- Sécurité RLS
ALTER TABLE avis ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les avis
CREATE POLICY "Lecture publique"
  ON avis FOR SELECT
  USING (true);

-- Un utilisateur authentifié peut poster son propre avis
CREATE POLICY "Avis authentifié"
  ON avis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Un utilisateur peut modifier son propre avis
CREATE POLICY "Modifier son avis"
  ON avis FOR UPDATE
  USING (auth.uid() = user_id);

-- Un utilisateur peut supprimer son propre avis
CREATE POLICY "Supprimer son avis"
  ON avis FOR DELETE
  USING (auth.uid() = user_id);

-- Index pour les requêtes par tournoi
CREATE INDEX IF NOT EXISTS idx_avis_tournoi ON avis(tournoi_id);
CREATE INDEX IF NOT EXISTS idx_avis_user ON avis(user_id);
