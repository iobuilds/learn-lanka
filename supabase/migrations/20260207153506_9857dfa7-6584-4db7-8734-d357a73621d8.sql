-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'student');

-- Create user roles table (security best practice - separate from profiles)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    school_name TEXT,
    birthday DATE,
    address TEXT,
    grade INTEGER CHECK (grade >= 6 AND grade <= 13),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classes table
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    grade_min INTEGER NOT NULL CHECK (grade_min >= 6 AND grade_min <= 13),
    grade_max INTEGER NOT NULL CHECK (grade_max >= 6 AND grade_max <= 13),
    monthly_fee_amount INTEGER NOT NULL DEFAULT 0,
    is_private BOOLEAN NOT NULL DEFAULT false,
    private_code TEXT,
    admin_otp_phone TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create class enrollments table
CREATE TABLE public.class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REMOVED')),
    UNIQUE (class_id, user_id)
);

-- Create class months table
CREATE TABLE public.class_months (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    year_month TEXT NOT NULL, -- Format: YYYY-MM
    monthly_fee_override INTEGER,
    UNIQUE (class_id, year_month)
);

-- Create payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('CLASS_MONTH', 'RANK_PAPER', 'SHOP_ORDER')),
    ref_id UUID NOT NULL, -- References class_month_id, rank_paper_id, or shop_order_id
    amount INTEGER NOT NULL,
    slip_url TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bank accounts table
CREATE TABLE public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    branch TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rank papers table
CREATE TABLE public.rank_papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    grade INTEGER NOT NULL CHECK (grade >= 6 AND grade <= 13),
    class_id UUID REFERENCES public.classes(id),
    fee_amount INTEGER,
    time_limit_minutes INTEGER NOT NULL DEFAULT 180,
    has_mcq BOOLEAN NOT NULL DEFAULT false,
    has_short_essay BOOLEAN NOT NULL DEFAULT false,
    has_essay BOOLEAN NOT NULL DEFAULT false,
    essay_pdf_url TEXT,
    review_video_url TEXT,
    publish_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (publish_status IN ('DRAFT', 'PUBLISHED')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create MCQ questions table
CREATE TABLE public.rank_mcq_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rank_paper_id UUID REFERENCES public.rank_papers(id) ON DELETE CASCADE NOT NULL,
    q_no INTEGER NOT NULL CHECK (q_no >= 1 AND q_no <= 50),
    question_text TEXT,
    question_image_url TEXT,
    UNIQUE (rank_paper_id, q_no)
);

-- Create MCQ options table
CREATE TABLE public.rank_mcq_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES public.rank_mcq_questions(id) ON DELETE CASCADE NOT NULL,
    option_no INTEGER NOT NULL CHECK (option_no >= 1 AND option_no <= 5),
    option_text TEXT,
    option_image_url TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (question_id, option_no)
);

-- Create rank attempts table
CREATE TABLE public.rank_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rank_paper_id UUID REFERENCES public.rank_papers(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    auto_closed BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (rank_paper_id, user_id)
);

-- Create MCQ answers table
CREATE TABLE public.rank_answers_mcq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES public.rank_attempts(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.rank_mcq_questions(id) ON DELETE CASCADE NOT NULL,
    selected_option_no INTEGER,
    UNIQUE (attempt_id, question_id)
);

-- Create essay uploads table
CREATE TABLE public.rank_answers_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES public.rank_attempts(id) ON DELETE CASCADE NOT NULL,
    upload_type TEXT NOT NULL CHECK (upload_type IN ('SHORT_ESSAY', 'ESSAY')),
    pdf_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rank marks table
CREATE TABLE public.rank_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES public.rank_attempts(id) ON DELETE CASCADE NOT NULL UNIQUE,
    mcq_score INTEGER DEFAULT 0,
    short_essay_score INTEGER DEFAULT 0,
    essay_score INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    reviewed_by UUID REFERENCES auth.users(id),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_mcq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_mcq_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_answers_mcq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_answers_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_marks ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin or moderator
CREATE OR REPLACE FUNCTION public.is_admin_or_mod(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'moderator')
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin_or_mod(auth.uid()));

-- RLS Policies for classes (public read)
CREATE POLICY "Anyone can view classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage classes" ON public.classes FOR ALL USING (public.is_admin_or_mod(auth.uid()));

-- RLS Policies for enrollments
CREATE POLICY "Users can view own enrollments" ON public.class_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll themselves" ON public.class_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage enrollments" ON public.class_enrollments FOR ALL USING (public.is_admin_or_mod(auth.uid()));

