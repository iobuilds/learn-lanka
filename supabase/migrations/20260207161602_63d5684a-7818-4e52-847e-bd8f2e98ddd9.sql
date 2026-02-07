-- Add restrictive policy for otp_requests (only service role can access)
CREATE POLICY "Service role only" ON public.otp_requests
FOR ALL
USING (false)
WITH CHECK (false);