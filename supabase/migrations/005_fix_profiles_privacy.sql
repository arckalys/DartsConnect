-- Supprime la colonne email de la table profiles pour protéger la vie privée.
-- La colonne email n'est jamais utilisée dans les pages publiques ; le trigger
-- la synchronisait inutilement et la policy RLS USING(true) permettait à
-- n'importe qui avec la clé anon de faire SELECT email FROM profiles.

-- 1. Mettre à jour le trigger pour ne plus synchroniser l'email
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, pseudo, prenom, nom, bio, region, niveau, moyenne, avatar_url)
  VALUES (
    NEW.id,
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

-- 2. Supprimer la colonne email
ALTER TABLE profiles DROP COLUMN IF EXISTS email;
