-- Create SMS logs table for tracking sent messages
CREATE TABLE public.sms_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    template_key TEXT,
    recipient_phone TEXT NOT NULL,
    recipient_user_id UUID,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    api_response JSONB,
    class_id UUID REFERENCES public.classes(id),
    sent_by UUID,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    error_message TEXT
);

-- Enable RLS
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies - only admins can view logs
CREATE POLICY "Admins can view SMS logs" 
ON public.sms_logs 
FOR SELECT 
USING (public.is_admin_or_mod(auth.uid()));

CREATE POLICY "Admins can insert SMS logs" 
ON public.sms_logs 
FOR INSERT 
WITH CHECK (public.is_admin_or_mod(auth.uid()));

-- Create index for better query performance
CREATE INDEX idx_sms_logs_sent_at ON public.sms_logs(sent_at DESC);
CREATE INDEX idx_sms_logs_class_id ON public.sms_logs(class_id);
CREATE INDEX idx_sms_logs_recipient_user_id ON public.sms_logs(recipient_user_id);