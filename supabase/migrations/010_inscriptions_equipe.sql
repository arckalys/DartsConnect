-- Inscription en équipe / doublette
-- Pour les formats non-individuels (Doublette, Équipe, Mixte), un seul utilisateur
-- s'inscrit et renseigne soit un nom d'équipe, soit les prénoms des coéquipiers.

ALTER TABLE inscriptions
  ADD COLUMN IF NOT EXISTS nom_equipe   text,
  ADD COLUMN IF NOT EXISTS coequipiers  text[];
