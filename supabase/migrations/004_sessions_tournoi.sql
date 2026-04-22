-- Sessions multiples par tournoi
-- Un tournoi peut avoir plusieurs sessions (dates/formats/créneaux différents).
-- Les inscriptions se font par session via inscriptions.session_id.

CREATE TABLE IF NOT EXISTS sessions_tournoi (
  id              uuid      DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamp DEFAULT now(),
  tournoi_id      uuid      REFERENCES tournois(id) ON DELETE CASCADE,
  nom             text,
  date_session    date      NOT NULL,
  heure           text,
  format          text,
  nb_joueurs_max  int       NOT NULL DEFAULT 16,
  type_jeu        text
);

-- Colonnes supplémentaires (idempotent)
ALTER TABLE sessions_tournoi ADD COLUMN IF NOT EXISTS created_at     timestamp DEFAULT now();
ALTER TABLE sessions_tournoi ADD COLUMN IF NOT EXISTS tournoi_id     uuid      REFERENCES tournois(id) ON DELETE CASCADE;
ALTER TABLE sessions_tournoi ADD COLUMN IF NOT EXISTS nom            text;
ALTER TABLE sessions_tournoi ADD COLUMN IF NOT EXISTS date_session   date;
ALTER TABLE sessions_tournoi ADD COLUMN IF NOT EXISTS heure          text;
ALTER TABLE sessions_tournoi ADD COLUMN IF NOT EXISTS format         text;
ALTER TABLE sessions_tournoi ADD COLUMN IF NOT EXISTS nb_joueurs_max int;
ALTER TABLE sessions_tournoi ADD COLUMN IF NOT EXISTS type_jeu       text;

CREATE INDEX IF NOT EXISTS sessions_tournoi_tournoi_id_idx ON sessions_tournoi(tournoi_id);
CREATE INDEX IF NOT EXISTS sessions_tournoi_date_idx       ON sessions_tournoi(date_session);

-- RLS
ALTER TABLE sessions_tournoi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique sessions" ON sessions_tournoi;
CREATE POLICY "Lecture publique sessions"
  ON sessions_tournoi FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Création sessions par organisateur" ON sessions_tournoi;
CREATE POLICY "Création sessions par organisateur"
  ON sessions_tournoi FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM tournois WHERE id = tournoi_id)
  );

DROP POLICY IF EXISTS "Modification sessions par organisateur" ON sessions_tournoi;
CREATE POLICY "Modification sessions par organisateur"
  ON sessions_tournoi FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM tournois WHERE id = tournoi_id)
  );

DROP POLICY IF EXISTS "Suppression sessions par organisateur" ON sessions_tournoi;
CREATE POLICY "Suppression sessions par organisateur"
  ON sessions_tournoi FOR DELETE
  USING (
    auth.uid() = (SELECT user_id FROM tournois WHERE id = tournoi_id)
  );

-- Lier les inscriptions à une session précise
ALTER TABLE inscriptions
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES sessions_tournoi(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS inscriptions_session_id_idx ON inscriptions(session_id);