-- RLS Policies for class_months (authenticated read)
CREATE POLICY "Authenticated can view class months" ON public.class_months FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage class months" ON public.class_months FOR ALL USING (public.is_admin_or_mod(auth.uid()));

-- RLS Policies for payments
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL USING (public.is_admin_or_mod(auth.uid()));

-- RLS Policies for bank_accounts (public read for active)
CREATE POLICY "Anyone can view active bank accounts" ON public.bank_accounts FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage bank accounts" ON public.bank_accounts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for rank_papers (published papers public)
CREATE POLICY "View published rank papers" ON public.rank_papers FOR SELECT TO authenticated USING (publish_status = 'PUBLISHED' OR public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can manage rank papers" ON public.rank_papers FOR ALL USING (public.is_admin_or_mod(auth.uid()));

-- RLS Policies for MCQ questions and options
CREATE POLICY "View MCQ questions for published papers" ON public.rank_mcq_questions FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.rank_papers WHERE id = rank_paper_id AND (publish_status = 'PUBLISHED' OR public.is_admin_or_mod(auth.uid()))));
CREATE POLICY "Admins can manage MCQ questions" ON public.rank_mcq_questions FOR ALL USING (public.is_admin_or_mod(auth.uid()));

CREATE POLICY "View MCQ options" ON public.rank_mcq_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage MCQ options" ON public.rank_mcq_options FOR ALL USING (public.is_admin_or_mod(auth.uid()));

-- RLS Policies for rank attempts
CREATE POLICY "Users can view own attempts" ON public.rank_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own attempts" ON public.rank_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attempts" ON public.rank_attempts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all attempts" ON public.rank_attempts FOR SELECT USING (public.is_admin_or_mod(auth.uid()));

-- RLS Policies for MCQ answers
CREATE POLICY "Users can manage own MCQ answers" ON public.rank_answers_mcq FOR ALL USING (
  EXISTS (SELECT 1 FROM public.rank_attempts WHERE id = attempt_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can view MCQ answers" ON public.rank_answers_mcq FOR SELECT USING (public.is_admin_or_mod(auth.uid()));

-- RLS Policies for essay uploads
CREATE POLICY "Users can manage own essay uploads" ON public.rank_answers_uploads FOR ALL USING (
  EXISTS (SELECT 1 FROM public.rank_attempts WHERE id = attempt_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can view essay uploads" ON public.rank_answers_uploads FOR SELECT USING (public.is_admin_or_mod(auth.uid()));

-- RLS Policies for rank marks
CREATE POLICY "Users can view own marks when published" ON public.rank_marks FOR SELECT USING (
  published_at IS NOT NULL AND EXISTS (SELECT 1 FROM public.rank_attempts WHERE id = attempt_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage marks" ON public.rank_marks FOR ALL USING (public.is_admin_or_mod(auth.uid()));

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  -- Auto-assign student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for payment slips
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-slips', 'payment-slips', false);

-- Create storage bucket for essay uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('essay-uploads', 'essay-uploads', false);

-- Storage policies for payment slips
CREATE POLICY "Users can upload own slips" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'payment-slips' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own slips" ON storage.objects FOR SELECT 
USING (bucket_id = 'payment-slips' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin_or_mod(auth.uid())));

-- Storage policies for essay uploads
CREATE POLICY "Users can upload own essays" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'essay-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own essays" ON storage.objects FOR SELECT 
USING (bucket_id = 'essay-uploads' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin_or_mod(auth.uid())));

-- Insert default bank accounts
INSERT INTO public.bank_accounts (bank_name, account_name, account_number, branch) VALUES
('Bank of Ceylon', 'ICT Academy', '12345678901234', 'Colombo Main'),
('Commercial Bank', 'ICT Academy', '98765432109876', 'Kollupitiya');

-- Insert sample classes
INSERT INTO public.classes (title, description, grade_min, grade_max, monthly_fee_amount, is_private) VALUES
('A/L ICT 2026 Batch', 'Comprehensive ICT course for A/L students preparing for the 2026 examination. Covers all units including programming, databases, and networking.', 12, 13, 3500, false),
('O/L ICT 2025 Batch', 'Complete O/L ICT preparation course with practical exercises and model papers.', 10, 11, 2500, false),
('Grade 9 ICT Foundation', 'Build a strong foundation in ICT concepts for Grade 9 students.', 9, 9, 2000, false);