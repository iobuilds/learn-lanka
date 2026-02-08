-- Drop the existing policy
DROP POLICY IF EXISTS "View published rank papers" ON public.rank_papers;

-- Create updated policy: students see only class-related papers they're enrolled in, or public papers
CREATE POLICY "View published rank papers"
ON public.rank_papers
FOR SELECT
USING (
  -- Admins/mods can view all
  is_admin_or_mod(auth.uid())
  OR
  (
    -- Paper must be published
    publish_status = 'PUBLISHED'
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