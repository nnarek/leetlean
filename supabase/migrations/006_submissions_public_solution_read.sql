-- Allow anyone to read submissions that have a public solution linked to them
DO $$ BEGIN
  CREATE POLICY "Anyone can view submissions with public solutions"
    ON public.submissions FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.solutions
        WHERE solutions.submission_id = submissions.id
          AND solutions.is_public = true
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
