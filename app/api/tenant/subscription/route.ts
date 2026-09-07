import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://meupedido360.com';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/tenant/subscription
 * Body: { slug: string }
 * 
 * Generates a Mercado Pago Checkout preference for an existing tenant to subscribe or renew
 * their monthly Pro plan (R$ 59,90).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json({ error: 'O slug do restaurante é obrigatório' }, { status: 400 });
    }

    // 1. Fetch Tenant from Supabase
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug, plan_status')
      .eq('slug', slug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 });
    }

    // 2. Determine Dashboard URL
    const requestHost = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').toLowerCase();
    const isLocalhost = requestHost.includes('localhost') || requestHost.includes('127.0.0.1') || requestHost.includes('lvh.me');
    const storeDashboardUrl = isLocalhost
      ? `http://${slug}.lvh.me:3000/admin`
      : `https://${slug}.meupedido360.com/admin`;

    // 3. Check for Dummy / Unconfigured Token
    const isDummyToken = !mpAccessToken || mpAccessToken.includes('0000000000000000') || mpAccessToken.includes('exemplo');

    if (isDummyToken) {
      console.warn('[Subscription] Mercado Pago Access Token is dummy or not configured. Providing simulation fallback.');
      return NextResponse.json({
        success: true,
        is_demo: true,
        message: 'Modo Demonstração: configure o MERCADO_PAGO_ACCESS_TOKEN real ou de teste (TEST-...) no .env.local.',
        checkout_url: `${storeDashboardUrl}?demo_payment=approved`,
        tenant,
      });
    }

    // 4. Create Mercado Pago Preference
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            title: 'MeuPedido360 - Plano Pro (Mensal)',
            description: `Assinatura mensal para o restaurante ${tenant.name} (${tenant.slug}.meupedido360.com)`,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: 59.90,
          },
        ],
        external_reference: tenant.id,
        back_urls: {
          success: `${storeDashboardUrl}?payment=approved`,
          failure: `${storeDashboardUrl}?payment=rejected`,
          pending: `${storeDashboardUrl}?payment=pending`,
        },
        auto_return: 'approved',
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
      }),
    });

    if (!mpResponse.ok) {
      const errText = await mpResponse.text();
      console.error('[Subscription] Mercado Pago API Error:', errText);
      return NextResponse.json({
        error: 'Erro ao comunicar com a API do Mercado Pago. Verifique as credenciais.',
        details: errText,
      }, { status: 502 });
    }

    const mpData = await mpResponse.json();
    const checkoutUrl = mpData.init_point || mpData.sandbox_init_point;

    return NextResponse.json({
      success: true,
      checkout_url: checkoutUrl,
      preference_id: mpData.id,
      tenant,
    });

  } catch (error: any) {
    console.error('[Subscription API] Exception:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
