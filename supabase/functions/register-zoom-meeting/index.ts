import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ZoomTokenResponse {
  access_token: string;
}

interface ZoomRegistrantResponse {
  id: number;
  registrant_id: string;
  join_url: string;
}

async function getZoomAccessToken(): Promise<string> {
  const accountId = Deno.env.get("ZOOM_ACCOUNT_ID");
  const clientId = Deno.env.get("ZOOM_CLIENT_ID");
  const clientSecret = Deno.env.get("ZOOM_CLIENT_SECRET");

  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Zoom credentials not configured");
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Zoom token error:", errorText);
    throw new Error(`Failed to get Zoom access token: ${response.status}`);
  }

  const data: ZoomTokenResponse = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const { classDayId } = await req.json();

    if (!classDayId) {
      return new Response(
        JSON.stringify({ error: "Missing classDayId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if student already has a unique link
    const { data: existingLink, error: existingLinkError } = await supabaseAdmin
      .from("student_meeting_links")
      .select("join_url")
      .eq("class_day_id", classDayId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingLinkError) {
      console.error("Error checking existing meeting link:", existingLinkError);
    }

    if (existingLink?.join_url) {
      return new Response(
        JSON.stringify({ success: true, joinUrl: existingLink.join_url }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get class day info with zoom meeting id
    const { data: classDay, error: classDayError } = await supabaseAdmin
      .from("class_days")
      .select(`
        id,
        zoom_meeting_id,
        class_month:class_month_id (
          class_id
        )
      `)
      .eq("id", classDayId)
      .single();

    if (classDayError || !classDay) {
      return new Response(
        JSON.stringify({ error: "Class day not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!classDay.zoom_meeting_id) {
      return new Response(
        JSON.stringify({ error: "No Zoom meeting configured for this class" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if student has approved payment for this class
    const classId = (classDay.class_month as any)?.class_id;
    const { data: enrollment } = await supabaseAdmin
      .from("class_enrollments")
      .select("id, status")
      .eq("class_id", classId)
      .eq("user_id", userId)
      .single();

    // Check for payment
    const hasAccess = enrollment?.status === "ACTIVE";
    
    if (!hasAccess) {
      // Also check for approved payment
      const { data: payment } = await supabaseAdmin
        .from("payments")
        .select("id")
        .eq("payment_type", "class_monthly")
        .eq("ref_id", classId)
        .eq("user_id", userId)
        .eq("status", "approved")
        .limit(1);

      if (!payment || payment.length === 0) {
        return new Response(
          JSON.stringify({ error: "Payment required to join this class" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get user profile for registration
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("first_name, last_name, phone")
      .eq("id", userId)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Zoom access token and register student
    const accessToken = await getZoomAccessToken();

    // Zoom rejects some "local" domains; ensure a real-looking email
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const authEmail = userData.user.email || "";
    const phoneDigits = (profile.phone || "").replace(/[^\d]/g, "");
    const fallbackEmail = `student-${phoneDigits || userId}@example.com`;
    const email = isValidEmail(authEmail) ? authEmail : fallbackEmail;

    const registerResponse = await fetch(
      `https://api.zoom.us/v2/meetings/${classDay.zoom_meeting_id}/registrants`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          first_name: profile.first_name,
          last_name: profile.last_name || "Student",
        }),
      }
    );

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      console.error("Zoom registration error:", errorText);
      return new Response(
        JSON.stringify({
          error: `Zoom registration failed [${registerResponse.status}]: ${errorText}`,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const registrantData: ZoomRegistrantResponse = await registerResponse.json();

    // Save the unique join link
    const { error: saveError } = await supabaseAdmin
      .from("student_meeting_links")
      .insert({
        class_day_id: classDayId,
        user_id: userId,
        registrant_id: registrantData.registrant_id,
        join_url: registrantData.join_url,
      });

    if (saveError) {
      console.error("Error saving meeting link:", saveError);
    }

    return new Response(
      JSON.stringify({ success: true, joinUrl: registrantData.join_url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
