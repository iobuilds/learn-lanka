-- Create OTP requests table for phone verification
CREATE TABLE IF NOT EXISTS public.otp_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('REGISTER', 'LOGIN', 'RECOVERY', 'PRIVATE_ENROLL')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint per phone and purpose
  UNIQUE(phone, purpose)
);

-- Enable RLS
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;

-- Only service role can access (edge functions use service role)
-- No public policies needed as this is internal