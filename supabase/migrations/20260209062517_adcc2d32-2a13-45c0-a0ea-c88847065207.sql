-- Create table for rank paper attachments (videos and answer PDFs)
CREATE TABLE public.rank_paper_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rank_paper_id UUID NOT NULL REFERENCES public.rank_papers(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('VIDEO', 'ANSWER_PDF')),
  title TEXT,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rank_paper_attachments ENABLE ROW LEVEL SECURITY;

-- Admins can manage attachments
CREATE POLICY "Admins can manage rank paper attachments"
  ON public.rank_paper_attachments
  FOR ALL
  USING (is_admin_or_mod(auth.uid()));

-- Users can view attachments only after marks are published
CREATE POLICY "Users can view attachments after results published"
  ON public.rank_paper_attachments
  FOR SELECT
  USING (
    is_admin_or_mod(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM rank_attempts ra
      JOIN rank_marks rm ON rm.attempt_id = ra.id
      WHERE ra.rank_paper_id = rank_paper_attachments.rank_paper_id
      AND ra.user_id = auth.uid()
      AND rm.published_at IS NOT NULL
    )
  );

-- Index for faster lookups
CREATE INDEX idx_rank_paper_attachments_paper ON public.rank_paper_attachments(rank_paper_id);

-- Create storage bucket for rank paper answer PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('rank-paper-answers', 'rank-paper-answers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for rank paper answers
CREATE POLICY "Admins can upload rank paper answers"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'rank-paper-answers' AND is_admin_or_mod(auth.uid()));

CREATE POLICY "Admins can update rank paper answers"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'rank-paper-answers' AND is_admin_or_mod(auth.uid()));

CREATE POLICY "Admins can delete rank paper answers"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'rank-paper-answers' AND is_admin_or_mod(auth.uid()));

CREATE POLICY "Anyone can view rank paper answers"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'rank-paper-answers');