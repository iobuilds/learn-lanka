-- Create downloadable papers table (past papers, school exams)
CREATE TABLE public.papers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  paper_type TEXT NOT NULL CHECK (paper_type IN ('PAST_PAPER', 'SCHOOL_EXAM', 'MODEL_PAPER', 'OTHER')),
  grade INTEGER NOT NULL,
  year INTEGER,
  subject TEXT DEFAULT 'ICT',
  pdf_url TEXT NOT NULL,
  is_free BOOLEAN NOT NULL DEFAULT false,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;

-- Admins can manage papers
CREATE POLICY "Admins can manage papers" 
ON public.papers 
FOR ALL 
USING (is_admin_or_mod(auth.uid()));

-- Anyone can view papers (download access controlled in app)
CREATE POLICY "Anyone can view papers" 
ON public.papers 
FOR SELECT 
USING (true);

-- Create storage bucket for papers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('papers', 'papers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for papers bucket
CREATE POLICY "Admins can upload papers" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'papers' AND is_admin_or_mod(auth.uid()));

CREATE POLICY "Admins can update papers" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'papers' AND is_admin_or_mod(auth.uid()));

CREATE POLICY "Admins can delete papers" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'papers' AND is_admin_or_mod(auth.uid()));

CREATE POLICY "Anyone can view papers files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'papers');