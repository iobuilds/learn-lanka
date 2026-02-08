import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SMSRequest {
  template_key: string;
  targetUsers?: string[]; // user IDs
  classId?: string;
  variables?: Record<string, string>; // Variables to replace in template
}

// Replace template variables with actual values
function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const textlkToken = Deno.env.get('TEXTLK_API_TOKEN');
    const textlkSenderId = Deno.env.get('TEXTLK_SENDER_ID') || 'TextLK';

    if (!textlkToken) {
      console.error('TEXTLK_API_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'SMS service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: SMSRequest = await req.json();
    const { template_key, targetUsers, classId, variables = {} } = body;

    // Fetch template from database
    const { data: template, error: templateError } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('template_key', template_key)
      .eq('is_active', true)
      .maybeSingle();

    if (templateError) {
      console.error('Template fetch error:', templateError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch template' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!template) {
      return new Response(
        JSON.stringify({ error: `Template "${template_key}" not found or inactive` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get target phone numbers
    let phoneNumbers: { phone: string; userId: string; firstName: string }[] = [];

    if (targetUsers && targetUsers.length > 0) {
      // Specific users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, phone, first_name')
        .in('id', targetUsers);
      
      phoneNumbers = profiles?.map(p => ({ 
        phone: p.phone, 
        userId: p.id, 
        firstName: p.first_name 
      })) || [];
    } else if (classId) {
      // All enrolled users in a class
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select('user_id, profiles!inner(id, phone, first_name)')
        .eq('class_id', classId)
        .eq('status', 'ACTIVE');
      
      phoneNumbers = enrollments?.map((e: any) => ({ 
        phone: e.profiles.phone, 
        userId: e.profiles.id, 
        firstName: e.profiles.first_name 
      })) || [];
    }

    if (phoneNumbers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No recipients found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send SMS to each recipient
    const results = [];
    for (const recipient of phoneNumbers) {
      try {
        // Build personalized message with variables
        const personalizedVars = {
          ...variables,
          student_name: recipient.firstName || 'Student',
        };
        const message = replaceVariables(template.template_body, personalizedVars);

        // Format phone number (ensure it starts with country code)
        let phone = recipient.phone.replace(/\s+/g, '');
        if (phone.startsWith('0')) {
          phone = '94' + phone.substring(1);
        }
        if (!phone.startsWith('94') && !phone.startsWith('+94')) {
          phone = '94' + phone;
        }
        // Remove + prefix for API
        phone = phone.replace(/^\+/, '');

        const response = await fetch('https://app.text.lk/api/v3/sms/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${textlkToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            recipient: phone,
            sender_id: textlkSenderId,
            type: 'plain',
            message: message,
          }),
        });

        const result = await response.json();
        results.push({ userId: recipient.userId, phone, success: response.ok, result });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to send SMS to ${recipient.phone}:`, error);
        results.push({ userId: recipient.userId, phone: recipient.phone, success: false, error: String(error) });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        template_used: template_key,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SMS notification error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
