-- ============================================
-- Solutions & Likes Migration
-- Adds solutions sharing, likes, and submission delete
-- Idempotent: safe to run multiple times
-- ============================================

-- Solutions table: shared solution write-ups linked to submissions
CREATE TABLE IF NOT EXISTS public.solutions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  problem_id uuid REFERENCES public.problems(id) ON DELETE CASCADE NOT NULL,
  submission_id uuid REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL DEFAULT '',
  is_public boolean NOT NULL DEFAULT false,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Solution likes: one like per user per solution
CREATE TABLE IF NOT EXISTS public.solution_likes (
  solution_id uuid REFERENCES public.solutions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (solution_id, user_id)
);

-- ============================================
-- RLS: solutions
-- ============================================
ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Solutions viewable if public or own"
    ON public.solutions FOR SELECT
    USING (is_public = true OR auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own solutions"
    ON public.solutions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own solutions"
    ON public.solutions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own solutions"
    ON public.solutions FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- RLS: solution_likes
-- ============================================
ALTER TABLE public.solution_likes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Solution likes viewable by everyone"
    ON public.solution_likes FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own likes"
    ON public.solution_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own likes"
    ON public.solution_likes FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- RLS: submissions DELETE (was missing)
-- ============================================
DO $$ BEGIN
  CREATE POLICY "Users can delete own submissions"
    ON public.submissions FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_solutions_problem_id ON public.solutions(problem_id);
CREATE INDEX IF NOT EXISTS idx_solutions_user_id ON public.solutions(user_id);
CREATE INDEX IF NOT EXISTS idx_solutions_submission_id ON public.solutions(submission_id);
CREATE INDEX IF NOT EXISTS idx_solutions_public ON public.solutions(problem_id) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_solution_likes_solution ON public.solution_likes(solution_id);
