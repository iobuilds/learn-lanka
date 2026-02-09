-- Add payment_amount column to class_enrollments for tracking private class payments
ALTER TABLE public.class_enrollments 
ADD COLUMN payment_amount integer DEFAULT NULL;

-- Add a comment explaining the column
COMMENT ON COLUMN public.class_enrollments.payment_amount IS 'Amount paid for private class enrollment, set by admin';