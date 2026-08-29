import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Initialize Supabase Client with service role to bypass RLS during brand onboarding
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/tenant/setup
 * 
 * Secure server-side endpoint that updates tenant brand style configurations (colors & logo)
 * bypassing RLS restrictions using the service role client.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, logo_url, primary_color, secondary_color, background_color } = body;

    if (!tenant_id) {
      return NextResponse.json({ error: 'Missing tenant_id field' }, { status: 400 });
    }

    console.log(`[API Setup] Updating tenant ${tenant_id} visual assets...`);

    // Perform database update
    const { data, error } = await supabase
      .from('tenants')
      .update({
        logo_url,
        primary_color,
        secondary_color,
        background_color,
      })
      .eq('id', tenant_id)
      .select()
      .single();

    if (error) {
      console.error('[API Setup] Database update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[API Setup] Tenant ${tenant_id} styling updated successfully.`);
    return NextResponse.json({ success: true, tenant: data });

  } catch (error: any) {
    console.error('[API Setup] Exception caught:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
