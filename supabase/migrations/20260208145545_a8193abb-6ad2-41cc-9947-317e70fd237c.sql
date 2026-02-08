-- Create table to track read status per user per notification
CREATE TABLE public.user_notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, notification_id)
);

-- Enable RLS
ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

-- Users can insert their own read records
CREATE POLICY "Users can mark notifications as read"
ON public.user_notification_reads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own read records
CREATE POLICY "Users can view own read status"
ON public.user_notification_reads
FOR SELECT
USING (auth.uid() = user_id);

-- Users can delete their own read records
CREATE POLICY "Users can delete own read status"
ON public.user_notification_reads
FOR DELETE
USING (auth.uid() = user_id);

-- Add sms_sent column to notifications to track SMS delivery
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sms_sent boolean DEFAULT false;

-- Add index for faster lookups
CREATE INDEX idx_notification_reads_user ON public.user_notification_reads(user_id);
CREATE INDEX idx_notification_reads_notification ON public.user_notification_reads(notification_id);