-- Update lessons RLS policy to allow free access for private class students
DROP POLICY IF EXISTS "Paid users can view lessons" ON public.lessons;

CREATE POLICY "Users can view lessons based on class type"
ON public.lessons
FOR SELECT
USING (
  (
    -- Admin/mod can always view
    is_admin_or_mod(auth.uid())
  ) OR (
    -- For private classes: enrolled students get free access
    EXISTS (
      SELECT 1 
      FROM class_days cd
      JOIN class_months cm ON cd.class_month_id = cm.id
      JOIN classes c ON cm.class_id = c.id
      WHERE cd.id = lessons.class_day_id 
        AND c.is_private = true
        AND EXISTS (
          SELECT 1 FROM class_enrollments ce 
          WHERE ce.class_id = c.id 
            AND ce.user_id = auth.uid() 
            AND ce.status = 'ACTIVE'
        )
    )
  ) OR (
    -- For public classes: require payment
    EXISTS (
      SELECT 1
      FROM class_days cd
      JOIN class_months cm ON cd.class_month_id = cm.id
      JOIN classes c ON cm.class_id = c.id
      JOIN payments p ON p.ref_id = (c.id::text || '-' || cm.year_month)
        AND p.payment_type = 'CLASS_MONTH'
        AND p.status = 'APPROVED'
      WHERE cd.id = lessons.class_day_id 
        AND c.is_private = false
        AND p.user_id = auth.uid()
    )
  )
);