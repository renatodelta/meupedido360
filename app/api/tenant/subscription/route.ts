import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const asaasApiKey = process.env.ASAAS_API_KEY || '';
const asaasCheckoutUrl = process.env.NEXT_PUBLIC_ASAAS_CHECKOUT_URL || process.env.ASAAS_CHECKOUT_URL || '';
const isSandbox = (process.env.ASAAS_ENVIRONMENT || '').toLowerCase() === 'sandbox';
const asaasBaseUrl = isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://www.asaas.com/api/v3';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/tenant/subscription
 * Body: { slug: string }
 * 
 * Generates an Asaas Checkout or Subscription link for an existing tenant to subscribe or renew
 * their monthly Pro plan (R$ 69,90/mês).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json({ error: 'O slug do restaurante é obrigatório' }, { status: 400 });
    }

    // 1. Fetch Tenant and Owner User from Supabase
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug, plan_status, phone_whatsapp')
      .eq('slug', slug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 });
    }

    // Fetch owner email if possible
    const { data: ownerUser } = await supabase
      .from('users')
      .select('email, name, phone')
      .eq('tenant_id', tenant.id)
      .limit(1)
      .single();

    const customerEmail = ownerUser?.email || '';
    const customerName = ownerUser?.name || tenant.name;
    const customerPhone = tenant.phone_whatsapp || ownerUser?.phone || '';

    // 2. Determine Dashboard URL
    const requestHost = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').toLowerCase();
    const isLocalhost = requestHost.includes('localhost') || requestHost.includes('127.0.0.1') || requestHost.includes('lvh.me');
    const storeDashboardUrl = isLocalhost
      ? `http://${slug}.lvh.me:3000/admin`
      : `https://${slug}.meupedido360.com/admin`;

    // 3. Option A: Direct Asaas API Integration (Recommended)
    if (asaasApiKey && !asaasApiKey.includes('sua_chave') && asaasApiKey.startsWith('$aact_')) {
      console.log(`[Subscription API] Creating Asaas Subscription for tenant ${tenant.slug}...`);

      // A. Create or Find Customer in Asaas
      let asaasCustomerId = '';

      if (customerEmail) {
        const findCustomerRes = await fetch(`${asaasBaseUrl}/customers?email=${encodeURIComponent(customerEmail)}`, {
          method: 'GET',
          headers: {
            access_token: asaasApiKey,
            'Content-Type': 'application/json',
          },
        });

        if (findCustomerRes.ok) {
          const findData = await findCustomerRes.json();
          if (findData.data && findData.data.length > 0) {
            asaasCustomerId = findData.data[0].id;
          }
        }
      }

      if (!asaasCustomerId) {
        const createCustomerRes = await fetch(`${asaasBaseUrl}/customers`, {
          method: 'POST',
          headers: {
            access_token: asaasApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: customerName,
            email: customerEmail || `${tenant.slug}@meupedido360.com`,
            mobilePhone: customerPhone,
            externalReference: tenant.id,
          }),
        });

        if (createCustomerRes.ok) {
          const newCustData = await createCustomerRes.json();
          asaasCustomerId = newCustData.id;
        } else {
          const errText = await createCustomerRes.text();
          console.warn('[Subscription API] Error creating Asaas customer:', errText);
        }
      }

      // B. Create Subscription in Asaas
      if (asaasCustomerId) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextDueDateStr = tomorrow.toISOString().split('T')[0];

        const subRes = await fetch(`${asaasBaseUrl}/subscriptions`, {
          method: 'POST',
          headers: {
            access_token: asaasApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer: asaasCustomerId,
            billingType: 'UNDEFINED', // Allows customer to select PIX, Card or Boleto
            value: 69.90,
            nextDueDate: nextDueDateStr,
            cycle: 'MONTHLY',
            description: `MeuPedido360 - Plano Completo Pro (${tenant.name})`,
            externalReference: tenant.id,
          }),
        });

        if (subRes.ok) {
          const subData = await subRes.json();
          // Fetch payment invoice URL for the subscription
          const paymentsRes = await fetch(`${asaasBaseUrl}/subscriptions/${subData.id}/payments`, {
            method: 'GET',
            headers: {
              access_token: asaasApiKey,
            },
          });

          let checkoutUrl = subData.invoiceUrl;
          if (paymentsRes.ok) {
            const payData = await paymentsRes.json();
            if (payData.data && payData.data.length > 0 && payData.data[0].invoiceUrl) {
              checkoutUrl = payData.data[0].invoiceUrl;
            }
          }

          if (checkoutUrl) {
            return NextResponse.json({
              success: true,
              is_subscription: true,
              checkout_url: checkoutUrl,
              subscription_id: subData.id,
              tenant,
            });
          }
        } else {
          const subErrText = await subRes.text();
          console.error('[Subscription API] Asaas subscription creation error:', subErrText);
        }
      }
    }

    // 4. Option B: Fallback to Asaas Checkout Link
    if (asaasCheckoutUrl) {
      const checkoutWithParams = new URL(asaasCheckoutUrl);
      if (tenant.phone_whatsapp) checkoutWithParams.searchParams.set('phone', tenant.phone_whatsapp);
      checkoutWithParams.searchParams.set('externalReference', tenant.id);
      checkoutWithParams.searchParams.set('custom_tenant_id', tenant.id);
      checkoutWithParams.searchParams.set('custom_slug', tenant.slug);

      return NextResponse.json({
        success: true,
        checkout_url: checkoutWithParams.toString(),
        tenant,
      });
    }

    // 5. Option C: Demo Simulation Mode if Asaas is not yet configured
    console.warn('[Subscription API] Asaas API Key and Checkout URL are not configured. Providing simulation fallback.');
    return NextResponse.json({
      success: true,
      is_demo: true,
      message: 'Modo Demonstração: configure o ASAAS_API_KEY ou NEXT_PUBLIC_ASAAS_CHECKOUT_URL no .env.local.',
      checkout_url: `${storeDashboardUrl}?demo_payment=approved`,
      tenant,
    });

  } catch (error: any) {
    console.error('[Subscription API] Exception:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
