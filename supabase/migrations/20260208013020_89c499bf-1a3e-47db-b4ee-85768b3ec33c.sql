-- Add coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
  discount_value INTEGER NOT NULL,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- RLS policies for coupons
CREATE POLICY "Admins can manage coupons" 
ON public.coupons 
FOR ALL 
USING (is_admin_or_mod(auth.uid()));

CREATE POLICY "Anyone can view active coupons" 
ON public.coupons 
FOR SELECT 
USING (is_active = true);

-- Add coupon usage tracking
CREATE TABLE public.coupon_usages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  payment_id UUID REFERENCES public.payments(id),
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view coupon usages" 
ON public.coupon_usages 
FOR SELECT 
USING (is_admin_or_mod(auth.uid()));

CREATE POLICY "Users can create own coupon usage" 
ON public.coupon_usages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add image_url, private_code, and max_students to classes
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS max_students INTEGER;

-- Generate private codes for existing private classes that don't have one
UPDATE public.classes 
SET private_code = upper(substring(md5(random()::text) from 1 for 8))
WHERE is_private = true AND private_code IS NULL;