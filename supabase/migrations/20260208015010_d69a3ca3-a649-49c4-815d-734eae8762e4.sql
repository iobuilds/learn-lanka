-- Add school/zone and medium columns for school exam papers
ALTER TABLE public.papers ADD COLUMN school_or_zone text;
ALTER TABLE public.papers ADD COLUMN medium text;

-- Add comments
COMMENT ON COLUMN public.papers.school_or_zone IS 'School name or zone for school exam papers';
COMMENT ON COLUMN public.papers.medium IS 'Language medium: SINHALA or ENGLISH';