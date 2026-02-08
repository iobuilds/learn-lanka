import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BulkSmsRequest {
  recipients: string[]; // Array of phone numbers
  message: string;
  schedule_time?: string; // Optional: "YYYY-MM-DD HH:mm" format
  class_id?: string; // Optional: for logging purposes
  sent_by?: string; // User ID of sender
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TEXTLK_API_TOKEN = Deno.env.get("TEXTLK_API_TOKEN");
    const TEXTLK_SENDER_ID = Deno.env.get("TEXTLK_SENDER_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!TEXTLK_API_TOKEN) {
      throw new Error("TEXTLK_API_TOKEN is not configured");
    }
    if (!TEXTLK_SENDER_ID) {
      throw new Error("TEXTLK_SENDER_ID is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { recipients, message, schedule_time, class_id, sent_by }: BulkSmsRequest = await req.json();

    if (!recipients || recipients.length === 0) {
      throw new Error("No recipients provided");
    }
    if (!message || message.trim() === "") {
      throw new Error("Message cannot be empty");
    }

    // Format phone numbers - ensure they start with 94 (Sri Lanka)
    const formattedRecipients = recipients.map(phone => {
      let cleaned = phone.replace(/\D/g, '');
      if (cleaned.startsWith('0')) {
        cleaned = '94' + cleaned.substring(1);
      }
      if (!cleaned.startsWith('94')) {
        cleaned = '94' + cleaned;
      }
      return cleaned;
    });

    // Join recipients with comma for API
    const recipientString = formattedRecipients.join(',');

    console.log(`Sending bulk SMS to ${formattedRecipients.length} recipients`);

    // Build request body
    const requestBody: Record<string, string> = {
      recipient: recipientString,
      sender_id: TEXTLK_SENDER_ID,
      type: "plain",
      message: message,
    };

    if (schedule_time) {
      requestBody.schedule_time = schedule_time;
    }

    const response = await fetch("https://app.text.lk/api/v3/sms/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TEXTLK_API_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    const success = response.ok;

    console.log("Bulk SMS response:", responseData);

    // Log each SMS to the database
    const logsToInsert = formattedRecipients.map(phone => ({
      recipient_phone: phone,
      message: message,
      status: success ? 'sent' : 'failed',
      api_response: responseData,
      class_id: class_id || null,
      sent_by: sent_by || null,
      error_message: success ? null : (responseData.message || 'Unknown error'),
    }));

    // Insert logs (don't fail if logging fails)
    try {
      await supabase.from('sms_logs').insert(logsToInsert);
    } catch (logError) {
      console.error("Failed to log SMS:", logError);
    }

    if (!success) {
      console.error("Text.lk API error:", responseData);
      throw new Error(responseData.message || `SMS API error: ${response.status}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        recipients_count: formattedRecipients.length,
        data: responseData 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending bulk SMS:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
