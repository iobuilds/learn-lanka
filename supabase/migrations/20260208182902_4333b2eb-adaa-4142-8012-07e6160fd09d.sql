-- Create SMS templates table
CREATE TABLE public.sms_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    template_key TEXT NOT NULL UNIQUE,
    template_name TEXT NOT NULL,
    template_body TEXT NOT NULL,
    description TEXT,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID
);

-- Enable RLS
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active templates" 
ON public.sms_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update templates" 
ON public.sms_templates 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert templates" 
ON public.sms_templates 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_sms_templates_updated_at
BEFORE UPDATE ON public.sms_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.sms_templates (template_key, template_name, template_body, description, variables) VALUES
('payment_approved', 'Payment Approved', 'Your payment of Rs.{amount} for {item} has been verified. Thank you!', 'Sent when admin approves a payment', ARRAY['amount', 'item', 'student_name']),
('payment_rejected', 'Payment Rejected', 'Your payment for {item} was not verified. Please contact us for details.', 'Sent when admin rejects a payment', ARRAY['item', 'student_name', 'reason']),
('rank_paper_published', 'Rank Paper Published', 'New Rank Paper "{paper_title}" is now available! Login to attempt: {link}', 'Sent when a new rank paper is published', ARRAY['paper_title', 'grade', 'link']),
('class_schedule_published', 'Class Schedule Published', 'Class schedule for {month} has been published. Check your dashboard for details.', 'Sent when monthly class schedule is published', ARRAY['class_name', 'month']),
('class_rescheduled', 'Class Rescheduled', 'Class on {old_date} has been rescheduled to {new_date}. Please update your calendar.', 'Sent when a class is rescheduled', ARRAY['class_name', 'old_date', 'new_date']),
('order_confirmed', 'Order Confirmed', 'Your order #{order_id} for Rs.{amount} is confirmed. We will process it soon.', 'Sent when shop order is confirmed', ARRAY['order_id', 'amount', 'student_name']),
('order_shipped', 'Order Shipped', 'Your order #{order_id} has been shipped! Track: {tracking_info}', 'Sent when shop order is shipped', ARRAY['order_id', 'tracking_info']),
('welcome', 'Welcome Message', 'Welcome to our platform, {student_name}! Start learning at {link}', 'Sent to new users after registration', ARRAY['student_name', 'link']);