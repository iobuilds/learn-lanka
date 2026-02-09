-- Add is_conducted field to class_days table for tracking if class was held
ALTER TABLE public.class_days 
ADD COLUMN is_conducted boolean NOT NULL DEFAULT false;

-- Add conducted_at timestamp
ALTER TABLE public.class_days 
ADD COLUMN conducted_at timestamp with time zone DEFAULT NULL;

-- Add conducted_by to track who marked it
ALTER TABLE public.class_days 
ADD COLUMN conducted_by uuid DEFAULT NULL;