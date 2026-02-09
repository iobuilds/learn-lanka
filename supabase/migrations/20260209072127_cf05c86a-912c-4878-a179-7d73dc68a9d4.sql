-- Drop the overly permissive policy
DROP POLICY "Service role can manage meeting links" ON public.student_meeting_links;

-- Create proper policies - edge functions use service role which bypasses RLS
-- So we only need policies for authenticated users

-- Allow admins/moderators to view all meeting links
CREATE POLICY "Admins can view all meeting links"
ON public.student_meeting_links
FOR SELECT
USING (public.is_admin_or_mod(auth.uid()));