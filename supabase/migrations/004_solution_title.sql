-- Add title column to solutions
ALTER TABLE public.solutions ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';
