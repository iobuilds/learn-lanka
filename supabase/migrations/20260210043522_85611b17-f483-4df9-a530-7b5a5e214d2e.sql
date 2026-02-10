
-- Create site_settings table for persisting admin settings
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON public.site_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', 'ICT Academy'),
  ('contact_phone', '0771112233'),
  ('contact_email', 'info@ictacademy.lk')
ON CONFLICT (key) DO NOTHING;

-- Seed default SMS templates (for VPS deployments)
INSERT INTO public.sms_templates (template_key, template_name, template_body, description, variables, is_active) VALUES
  ('class_schedule_reminder', 'Class Schedule Reminder', 'Reminder: Your {class_name} class is scheduled on {date} at {time}. Don''t miss it!', 'Sent to remind students about upcoming classes', '{class_name,date,time}', true),
  ('class_schedule_change', 'Class Schedule Changed', 'Notice: Your {class_name} class on {old_date} has been rescheduled to {new_date} at {new_time}.', 'Sent when class schedule changes', '{class_name,old_date,new_date,new_time}', true),
  ('class_cancelled', 'Class Cancelled', 'Notice: Your {class_name} class on {date} has been cancelled. {reason}', 'Sent when a class is cancelled', '{class_name,date,reason}', true),
  ('new_class_scheduled', 'New Class Scheduled', 'New class scheduled! {class_name} on {date} at {time}. See you there!', 'Sent when a new class is added', '{class_name,date,time}', true),
  ('payment_reminder', 'Payment Reminder', 'Reminder: Your payment of Rs.{amount} for {class_name} ({month}) is due. Please pay before {due_date}.', 'Monthly payment reminder', '{amount,class_name,month,due_date}', true),
  ('payment_received', 'Payment Received', 'Thank you! Your payment of Rs.{amount} for {class_name} ({month}) has been received and verified.', 'Payment confirmation', '{amount,class_name,month}', true),
  ('payment_rejected', 'Payment Rejected', 'Your payment of Rs.{amount} for {class_name} has been rejected. Reason: {reason}. Please contact us.', 'Payment rejection notice', '{amount,class_name,reason}', true),
  ('rank_paper_available', 'New Rank Paper Available', 'A new ranking test "{paper_title}" is now available! Attempt it before {deadline}.', 'New rank paper notification', '{paper_title,deadline}', true),
  ('welcome_message', 'Welcome Message', 'Welcome to ICT Academy, {name}! We''re glad to have you. Explore classes at {url}.', 'Welcome message for new users', '{name,url}', true),
  ('enrollment_confirmed', 'Enrollment Confirmed', 'You have been enrolled in {class_name}. Monthly fee: Rs.{fee}. Classes start on {start_date}.', 'Enrollment confirmation', '{class_name,fee,start_date}', true)
ON CONFLICT (template_key) DO NOTHING;
