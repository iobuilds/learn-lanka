import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SMSRequest {
  type?: 'rank_results_published' | 'schedule_published' | 'generic';
  template_key?: string;
  targetUsers?: string[]; // user IDs
  classId?: string;
  rankPaperId?: string; // For rank paper result notifications
  classDayId?: string; // For class day specific notifications
  previousMonthOnly?: boolean; // Only send to students who paid in previous month
  previousMonth?: string; // Format: YYYY-MM
  variables?: Record<string, string>; // Variables to replace in template
  data?: Record<string, any>; // Additional data for specialized notifications
}

// Replace template variables with actual values
function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
  }
  return result;
}

// Handle SMS for rank paper results - sends to eligible students only
async function handleRankResultsSMS(
  supabase: any, 
  rankPaperId: string, 
  classId: string | null | undefined, 
  data: Record<string, any>,
  textlkToken: string,
  textlkSenderId: string
): Promise<{ success: boolean; sent?: number; failed?: number; message?: string }> {
  const eligibleUserIds = new Set<string>();

  // 1. Get students who attempted (and thus paid for) this rank paper
  const { data: attempts } = await supabase
    .from('rank_attempts')
    .select('user_id')
    .eq('rank_paper_id', rankPaperId);
  
  attempts?.forEach((a: any) => eligibleUserIds.add(a.user_id));

  // 2. If paper is linked to a class, get private class enrolled students
  if (classId) {
    const { data: classInfo } = await supabase
      .from('classes')
      .select('is_private')
      .eq('id', classId)
      .single();

    if (classInfo?.is_private) {
      // Get all active enrollments for private class
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select('user_id')
        .eq('class_id', classId)
        .eq('status', 'ACTIVE');
      
      enrollments?.forEach((e: any) => eligibleUserIds.add(e.user_id));
    } else {
      // For public class, get students who have any approved payment for this class
      const { data: payments } = await supabase
        .from('payments')
        .select('user_id')
        .like('ref_id', `${classId}-%`)
        .eq('payment_type', 'CLASS_MONTH')
        .eq('status', 'APPROVED');
      
      payments?.forEach((p: any) => eligibleUserIds.add(p.user_id));
    }
  }

  if (eligibleUserIds.size === 0) {
    return { success: true, message: 'No eligible recipients for rank results SMS' };
  }

  // Get phone numbers
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, phone, first_name')
    .in('id', Array.from(eligibleUserIds));

  if (!profiles || profiles.length === 0) {
    return { success: true, message: 'No profiles found for eligible users' };
  }

  // Compose message
  const message = `📊 Results Published!\n\n${data.paperTitle || 'Rank Paper'} (Grade ${data.grade || ''}) results are now available. Log in to view your score and ranking!\n\n🔗 rankpapers.lk`;

  // Send SMS
  const results = [];
  for (const recipient of profiles) {
    try {
      let phone = recipient.phone.replace(/\s+/g, '');
      if (phone.startsWith('0')) phone = '94' + phone.substring(1);
      if (!phone.startsWith('94') && !phone.startsWith('+94')) phone = '94' + phone;
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
      results.push({ userId: recipient.id, success: response.ok });
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      results.push({ userId: recipient.id, success: false });
    }
  }

  return {
    success: true,
    sent: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
  };
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
    const { type, template_key, targetUsers, classId, rankPaperId, classDayId, previousMonthOnly, previousMonth, variables = {}, data = {} } = body;

    // Handle rank paper results published - specialized logic
    if (type === 'rank_results_published' && rankPaperId) {
      const result = await handleRankResultsSMS(supabase, rankPaperId, classId, data, textlkToken!, textlkSenderId);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // If classDayId is provided, fetch class day details for time variables
    let classDayDetails: { date: string; start_time: string | null; end_time: string | null; title: string; class_name: string } | null = null;
    if (classDayId) {
      const { data: classDay } = await supabase
        .from('class_days')
        .select(`
          date, start_time, end_time, title,
          class_months!inner(classes!inner(title))
        `)
        .eq('id', classDayId)
        .single();
      
      if (classDay) {
        classDayDetails = {
          date: classDay.date,
          start_time: classDay.start_time,
          end_time: classDay.end_time,
          title: classDay.title,
          class_name: (classDay.class_months as any)?.classes?.title || ''
        };
      }
    }

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
      // Get enrolled users
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select('user_id, profiles!inner(id, phone, first_name)')
        .eq('class_id', classId)
        .eq('status', 'ACTIVE');
      
      let enrolledUsers = enrollments?.map((e: any) => ({ 
        phone: e.profiles.phone, 
        userId: e.profiles.id, 
        firstName: e.profiles.first_name 
      })) || [];

      // If previousMonthOnly is set, filter to only students who paid last month
      if (previousMonthOnly && previousMonth && enrolledUsers.length > 0) {
        // Get the class month for previous month
        const { data: prevClassMonth } = await supabase
          .from('class_months')
          .select('id')
          .eq('class_id', classId)
          .eq('year_month', previousMonth)
          .maybeSingle();

        if (prevClassMonth) {
          // Get users who have approved payments for that month
          const { data: paidPayments } = await supabase
            .from('payments')
            .select('user_id')
            .eq('ref_id', prevClassMonth.id)
            .eq('payment_type', 'CLASS_FEE')
            .eq('status', 'APPROVED');

          const paidUserIds = new Set(paidPayments?.map(p => p.user_id) || []);
          
          // Filter enrolled users to only those who paid
          enrolledUsers = enrolledUsers.filter(u => paidUserIds.has(u.userId));
          
          console.log(`Filtered to ${enrolledUsers.length} users who paid for ${previousMonth}`);
        } else {
          // No class month exists for previous month, don't send any SMS
          console.log(`No class month found for ${previousMonth}, skipping SMS`);
          enrolledUsers = [];
        }
      }

      phoneNumbers = enrolledUsers;
    }

    if (phoneNumbers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No recipients found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Helper function to format time
    const formatTime = (time: string | null): string => {
      if (!time) return '';
      // time is in HH:MM:SS format, convert to HH:MM AM/PM
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    };
    
    // Helper function to format date
    const formatDate = (dateStr: string): string => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    // Send SMS to each recipient
    const results = [];
    for (const recipient of phoneNumbers) {
      try {
        // Build personalized message with variables
        const personalizedVars = {
          ...variables,
          student_name: recipient.firstName || 'Student',
        };
        
        // Add class day details if available
        if (classDayDetails) {
          personalizedVars.class_name = classDayDetails.class_name;
          personalizedVars.date = formatDate(classDayDetails.date);
          personalizedVars.time = classDayDetails.start_time 
            ? (classDayDetails.end_time 
                ? `${formatTime(classDayDetails.start_time)} - ${formatTime(classDayDetails.end_time)}`
                : formatTime(classDayDetails.start_time))
            : 'TBD';
        }
        
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
