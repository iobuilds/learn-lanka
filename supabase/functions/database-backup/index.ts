import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tables to backup (in order for proper restore with foreign keys)
const BACKUP_TABLES = [
  'bank_accounts',
  'classes',
  'class_months',
  'class_days',
  'lessons',
  'class_papers',
  'class_enrollments',
  'moderator_class_assignments',
  'coupons',
  'coupon_usages',
  'notifications',
  'user_notification_reads',
  'papers',
  'payments',
  'profiles',
  'user_roles',
  'rank_papers',
  'rank_mcq_questions',
  'rank_mcq_options',
  'rank_attempts',
  'rank_answers_mcq',
  'rank_answers_uploads',
  'rank_marks',
  'shop_products',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action } = await req.json();

    if (action === 'backup') {
      const backup: Record<string, any[]> = {
        _meta: {
          created_at: new Date().toISOString(),
          version: '1.0',
          tables: BACKUP_TABLES,
        }
      };

      // Fetch all data from each table
      for (const table of BACKUP_TABLES) {
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) {
          console.error(`Error fetching ${table}:`, error);
          backup[table] = [];
        } else {
          backup[table] = data || [];
        }
      }

      return new Response(
        JSON.stringify(backup),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'restore') {
      const { backupData } = await req.json();

      if (!backupData || !backupData._meta) {
        return new Response(
          JSON.stringify({ error: 'Invalid backup file format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results: Record<string, { success: boolean; count: number; error?: string }> = {};

      // Restore in order (respecting foreign key dependencies)
      for (const table of BACKUP_TABLES) {
        const tableData = backupData[table];
        
        if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
          results[table] = { success: true, count: 0 };
          continue;
        }

        try {
          // Clear existing data first (in reverse order for FK constraints)
          // Note: This is a destructive operation!
          
          // Upsert data
          const { error } = await supabase
            .from(table)
            .upsert(tableData, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });

          if (error) {
            console.error(`Error restoring ${table}:`, error);
            results[table] = { success: false, count: 0, error: error.message };
          } else {
            results[table] = { success: true, count: tableData.length };
          }
        } catch (err) {
          results[table] = { success: false, count: 0, error: String(err) };
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "backup" or "restore"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
