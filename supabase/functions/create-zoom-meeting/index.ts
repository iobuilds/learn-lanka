import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ZoomMeetingResponse {
  id: number;
  join_url: string;
  registration_url?: string;
  topic: string;
}

type ZoomUser = {
  id: string;
  email: string;
  type: number; // 1 basic, 2 licensed, 3 on-prem
};

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
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Zoom token error:", errorText);
    throw new Error(`Failed to get Zoom access token: ${response.status}`);
  }

  const data: ZoomTokenResponse = await response.json();
  return data.access_token;
}

async function getLicensedZoomHostUserId(accessToken: string): Promise<string> {
  const resp = await fetch("https://api.zoom.us/v2/users?status=active&page_size=100", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Failed to list Zoom users [${resp.status}]: ${t}`);
  }

  const data = await resp.json();
  const users = (data?.users || []) as ZoomUser[];
  const licensed = users.find((u) => u.type === 2 || u.type === 3);

  if (!licensed?.id) {
    throw new Error(
      "No licensed Zoom users found. Please upgrade Zoom to Pro and assign a license to at least one user.",
    );
  }

  return licensed.id;
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

    // Verify user is admin/moderator
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleCheck } = await supabase.rpc("is_admin_or_mod", {
      _user_id: userData.user.id,
    });

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { classDayId, topic, startTime, duration = 60 } = await req.json();

    if (!classDayId || !topic || !startTime) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: classDayId, topic, startTime" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Zoom access token
    const accessToken = await getZoomAccessToken();

    // IMPORTANT: meeting registration APIs require a licensed (paid) Zoom host user.
    // If you create meetings under a "Basic" user, adding registrants will fail.
    const hostUserId = await getLicensedZoomHostUserId(accessToken);

    // Create Zoom meeting with registration required
    const meetingResponse = await fetch(
      `https://api.zoom.us/v2/users/${encodeURIComponent(hostUserId)}/meetings`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      body: JSON.stringify({
        topic,
        type: 2, // Scheduled meeting
        start_time: startTime, // ISO 8601 format
        duration,
        timezone: "Asia/Colombo",
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          approval_type: 0, // Automatically approve registrants
          registration_type: 1, // Register once for this meeting
          registrants_confirmation_email: false,
          registrants_email_notification: false,
          // Prevent sharing - each registrant gets unique link
          meeting_authentication: false,
        },
      }),
    });

    if (!meetingResponse.ok) {
      const errorText = await meetingResponse.text();
      console.error("Zoom meeting creation error:", errorText);
      return new Response(
        JSON.stringify({
          error: `Zoom meeting creation failed [${meetingResponse.status}]: ${errorText}`,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const meetingData: ZoomMeetingResponse = await meetingResponse.json();

    // Update class_day with zoom meeting info using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: updateError } = await supabaseAdmin
      .from("class_days")
      .update({
        zoom_meeting_id: meetingData.id.toString(),
        zoom_join_url: meetingData.registration_url || meetingData.join_url,
        meeting_link: meetingData.registration_url || meetingData.join_url,
      })
      .eq("id", classDayId);

    if (updateError) {
      console.error("Error updating class day:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to save meeting info" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        meetingId: meetingData.id,
        joinUrl: meetingData.registration_url || meetingData.join_url,
      }),
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
