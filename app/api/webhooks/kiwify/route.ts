import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const kiwifyWebhookSecret = process.env.KIWIFY_WEBHOOK_SECRET || '';

// Initialize Supabase Client with Service Role bypass
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface KiwifyWebhookBody {
  order_id?: string;
  order_ref?: string;
  order_status?: string; // 'paid', 'refunded', 'chargedback', 'waiting_payment', 'refused'
  payment_method?: string;
  created_at?: string;
  approved_date?: string;
  Subscription?: {
    id?: string;
    status?: string; // 'active', 'canceled', 'past_due', 'unpaid'
    start_date?: string;
    next_payment?: string;
    plan?: {
      id?: string;
      name?: string;
    };
  };
  Product?: {
    product_id?: string;
    product_name?: string;
  };
  Customer?: {
    full_name?: string;
    first_name?: string;
    email?: string;
    mobile?: string;
    CPF?: string;
  };
  tracking?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    src?: string;
  };
  custom_properties?: {
    tenant_id?: string;
    slug?: string;
    [key: string]: any;
  };
  signature?: string;
}

/**
 * POST /api/webhooks/kiwify
 * 
 * Webhook receiver for Kiwify payments and subscriptions.
 * Activates or suspends store subdomains based on Kiwify order events.
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const tokenQuery = url.searchParams.get('token');

    // 1. Optional Security Token Validation
    if (kiwifyWebhookSecret && tokenQuery && tokenQuery !== kiwifyWebhookSecret) {
      console.warn('[Kiwify Webhook] Invalid token received in query string');
      return NextResponse.json({ error: 'Unauthorized token' }, { status: 401 });
    }

    const body = (await request.json()) as KiwifyWebhookBody;
    console.log('[Kiwify Webhook] Received payload:', JSON.stringify(body));

    const orderStatus = (body.order_status || '').toLowerCase();
    const subscriptionStatus = (body.Subscription?.status || '').toLowerCase();
    const customerEmail = body.Customer?.email?.trim().toLowerCase();
    const customerName = body.Customer?.full_name || body.Customer?.first_name || 'Lojista';
    const customerPhone = body.Customer?.mobile || '';
    const orderId = body.order_id || body.Subscription?.id || `kiwify_${Date.now()}`;

    // 2. Identify Tenant (by custom_properties, tracking, or Customer Email)
    let tenantId = body.custom_properties?.tenant_id;
    let storeSlug = body.custom_properties?.slug;

    // Check tracking if custom_properties is empty
    if (!tenantId && !storeSlug && body.tracking?.src) {
      if (body.tracking.src.includes('slug:')) {
        storeSlug = body.tracking.src.replace('slug:', '').trim();
      } else if (body.tracking.src.length > 20) {
        tenantId = body.tracking.src.trim();
      }
    }

    let targetTenant: any = null;

    // A. Find by tenantId
    if (tenantId) {
      const { data } = await supabase.from('tenants').select('id, name, slug, plan_status').eq('id', tenantId).single();
      if (data) targetTenant = data;
    }

    // B. Find by storeSlug
    if (!targetTenant && storeSlug) {
      const { data } = await supabase.from('tenants').select('id, name, slug, plan_status').eq('slug', storeSlug).single();
      if (data) targetTenant = data;
    }

    // C. Find by Customer Email in users table
    if (!targetTenant && customerEmail) {
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .ilike('email', customerEmail)
        .limit(1)
        .single();

      if (userData?.tenant_id) {
        const { data: tData } = await supabase
          .from('tenants')
          .select('id, name, slug, plan_status')
          .eq('id', userData.tenant_id)
          .single();
        if (tData) targetTenant = tData;
      }
    }

    const isPaymentApproved = orderStatus === 'paid' || subscriptionStatus === 'active';
    const isPaymentRevoked = 
      ['refunded', 'chargedback', 'refused'].includes(orderStatus) || 
      ['canceled', 'past_due', 'unpaid'].includes(subscriptionStatus);

    // 3. IF TENANT FOUND: UPDATE STATUS
    if (targetTenant) {
      if (isPaymentApproved) {
        const { error } = await supabase
          .from('tenants')
          .update({
            plan_status: 'active',
            mercado_pago_subscription_id: orderId, // stored as subscription reference
          })
          .eq('id', targetTenant.id);

        if (error) {
          console.error('[Kiwify Webhook] Database update error:', error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        console.log(`[Kiwify Webhook] Tenant ${targetTenant.slug} (${targetTenant.id}) ACTIVATED successfully.`);
        return NextResponse.json({ success: true, message: 'Store activated', plan_status: 'active' });
      }

      if (isPaymentRevoked) {
        const { error } = await supabase
          .from('tenants')
          .update({
            plan_status: 'suspended',
          })
          .eq('id', targetTenant.id);

        if (error) {
          console.error('[Kiwify Webhook] Database update error on suspension:', error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        console.log(`[Kiwify Webhook] Tenant ${targetTenant.slug} (${targetTenant.id}) SUSPENDED.`);
        return NextResponse.json({ success: true, message: 'Store suspended', plan_status: 'suspended' });
      }

      // Waiting payment or intermediate status
      return NextResponse.json({ received: true, status: orderStatus });
    }

    // 4. IF TENANT NOT FOUND BUT PAYMENT APPROVED: AUTO-CREATE STORE & USER (Direct Kiwify Sales Page)
    if (isPaymentApproved && customerEmail) {
      console.log(`[Kiwify Webhook] Direct purchase from new customer ${customerEmail}. Creating tenant and user...`);

      const baseSlug = (customerName || 'loja')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 15) || 'loja';
      
      const uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Create Tenant
      const { data: newTenant, error: tenantErr } = await supabase
        .from('tenants')
        .insert({
          name: customerName,
          slug: uniqueSlug,
          phone_whatsapp: customerPhone,
          plan_status: 'active',
          mercado_pago_subscription_id: orderId,
        })
        .select()
        .single();

      if (tenantErr || !newTenant) {
        console.error('[Kiwify Webhook] Error creating tenant for direct purchase:', tenantErr);
        return NextResponse.json({ error: 'Tenant creation failed' }, { status: 500 });
      }

      // Create Auth User
      const tempPassword = `Mpd@${Math.floor(100000 + Math.random() * 900000)}`;
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: customerEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: customerName,
          phone: customerPhone,
          tenant_id: newTenant.id,
          role: 'owner',
        },
      });

      if (!authErr && authUser?.user) {
        await supabase.from('users').insert({
          id: authUser.user.id,
          tenant_id: newTenant.id,
          role: 'owner',
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        });
      }

      console.log(`[Kiwify Webhook] Auto-onboarded tenant ${newTenant.slug} for ${customerEmail}`);
      return NextResponse.json({
        success: true,
        auto_created: true,
        slug: newTenant.slug,
        tenant_id: newTenant.id,
      });
    }

    console.warn('[Kiwify Webhook] Could not associate event with any store or user:', customerEmail);
    return NextResponse.json({ received: true, warning: 'Store not found for this event' });

  } catch (err: any) {
    console.error('[Kiwify Webhook] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
