-- Add RLS policies for shop_products admin management
CREATE POLICY "Admins can insert shop products" 
ON public.shop_products 
FOR INSERT 
WITH CHECK (public.is_admin_or_mod(auth.uid()));

CREATE POLICY "Admins can update shop products" 
ON public.shop_products 
FOR UPDATE 
USING (public.is_admin_or_mod(auth.uid()));

CREATE POLICY "Admins can delete shop products" 
ON public.shop_products 
FOR DELETE 
USING (public.is_admin_or_mod(auth.uid()));

CREATE POLICY "Anyone can view active shop products" 
ON public.shop_products 
FOR SELECT 
USING (is_active = true OR public.is_admin_or_mod(auth.uid()));