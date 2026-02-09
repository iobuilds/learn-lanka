-- Create table for multiple enrollment payments
CREATE TABLE public.enrollment_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.class_enrollments(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  payment_date date NOT NULL,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.enrollment_payments ENABLE ROW LEVEL SECURITY;

-- Admins can manage enrollment payments
CREATE POLICY "Admins can manage enrollment payments"
  ON public.enrollment_payments
  FOR ALL
  USING (is_admin_or_mod(auth.uid()));

-- Users can view their own enrollment payments
CREATE POLICY "Users can view own enrollment payments"
  ON public.enrollment_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_enrollments ce
      WHERE ce.id = enrollment_payments.enrollment_id
      AND ce.user_id = auth.uid()
    )
  );