-- Add access control fields to paper_attachments
ALTER TABLE public.paper_attachments 
ADD COLUMN access_type TEXT NOT NULL DEFAULT 'free' CHECK (access_type IN ('free', 'class', 'users')),
ADD COLUMN class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

-- Create junction table for specific user access
CREATE TABLE public.paper_attachment_user_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attachment_id UUID NOT NULL REFERENCES public.paper_attachments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(attachment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.paper_attachment_user_access ENABLE ROW LEVEL SECURITY;

-- Policies for paper_attachment_user_access
CREATE POLICY "Admins/mods can manage user access"
ON public.paper_attachment_user_access
FOR ALL
USING (public.is_admin_or_mod(auth.uid()));

CREATE POLICY "Users can see their own access"
ON public.paper_attachment_user_access
FOR SELECT
USING (auth.uid() = user_id);

-- Update paper_attachments policies to account for access control
DROP POLICY IF EXISTS "Anyone can view paper attachments" ON public.paper_attachments;

CREATE POLICY "Users can view accessible attachments"
ON public.paper_attachments
FOR SELECT
USING (
  -- Admins/mods see all
  public.is_admin_or_mod(auth.uid())
  OR
  -- Free access
  access_type = 'free'
  OR
  -- Class-based access (enrolled students)
  (access_type = 'class' AND EXISTS (
    SELECT 1 FROM public.class_enrollments ce
    WHERE ce.class_id = paper_attachments.class_id
    AND ce.user_id = auth.uid()
    AND ce.status = 'active'
  ))
  OR
  -- Specific user access
  (access_type = 'users' AND EXISTS (
    SELECT 1 FROM public.paper_attachment_user_access paua
    WHERE paua.attachment_id = paper_attachments.id
    AND paua.user_id = auth.uid()
  ))
);