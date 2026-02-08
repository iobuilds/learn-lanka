-- Create class_papers table for daily/weekly downloadable papers
CREATE TABLE public.class_papers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  paper_type TEXT NOT NULL CHECK (paper_type IN ('DAILY', 'WEEKLY')),
  description TEXT,
  pdf_url TEXT NOT NULL,
  publish_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (publish_status IN ('DRAFT', 'PUBLISHED')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.class_papers ENABLE ROW LEVEL SECURITY;

-- Admins and assigned moderators can manage class papers
CREATE POLICY "Admins and moderators can manage class papers"
ON public.class_papers
FOR ALL
USING (can_manage_class(auth.uid(), class_id));

-- Enrolled users can view published papers
CREATE POLICY "Enrolled users can view published papers"
ON public.class_papers
FOR SELECT
USING (
  publish_status = 'PUBLISHED' 
  AND EXISTS (
    SELECT 1 FROM public.class_enrollments ce
    WHERE ce.class_id = class_papers.class_id
    AND ce.user_id = auth.uid()
    AND ce.status = 'ACTIVE'
  )
);

-- Create index for faster queries
CREATE INDEX idx_class_papers_class_id ON public.class_papers(class_id);
CREATE INDEX idx_class_papers_publish_status ON public.class_papers(publish_status);