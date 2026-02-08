-- Create lesson-materials storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-materials', 'lesson-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy for lesson-materials bucket
CREATE POLICY "Anyone can view lesson materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-materials');

CREATE POLICY "Admins and moderators can upload lesson materials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-materials' 
  AND public.is_admin_or_mod(auth.uid())
);

CREATE POLICY "Admins and moderators can delete lesson materials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lesson-materials' 
  AND public.is_admin_or_mod(auth.uid())
);