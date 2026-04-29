-- ============================================
-- Submissions Enhancement Migration
-- Adds main_theorem_name to problems, name to submissions
-- Idempotent: safe to run multiple times
-- ============================================

-- Add main_theorem_name column to problems table
DO $$ BEGIN
  ALTER TABLE public.problems ADD COLUMN main_theorem_name text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add name column to submissions table (user-provided name)
DO $$ BEGIN
  ALTER TABLE public.submissions ADD COLUMN name text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- RLS: Users can update own submissions (for renaming)
DO $$ BEGIN
  CREATE POLICY "Users can update own submissions"
    ON public.submissions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
