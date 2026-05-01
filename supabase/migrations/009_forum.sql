-- Table des questions du forum
CREATE TABLE IF NOT EXISTS public.forum_questions (
  id         SERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  titre      TEXT NOT NULL CHECK (char_length(titre) <= 120),
  contenu    TEXT NOT NULL CHECK (char_length(contenu) <= 2000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des réponses
CREATE TABLE IF NOT EXISTS public.forum_reponses (
  id          SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contenu     TEXT NOT NULL CHECK (char_length(contenu) <= 2000),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS forum_reponses_question_idx ON public.forum_reponses(question_id);
CREATE INDEX IF NOT EXISTS forum_questions_created_idx ON public.forum_questions(created_at DESC);

-- RLS forum_questions
ALTER TABLE public.forum_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read questions"   ON public.forum_questions FOR SELECT USING (true);
CREATE POLICY "Auth insert questions"   ON public.forum_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own delete questions"    ON public.forum_questions FOR DELETE USING (auth.uid() = user_id);

-- RLS forum_reponses
ALTER TABLE public.forum_reponses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reponses"    ON public.forum_reponses FOR SELECT USING (true);
CREATE POLICY "Auth insert reponses"    ON public.forum_reponses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own delete reponses"     ON public.forum_reponses FOR DELETE USING (auth.uid() = user_id);
