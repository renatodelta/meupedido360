import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Get environment configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';

// Initialize Supabase Client with Service Role bypass to write to tenants table
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MercadoPagoWebhookBody {
  action?: string;
  api_version?: string;
  data?: {
    id: string;
  };
  date_created?: string;
  id?: number;
  live_mode?: boolean;
  type?: string;
  user_id?: string;
}

/**
 * POST /api/webhooks/mercadopago
 * 
 * Secure Webhook receiver that activates or suspends store subdomains based on 
 * Mercado Pago subscriptions and payment notifications.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MercadoPagoWebhookBody;
    console.log('[Mercado Pago Webhook] Received event payload:', JSON.stringify(body));

    const resourceId = body.data?.id;
    const eventType = body.type;

    if (!resourceId) {
      console.warn('[Mercado Pago Webhook] Event received without data.id field');
      return NextResponse.json({ error: 'Missing resource data.id' }, { status: 400 });
    }

    // 1. PROCESS RECURRING SUBSCRIPTIONS (preapproval)
    if (eventType === 'subscription_preapproval' || eventType === 'preapproval') {
      console.log(`[Mercado Pago Webhook] Verifying subscription: ${resourceId}`);
      
      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
        },
      });

      if (!mpResponse.ok) {
        console.error(`[Mercado Pago Webhook] Error fetching preapproval ${resourceId} status from MP API`);
        return NextResponse.json({ error: 'Failed to verify preapproval signature' }, { status: 502 });
      }

      const preapprovalData = await mpResponse.json();
      console.log(`[Mercado Pago Webhook] Preapproval details fetched:`, JSON.stringify(preapprovalData));

      // Retrieve tenant ID linked via checkout metadata or external reference
      const tenantId = preapprovalData.external_reference || preapprovalData.metadata?.tenant_id;
      const mpStatus = preapprovalData.status; // 'authorized', 'paused', 'cancelled'

      if (!tenantId) {
        console.error(`[Mercado Pago Webhook] Tenant reference missing on preapproval details: ${resourceId}`);
        return NextResponse.json({ error: 'Tenant reference missing' }, { status: 422 });
      }

      // Check authorization status
      let planStatus: 'active' | 'suspended' = 'suspended';
      if (mpStatus === 'authorized') {
        planStatus = 'active';
      }

      // Update Database
      const { error } = await supabase
        .from('tenants')
        .update({
          plan_status: planStatus,
          mercado_pago_subscription_id: resourceId,
        })
        .eq('id', tenantId);

      if (error) {
        console.error(`[Mercado Pago Webhook] Failed to update tenant plan in database:`, error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      console.log(`[Mercado Pago Webhook] Tenant ${tenantId} updated to plan_status = ${planStatus}`);
      return NextResponse.json({ success: true, planStatus });
    }

    // 2. PROCESS INDIVIDUAL PAYMENTS
    if (eventType === 'payment') {
      console.log(`[Mercado Pago Webhook] Verifying payment: ${resourceId}`);

      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
        },
      });

      if (!mpResponse.ok) {
        console.error(`[Mercado Pago Webhook] Error fetching payment ${resourceId} status from MP API`);
        return NextResponse.json({ error: 'Failed to verify payment status' }, { status: 502 });
      }

      const paymentData = await mpResponse.json();
      console.log(`[Mercado Pago Webhook] Payment details fetched:`, JSON.stringify(paymentData));

      const tenantId = paymentData.external_reference || paymentData.metadata?.tenant_id;
      const paymentStatus = paymentData.status; // 'approved', 'pending', 'rejected', 'refunded', etc.

      if (!tenantId) {
        console.error(`[Mercado Pago Webhook] Tenant reference missing on payment details: ${resourceId}`);
        return NextResponse.json({ error: 'Tenant reference missing' }, { status: 422 });
      }

      // Handle successful payment activation
      if (paymentStatus === 'approved') {
        const { error } = await supabase
          .from('tenants')
          .update({
            plan_status: 'active',
          })
          .eq('id', tenantId);

        if (error) {
          console.error(`[Mercado Pago Webhook] Failed to activate tenant:`, error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        console.log(`[Mercado Pago Webhook] Tenant ${tenantId} successfully activated via payment`);
        return NextResponse.json({ success: true, planStatus: 'active' });
      }

      // Handle payment failures
      if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(paymentStatus)) {
        const { error } = await supabase
          .from('tenants')
          .update({
            plan_status: 'suspended',
          })
          .eq('id', tenantId);

        if (error) {
          console.error(`[Mercado Pago Webhook] Failed to suspend tenant:`, error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        console.log(`[Mercado Pago Webhook] Tenant ${tenantId} suspended due to failed payment`);
        return NextResponse.json({ success: true, planStatus: 'suspended' });
      }

      return NextResponse.json({ received: true, status: paymentStatus });
    }

    // Standard 200 response for other Mercado Pago event triggers (e.g. test webhooks, client notifications)
    console.log(`[Mercado Pago Webhook] Unhandled event type ignored: ${eventType}`);
    return NextResponse.json({ received: true, message: 'Event type not tracked' });

  } catch (error) {
    console.error('[Mercado Pago Webhook] Critical exception occurred:', error);
    return NextResponse.json({ error: 'Internal server error processing webhook' }, { status: 500 });
  }
}
