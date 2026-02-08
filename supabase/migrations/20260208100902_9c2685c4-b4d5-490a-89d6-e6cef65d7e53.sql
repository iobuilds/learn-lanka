-- Drop the existing check constraint and add a new one that includes CLOSED
ALTER TABLE public.rank_papers DROP CONSTRAINT IF EXISTS rank_papers_publish_status_check;

ALTER TABLE public.rank_papers ADD CONSTRAINT rank_papers_publish_status_check 
  CHECK (publish_status IN ('DRAFT', 'PUBLISHED', 'CLOSED'));