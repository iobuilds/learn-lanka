-- Add short_essay_pdf_url column to rank_papers table
ALTER TABLE public.rank_papers 
ADD COLUMN short_essay_pdf_url text;