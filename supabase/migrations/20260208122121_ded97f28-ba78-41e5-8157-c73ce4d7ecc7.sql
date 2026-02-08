-- Add review materials columns to class_papers
ALTER TABLE public.class_papers
ADD COLUMN review_video_url TEXT,
ADD COLUMN answer_pdf_url TEXT;