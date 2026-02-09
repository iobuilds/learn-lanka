-- Add payment_received_at column to class_enrollments for private class tracking
ALTER TABLE public.class_enrollments 
ADD COLUMN payment_received_at timestamp with time zone DEFAULT NULL;

-- Add a note/remarks field for admin reference
ALTER TABLE public.class_enrollments 
ADD COLUMN admin_note text DEFAULT NULL;

-- Update RLS to allow admins/mods to update enrollments (already exists but ensure update works)
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.class_enrollments;

CREATE POLICY "Admins can manage enrollments"
ON public.class_enrollments
FOR ALL
USING (is_admin_or_mod(auth.uid()))
WITH CHECK (is_admin_or_mod(auth.uid()));