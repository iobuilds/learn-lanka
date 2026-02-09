-- Create paper_attachments table for review videos and additional PDFs
CREATE TABLE public.paper_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('VIDEO', 'PDF')),
  title TEXT,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.paper_attachments ENABLE ROW LEVEL SECURITY;

-- Admins can manage paper attachments
CREATE POLICY "Admins can manage paper attachments"
  ON public.paper_attachments
  FOR ALL
  USING (is_admin_or_mod(auth.uid()));

-- Anyone can view paper attachments (papers are public)
CREATE POLICY "Anyone can view paper attachments"
  ON public.paper_attachments
  FOR SELECT
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_paper_attachments_paper_id ON public.paper_attachments(paper_id);