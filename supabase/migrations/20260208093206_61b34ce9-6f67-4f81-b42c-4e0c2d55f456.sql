-- Add unlock_at and lock_at columns to rank_papers for scheduled access
ALTER TABLE public.rank_papers 
ADD COLUMN IF NOT EXISTS unlock_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS lock_at timestamp with time zone DEFAULT NULL;

-- Update the RLS policy for viewing rank papers to also check unlock_at and lock_at times
DROP POLICY IF EXISTS "View published rank papers" ON public.rank_papers;

CREATE POLICY "View published rank papers"
ON public.rank_papers
FOR SELECT
USING (
  -- Admins/mods can always view all papers
  is_admin_or_mod(auth.uid())
  OR
  (
    -- Paper must be published
    publish_status = 'PUBLISHED'
    AND
    -- Check unlock time window (if set)
    (unlock_at IS NULL OR now() >= unlock_at)
    AND
    (lock_at IS NULL OR now() <= lock_at)
    AND
    (
      -- Public papers (no class assigned) - visible to all
      class_id IS NULL
      OR
      -- Class-specific papers - only for enrolled students
      EXISTS (
        SELECT 1 FROM public.class_enrollments ce
        WHERE ce.class_id = rank_papers.class_id
          AND ce.user_id = auth.uid()
          AND ce.status = 'ACTIVE'
      )
    )
  )
);