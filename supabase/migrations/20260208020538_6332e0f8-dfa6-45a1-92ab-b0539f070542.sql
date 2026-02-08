-- Create moderator_class_assignments table
CREATE TABLE public.moderator_class_assignments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    moderator_id uuid NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    assigned_at timestamp with time zone NOT NULL DEFAULT now(),
    assigned_by uuid,
    UNIQUE(moderator_id, class_id)
);

-- Enable RLS
ALTER TABLE public.moderator_class_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for moderator_class_assignments
CREATE POLICY "Admins can manage assignments"
ON public.moderator_class_assignments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can view own assignments"
ON public.moderator_class_assignments FOR SELECT
TO authenticated
USING (moderator_id = auth.uid());

-- Create helper function to check if user can manage a class
CREATE OR REPLACE FUNCTION public.can_manage_class(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admins can manage all classes
    public.has_role(_user_id, 'admin')
    OR
    -- Moderators can manage assigned classes
    (public.has_role(_user_id, 'moderator') AND EXISTS (
      SELECT 1 FROM public.moderator_class_assignments
      WHERE moderator_id = _user_id AND class_id = _class_id
    ))
$$;

-- Update classes policies to use the new function
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
CREATE POLICY "Admins and assigned moderators can manage classes"
ON public.classes FOR ALL
TO authenticated
USING (public.can_manage_class(auth.uid(), id));

-- Update class_months policies
DROP POLICY IF EXISTS "Admins can manage class months" ON public.class_months;
CREATE POLICY "Admins and assigned moderators can manage class months"
ON public.class_months FOR ALL
TO authenticated
USING (public.can_manage_class(auth.uid(), class_id));

-- Update class_days policies (need to check via class_months -> class_id)
DROP POLICY IF EXISTS "Admins can manage class days" ON public.class_days;
CREATE POLICY "Admins and assigned moderators can manage class days"
ON public.class_days FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.class_months cm
  WHERE cm.id = class_days.class_month_id
  AND public.can_manage_class(auth.uid(), cm.class_id)
));

-- Update lessons policies (need to check via class_days -> class_months -> class_id)
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
CREATE POLICY "Admins and assigned moderators can manage lessons"
ON public.lessons FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.class_days cd
  JOIN public.class_months cm ON cm.id = cd.class_month_id
  WHERE cd.id = lessons.class_day_id
  AND public.can_manage_class(auth.uid(), cm.class_id)
));