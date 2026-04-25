-- Ajoute la colonne notifs_region à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifs_region BOOLEAN DEFAULT FALSE;
