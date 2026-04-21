-- Étend la table profiles pour les profils publics des joueurs
-- (à lancer même si la table existe déjà — les colonnes sont ajoutées avec IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS profiles (
  id         uuid      PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now(),
  email      text,
  pseudo     text,
  prenom     text,
  nom        text
);

-- Colonnes supplémentaires pour le profil public
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at  timestamp DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email       text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pseudo      text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prenom      text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nom         text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio         text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region      text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS niveau      text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS moyenne     text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url  text;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Lecture publique (l'email reste techniquement dans la table mais ne doit
-- jamais être remonté au client public — les pages /joueurs/[id] sélectionnent
-- uniquement les colonnes non sensibles)
DROP POLICY IF EXISTS "Lecture publique profils" ON profiles;
CREATE POLICY "Lecture publique profils"
  ON profiles FOR SELECT
  USING (true);

-- Insertion par l'utilisateur lui-même
DROP POLICY IF EXISTS "Créer son profil" ON profiles;
CREATE POLICY "Créer son profil"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Update par l'utilisateur lui-même
DROP POLICY IF EXISTS "Modifier son profil" ON profiles;
CREATE POLICY "Modifier son profil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Fonction trigger : synchronise auth.users.user_metadata -> profiles
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, pseudo, prenom, nom, bio, region, niveau, moyenne, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'pseudo', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'region',
    NEW.raw_user_meta_data->>'niveau',
    NEW.raw_user_meta_data->>'moyenne',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    pseudo     = EXCLUDED.pseudo,
    prenom     = EXCLUDED.prenom,
    nom        = EXCLUDED.nom,
    bio        = EXCLUDED.bio,
    region     = EXCLUDED.region,
    niveau     = EXCLUDED.niveau,
    moyenne    = EXCLUDED.moyenne,
    avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_auth();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_auth();

-- Backfill initial : pour les utilisateurs existants (les trigger ne tournent
-- que sur les nouveaux INSERT/UPDATE)
INSERT INTO public.profiles (id, email, pseudo, prenom, nom, bio, region, niveau, moyenne, avatar_url, created_at)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'pseudo', ''),
  COALESCE(u.raw_user_meta_data->>'prenom', ''),
  COALESCE(u.raw_user_meta_data->>'nom', ''),
  u.raw_user_meta_data->>'bio',
  u.raw_user_meta_data->>'region',
  u.raw_user_meta_data->>'niveau',
  u.raw_user_meta_data->>'moyenne',
  u.raw_user_meta_data->>'avatar_url',
  u.created_at
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  email      = EXCLUDED.email,
  pseudo     = COALESCE(NULLIF(EXCLUDED.pseudo, ''), profiles.pseudo),
  prenom     = COALESCE(NULLIF(EXCLUDED.prenom, ''), profiles.prenom),
  nom        = COALESCE(NULLIF(EXCLUDED.nom, ''), profiles.nom),
  bio        = COALESCE(EXCLUDED.bio, profiles.bio),
  region     = COALESCE(EXCLUDED.region, profiles.region),
  niveau     = COALESCE(EXCLUDED.niveau, profiles.niveau),
  moyenne    = COALESCE(EXCLUDED.moyenne, profiles.moyenne),
  avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
