-- Add time fields to class_days table for scheduling
ALTER TABLE public.class_days 
ADD COLUMN start_time time,
ADD COLUMN end_time time;