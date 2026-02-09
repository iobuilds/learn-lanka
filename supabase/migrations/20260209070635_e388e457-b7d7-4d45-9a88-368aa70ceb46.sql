-- Add meeting link field to class_days
ALTER TABLE public.class_days 
ADD COLUMN meeting_link TEXT,
ADD COLUMN meeting_link_notified_at TIMESTAMP WITH TIME ZONE;