-- First drop the lessons policy that depends on ref_id
DROP POLICY IF EXISTS "Paid users can view lessons" ON public.lessons;

-- Now change ref_id from uuid to text for flexibility
ALTER TABLE public.payments 
ALTER COLUMN ref_id TYPE text USING ref_id::text;

-- Recreate the lessons RLS policy with correct payment_type and ref_id format
CREATE POLICY "Paid users can view lessons" 
ON public.lessons 
FOR SELECT 
USING (
  (EXISTS (
    SELECT 1
    FROM class_days cd
    JOIN class_months cm ON cd.class_month_id = cm.id
    JOIN classes c ON cm.class_id = c.id
    JOIN payments p ON (
      p.ref_id = (c.id::text || '-' || cm.year_month)
      AND p.payment_type = 'CLASS_MONTH'
      AND p.status = 'APPROVED'
    )
    WHERE cd.id = lessons.class_day_id 
    AND p.user_id = auth.uid()
  )) 
  OR is_admin_or_mod(auth.uid())
);