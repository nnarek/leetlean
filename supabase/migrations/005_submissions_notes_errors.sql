-- Add notes and errors columns to submissions (idempotent)
DO $$ BEGIN
  ALTER TABLE public.submissions ADD COLUMN notes text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.submissions ADD COLUMN errors text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
