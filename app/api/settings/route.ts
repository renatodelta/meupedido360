import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Global in-memory cache for sales status
let cachedSalesEnabled: boolean = true;
let lastFetchTime: number = 0;
const CACHE_TTL_MS = 3000; // 3 seconds cache

function parseBooleanValue(val: any): boolean {
  if (val === true || val === 'true' || val === 1 || val === '1') return true;
  if (val === false || val === 'false' || val === 0 || val === '0') return false;
  if (typeof val === 'object' && val !== null) {
    if (val.sales_enabled !== undefined) return parseBooleanValue(val.sales_enabled);
    if (val.value !== undefined) return parseBooleanValue(val.value);
  }
  return false;
}

async function getSalesStatus(): Promise<boolean> {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_TTL_MS) {
    return cachedSalesEnabled;
  }

  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'sales_enabled')
      .maybeSingle();

    if (!error && data && data.value !== undefined) {
      cachedSalesEnabled = parseBooleanValue(data.value);
    }
  } catch (err) {
    // Keep in-memory cached value if table doesn't exist yet
  }

  lastFetchTime = now;
  return cachedSalesEnabled;
}

/**
 * GET /api/settings
 * Returns global platform settings (e.g. sales_enabled)
 */
export async function GET() {
  const salesEnabled = await getSalesStatus();
  return NextResponse.json({
    success: true,
    sales_enabled: salesEnabled,
  });
}

/**
 * POST /api/settings
 * Body: { sales_enabled: boolean }
 * Updates global platform sales status (Used by SuperAdmin)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sales_enabled } = body;

    if (typeof sales_enabled !== 'boolean') {
      return NextResponse.json({ error: 'O parâmetro sales_enabled (boolean) é obrigatório.' }, { status: 400 });
    }

    cachedSalesEnabled = sales_enabled;
    lastFetchTime = Date.now();

    // Try persisting to Supabase platform_settings table
    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'sales_enabled',
          value: sales_enabled,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

      if (error) {
        console.warn('[Settings API] Notice persisting to platform_settings:', error.message);
      }
    } catch (e) {
      // Gracefully continue using cached value
    }

    return NextResponse.json({
      success: true,
      sales_enabled: cachedSalesEnabled,
      message: sales_enabled
        ? 'Vendas e contratações do Plano Pro ativadas com sucesso!'
        : 'Vendas e contratações do Plano Pro trancadas/bloqueadas com sucesso!',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao atualizar configurações' }, { status: 500 });
  }
}
