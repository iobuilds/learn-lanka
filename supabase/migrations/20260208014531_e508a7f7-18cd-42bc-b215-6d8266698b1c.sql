-- Make grade nullable for past papers
ALTER TABLE public.papers ALTER COLUMN grade DROP NOT NULL;

-- Add term column for school exam papers
ALTER TABLE public.papers ADD COLUMN term integer;

-- Add comment
COMMENT ON COLUMN public.papers.term IS 'Term number (1, 2, 3) for school exam papers';