import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get user from token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile for name only
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const userName = profile 
      ? `${profile.first_name} ${profile.last_name}` 
      : "Unknown";

    // Get PDF URL from request
    const { pdfUrl } = await req.json();

    if (!pdfUrl) {
      return new Response(
        JSON.stringify({ error: "PDF URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the original PDF
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch PDF" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pdfBytes = await pdfResponse.arrayBuffer();
    
    // Load and modify PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const pages = pdfDoc.getPages();
    const watermarkText = userName;
    
    // Add watermarks to each page
    for (const page of pages) {
      const { width, height } = page.getSize();
      const fontSize = 10;
      const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
      
      // Bottom right watermark
      page.drawText(watermarkText, {
        x: width - textWidth - 20,
        y: 15,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.5,
      });

      // Top left watermark
      page.drawText(watermarkText, {
        x: 20,
        y: height - 25,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.5,
      });

      // Multiple diagonal watermarks across the page
      const centerFontSize = 20;
      const diagonalPositions = [
        { x: width * 0.2, y: height * 0.75 },
        { x: width * 0.5, y: height * 0.5 },
        { x: width * 0.8, y: height * 0.25 },
        { x: width * 0.3, y: height * 0.3 },
        { x: width * 0.7, y: height * 0.7 },
      ];

      for (const pos of diagonalPositions) {
        page.drawText(watermarkText, {
          x: pos.x - 50,
          y: pos.y,
          size: centerFontSize,
          font: helveticaFont,
          color: rgb(0.85, 0.85, 0.85),
          opacity: 0.12,
          rotate: { angle: 45, type: 'degrees' as const },
        });
      }

      // Bottom center watermark
      page.drawText(watermarkText, {
        x: (width - textWidth) / 2,
        y: 15,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.4,
      });
    }

    // Save modified PDF
    const modifiedPdfBytes = await pdfDoc.save();

    return new Response(modifiedPdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="paper-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
