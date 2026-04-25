-- Table pour le carousel d'actualités de la page principale
CREATE TABLE IF NOT EXISTS public.carousel (
  id        SERIAL PRIMARY KEY,
  url       TEXT    NOT NULL,
  titre     TEXT,
  description TEXT,
  ordre     INTEGER DEFAULT 0,
  actif     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lecture publique uniquement sur les images actives
ALTER TABLE public.carousel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read carousel actif"
  ON public.carousel FOR SELECT
  USING (actif = true);

-- Exemple de données (supprime ou remplace les URLs par tes vraies images)
INSERT INTO public.carousel (url, titre, description, ordre) VALUES
  ('https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=900&q=80', 'Bienvenue sur DartsTournois', 'La plateforme #1 des tournois de fléchettes en France', 1),
  ('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=80', 'Trouvez votre prochain tournoi', 'Des événements partout en France, toute l''année', 2),
  ('https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=900&q=80', 'Créez et gérez vos tournois', 'Publication en quelques clics, gestion simplifiée', 3);
