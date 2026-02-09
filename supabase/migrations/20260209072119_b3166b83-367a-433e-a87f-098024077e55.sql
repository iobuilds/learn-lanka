-- Add Zoom meeting data to class_days
ALTER TABLE public.class_days 
ADD COLUMN zoom_meeting_id text,
ADD COLUMN zoom_join_url text;

-- Create table to store unique student join links
CREATE TABLE public.student_meeting_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_day_id uuid NOT NULL REFERENCES public.class_days(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  registrant_id text NOT NULL,
  join_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_day_id, user_id)
);

-- Enable RLS
ALTER TABLE public.student_meeting_links ENABLE ROW LEVEL SECURITY;

-- Students can only see their own links
CREATE POLICY "Users can view their own meeting links"
ON public.student_meeting_links
FOR SELECT
USING (auth.uid() = user_id);

-- Edge functions can insert via service role
CREATE POLICY "Service role can manage meeting links"
ON public.student_meeting_links
FOR ALL
USING (true)
WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_student_meeting_links_class_day_user 
ON public.student_meeting_links(class_day_id, user_id);