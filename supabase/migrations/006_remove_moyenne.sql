-- Supprime le champ moyenne de la table profiles et met à jour le trigger.

-- 1. Mise à jour du trigger (retire moyenne, garde région + niveau)
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, pseudo, prenom, nom, bio, region, niveau, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'pseudo', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'region',
    NEW.raw_user_meta_data->>'niveau',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    pseudo     = EXCLUDED.pseudo,
    prenom     = EXCLUDED.prenom,
    nom        = EXCLUDED.nom,
    bio        = EXCLUDED.bio,
    region     = EXCLUDED.region,
    niveau     = EXCLUDED.niveau,
    avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$;

-- 2. Supprimer la colonne moyenne
ALTER TABLE profiles DROP COLUMN IF EXISTS moyenne;
