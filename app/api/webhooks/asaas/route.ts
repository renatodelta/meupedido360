import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const asaasWebhookSecret = process.env.ASAAS_WEBHOOK_SECRET || '';

// Initialize Supabase Client with Service Role bypass
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AsaasPayment {
  id?: string;
  customer?: string;
  subscription?: string;
  installment?: string;
  paymentLink?: string;
  value?: number;
  netValue?: number;
  status?: string; // 'PENDING', 'RECEIVED', 'CONFIRMED', 'OVERDUE', 'REFUNDED', 'DELETED', etc.
  billingType?: string; // 'PIX', 'CREDIT_CARD', 'BOLETO'
  externalReference?: string; // tenant_id or slug
  description?: string;
  paymentDate?: string;
  confirmedDate?: string;
}

interface AsaasWebhookBody {
  event?: string;
  payment?: AsaasPayment;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    mobilePhone?: string;
    cpfCnpj?: string;
  };
}

/**
 * POST /api/webhooks/asaas
 * 
 * Webhook receiver for Asaas payments and subscriptions.
 * Activates or suspends store subdomains based on Asaas order events.
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const tokenQuery = url.searchParams.get('token');
    const headerToken = request.headers.get('asaas-access-token') || request.headers.get('asaas-webhook-secret');

    // 1. Optional Security Token Validation
    if (asaasWebhookSecret) {
      const isValidHeader = headerToken && headerToken === asaasWebhookSecret;
      const isValidQuery = tokenQuery && tokenQuery === asaasWebhookSecret;

      if (!isValidHeader && !isValidQuery) {
        console.warn('[Asaas Webhook] Invalid token received');
        return NextResponse.json({ error: 'Unauthorized token' }, { status: 401 });
      }
    }

    const body = (await request.json()) as AsaasWebhookBody;
    console.log('[Asaas Webhook] Received payload:', JSON.stringify(body));

    const event = body.event || '';
    const payment = body.payment || {};
    const paymentStatus = (payment.status || '').toUpperCase();
    const externalRef = payment.externalReference || '';
    const subscriptionId = payment.subscription || payment.id || `asaas_${Date.now()}`;

    // Extract customer information if available
    let customerEmail = body.customer?.email?.trim().toLowerCase();
    let customerName = body.customer?.name || 'Lojista';
    let customerPhone = body.customer?.mobilePhone || body.customer?.phone || '';

    // If customer details not directly in webhook payload, try to extract from description
    if (!externalRef && payment.description) {
      if (payment.description.includes('slug:')) {
        const parts = payment.description.split('slug:');
        if (parts[1]) {
          const extractedSlug = parts[1].split(' ')[0].trim();
          if (extractedSlug) {
            payment.externalReference = extractedSlug;
          }
        }
      }
    }

    // 2. Identify Tenant (by externalReference: ID or Slug, or Customer Email)
    let targetTenant: any = null;
    const refToSearch = payment.externalReference || externalRef;

    if (refToSearch) {
      // A. Try searching by ID
      const { data: tenantById } = await supabase
        .from('tenants')
        .select('id, name, slug, plan_status')
        .eq('id', refToSearch)
        .single();

      if (tenantById) {
        targetTenant = tenantById;
      } else {
        // B. Try searching by Slug
        const { data: tenantBySlug } = await supabase
          .from('tenants')
          .select('id, name, slug, plan_status')
          .eq('slug', refToSearch)
          .single();

        if (tenantBySlug) targetTenant = tenantBySlug;
      }
    }

    // C. Search by Customer Email if targetTenant is still null
    if (!targetTenant && customerEmail) {
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .ilike('email', customerEmail)
        .limit(1)
        .single();

      if (userData?.tenant_id) {
        const { data: tenantByEmail } = await supabase
          .from('tenants')
          .select('id, name, slug, plan_status')
          .eq('id', userData.tenant_id)
          .single();
        if (tenantByEmail) targetTenant = tenantByEmail;
      }
    }

    // Determine payment event type
    const isPaymentApproved = [
      'PAYMENT_RECEIVED',
      'PAYMENT_CONFIRMED',
      'PAYMENT_RESTORED',
    ].includes(event) || ['RECEIVED', 'CONFIRMED'].includes(paymentStatus);

    const isPaymentRevoked = [
      'PAYMENT_OVERDUE',
      'PAYMENT_DELETED',
      'PAYMENT_REFUNDED',
      'PAYMENT_CHARGEBACK_DISPUTE',
      'PAYMENT_CHARGEBACK_REQUESTED',
    ].includes(event) || ['OVERDUE', 'REFUNDED', 'DELETED'].includes(paymentStatus);

    // 3. IF TENANT FOUND: UPDATE STATUS
    if (targetTenant) {
      if (isPaymentApproved) {
        const { error } = await supabase
          .from('tenants')
          .update({
            plan_status: 'active',
            mercado_pago_subscription_id: subscriptionId, // maintaining column for backward compatibility
          })
          .eq('id', targetTenant.id);

        if (error) {
          console.error('[Asaas Webhook] Database update error on activation:', error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        console.log(`[Asaas Webhook] Tenant ${targetTenant.slug} (${targetTenant.id}) ACTIVATED successfully.`);
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
          console.error('[Asaas Webhook] Database update error on suspension:', error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        console.log(`[Asaas Webhook] Tenant ${targetTenant.slug} (${targetTenant.id}) SUSPENDED.`);
        return NextResponse.json({ success: true, message: 'Store suspended', plan_status: 'suspended' });
      }

      return NextResponse.json({ received: true, event, status: paymentStatus });
    }

    // 4. IF TENANT NOT FOUND BUT PAYMENT APPROVED: AUTO-CREATE STORE & USER (Direct Sales)
    if (isPaymentApproved && customerEmail) {
      console.log(`[Asaas Webhook] Direct purchase from new customer ${customerEmail}. Creating tenant and user...`);

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
          mercado_pago_subscription_id: subscriptionId,
        })
        .select()
        .single();

      if (tenantErr || !newTenant) {
        console.error('[Asaas Webhook] Error creating tenant for direct purchase:', tenantErr);
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

      console.log(`[Asaas Webhook] Auto-onboarded tenant ${newTenant.slug} for ${customerEmail}`);
      return NextResponse.json({
        success: true,
        auto_created: true,
        slug: newTenant.slug,
        tenant_id: newTenant.id,
      });
    }

    console.warn('[Asaas Webhook] Could not associate event with any store or user:', customerEmail || refToSearch);
    return NextResponse.json({ received: true, warning: 'Store not found for this event' });

  } catch (err: any) {
    console.error('[Asaas Webhook] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
