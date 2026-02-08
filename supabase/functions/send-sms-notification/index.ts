import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  type: 'rank_paper_published' | 'payment_status' | 'schedule_published' | 'schedule_rescheduled';
  targetUsers?: string[]; // user IDs
  classId?: string;
  data?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const textlkToken = Deno.env.get('TEXTLK_API_TOKEN');
    const textlkSenderId = Deno.env.get('TEXTLK_SENDER_ID') || 'A/L ICT';

    if (!textlkToken) {
      console.error('TEXTLK_API_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'SMS service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: SMSRequest = await req.json();
    const { type, targetUsers, classId, data } = body;

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

    // Build message based on type
    let message = '';
    switch (type) {
      case 'rank_paper_published':
        message = `📝 New Rank Paper Available!\n\n${data?.title || 'A new paper'} is now available. Grade ${data?.grade || ''}. Time: ${data?.timeLimit || ''}min.\n\nOpen the app to attempt now!`;
        break;
      case 'payment_status':
        message = data?.approved
          ? `✅ Payment Approved!\n\nYour payment of Rs.${data?.amount} has been approved.\n\nThank you!`
          : `❌ Payment Rejected\n\nYour payment was not approved.${data?.reason ? ` Reason: ${data.reason}` : ''}\n\nPlease contact support.`;
        break;
      case 'schedule_published':
        message = `📅 Class Schedule Published!\n\n${data?.className || 'Your class'} schedule for ${data?.month || 'this month'} is now available.\n\nOpen the app to view.`;
        break;
      case 'schedule_rescheduled':
        message = `🔄 Class Rescheduled!\n\n${data?.className || 'Your class'} on ${data?.originalDate || ''} has been rescheduled to ${data?.newDate || ''}.\n\nCheck the app for details.`;
        break;
      default:
        message = data?.message || 'New notification from A/L ICT';
    }

    // Send SMS to each recipient
    const results = [];
    for (const recipient of phoneNumbers) {
      try {
        // Format phone number (ensure it starts with country code)
        let phone = recipient.phone.replace(/\s+/g, '');
        if (phone.startsWith('0')) {
          phone = '94' + phone.substring(1);
        }
        if (!phone.startsWith('+')) {
          phone = '+' + phone;
        }

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
