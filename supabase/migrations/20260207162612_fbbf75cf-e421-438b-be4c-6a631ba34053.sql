-- Fix: The restrictive ALL policy blocks users from seeing their own roles
-- Drop and recreate with proper permissions

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Permissive SELECT policy - users can see their own roles
CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Permissive SELECT for admins to see all roles  
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Restrictive policy only for modifications (INSERT/UPDATE/DELETE)
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));