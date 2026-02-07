-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('ALL', 'CLASS', 'USER')),
  target_ref UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Everyone can view notifications targeted to ALL or their enrolled classes
CREATE POLICY "Users can view relevant notifications"
ON public.notifications
FOR SELECT
USING (
  target_type = 'ALL' OR
  (target_type = 'CLASS' AND EXISTS (
    SELECT 1 FROM class_enrollments ce 
    WHERE ce.user_id = auth.uid() AND ce.class_id = notifications.target_ref
  )) OR
  (target_type = 'USER' AND target_ref = auth.uid()) OR
  is_admin_or_mod(auth.uid())
);

CREATE POLICY "Admins can manage notifications"
ON public.notifications
FOR ALL
USING (is_admin_or_mod(auth.uid()));

-- Create shop_products table
CREATE TABLE public.shop_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('SOFT', 'PRINTED', 'BOTH')),
  price_soft INTEGER,
  price_printed INTEGER,
  price_both INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
ON public.shop_products
FOR SELECT
USING (is_active = true OR is_admin_or_mod(auth.uid()));

CREATE POLICY "Admins can manage products"
ON public.shop_products
FOR ALL
USING (is_admin_or_mod(auth.uid()));

-- Create class_days table (class schedule)
CREATE TABLE public.class_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_month_id UUID NOT NULL REFERENCES class_months(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  is_extra BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.class_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view class days"
ON public.class_days
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage class days"
ON public.class_days
FOR ALL
USING (is_admin_or_mod(auth.uid()));

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_day_id UUID NOT NULL REFERENCES class_days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  notes_text TEXT,
  pdf_url TEXT,
  youtube_url TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Users can view lessons only if they've paid for that month
CREATE POLICY "Paid users can view lessons"
ON public.lessons
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM class_days cd
    JOIN class_months cm ON cd.class_month_id = cm.id
    JOIN payments p ON p.ref_id = cm.id AND p.payment_type = 'CLASS_MONTHLY' AND p.status = 'APPROVED'
    WHERE cd.id = lessons.class_day_id AND p.user_id = auth.uid()
  ) OR is_admin_or_mod(auth.uid())
);

CREATE POLICY "Admins can manage lessons"
ON public.lessons
FOR ALL
USING (is_admin_or_mod(auth.uid()));