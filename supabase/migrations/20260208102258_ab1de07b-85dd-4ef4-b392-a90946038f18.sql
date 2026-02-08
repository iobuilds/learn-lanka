-- Add cheat tracking columns to rank_attempts table
ALTER TABLE public.rank_attempts 
ADD COLUMN IF NOT EXISTS tab_switch_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS window_close_count integer NOT NULL DEFAULT 0;