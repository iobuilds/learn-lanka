import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, phone, newPassword } = await req.json();

    if (!newPassword) {
      return new Response(
        JSON.stringify({ success: false, error: "New password is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userId && !phone) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID or phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Resolve target user id (prefer explicit userId; otherwise look up by phone)
    let targetUserId: string | null = userId ?? null;

    if (!targetUserId) {
      const rawPhone = typeof phone === "string" ? phone.trim() : "";
      const digits = rawPhone.replace(/\D/g, "");

      const variants = new Set<string>();
      const add = (v?: string) => {
        if (v) variants.add(v);
      };

      add(digits);
      if (digits.length === 9) add(`0${digits}`);
      if (digits.length === 10 && digits.startsWith("0")) add(digits.slice(1));
      if (digits.length === 11 && digits.startsWith("94")) add(`0${digits.slice(2)}`);
      if (rawPhone.includes("@")) add(rawPhone.split("@")[0]);

      const orParts: string[] = [];
      for (const v of variants) {
        orParts.push(`phone.eq.${v}`, `phone.ilike.${v}@phone.%`);
      }

      if (!orParts.length) {
        return new Response(
          JSON.stringify({ success: false, error: "Valid phone number is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .or(orParts.join(","))
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile?.id) {
        return new Response(
          JSON.stringify({ success: false, error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      targetUserId = profile.id;
    }

    // Update user password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    });


    if (error) {
      console.error("Password reset error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
