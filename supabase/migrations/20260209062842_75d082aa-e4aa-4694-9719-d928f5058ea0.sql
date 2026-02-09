-- Add schedule notification tracking column to class_months
ALTER TABLE public.class_months 
ADD COLUMN IF NOT EXISTS schedule_notified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;