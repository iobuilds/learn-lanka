-- Create lesson_attachments table for multiple files per lesson
CREATE TABLE public.lesson_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  attachment_type text NOT NULL CHECK (attachment_type IN ('youtube', 'pdf', 'image')),
  title text,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lesson_attachments ENABLE ROW LEVEL SECURITY;

-- RLS: Admins and moderators can manage attachments
CREATE POLICY "Admins can manage lesson attachments"
ON public.lesson_attachments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN class_days cd ON l.class_day_id = cd.id
    JOIN class_months cm ON cd.class_month_id = cm.id
    WHERE l.id = lesson_attachments.lesson_id
    AND can_manage_class(auth.uid(), cm.class_id)
  )
);

-- RLS: Enrolled paid users can view attachments (same as lessons)
CREATE POLICY "Paid users can view attachments"
ON public.lesson_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN class_days cd ON l.class_day_id = cd.id
    JOIN class_months cm ON cd.class_month_id = cm.id
    JOIN classes c ON cm.class_id = c.id
    WHERE l.id = lesson_attachments.lesson_id
    AND (
      -- Admin/mod access
      is_admin_or_mod(auth.uid())
      OR
      -- Private class: just need enrollment
      (c.is_private = true AND EXISTS (
        SELECT 1 FROM class_enrollments ce 
        WHERE ce.class_id = c.id AND ce.user_id = auth.uid() AND ce.status = 'ACTIVE'
      ))
      OR
      -- Public class: need payment
      EXISTS (
        SELECT 1 FROM payments p 
        WHERE p.ref_id = (c.id::text || '-' || cm.year_month)
        AND p.payment_type = 'CLASS_MONTH'
        AND p.status = 'APPROVED'
        AND p.user_id = auth.uid()
      )
    )
  )
);

-- Create index for faster lookups
CREATE INDEX idx_lesson_attachments_lesson_id ON public.lesson_attachments(lesson_id);