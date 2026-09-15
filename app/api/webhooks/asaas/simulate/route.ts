import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/webhooks/asaas/simulate
 * Simulates an Asaas webhook event for local testing or validation.
 * 
 * Body: { slug: string, event?: 'PAYMENT_RECEIVED' | 'PAYMENT_OVERDUE' | 'PAYMENT_DELETED' }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, event = 'PAYMENT_RECEIVED' } = body;

    if (!slug) {
      return NextResponse.json({ error: 'O campo slug é obrigatório' }, { status: 400 });
    }

    // 1. Fetch Tenant by slug
    const { data: tenant, error: tenantErr } = await supabase
      .from('tenants')
      .select('id, name, slug, plan_status')
      .eq('slug', slug)
      .single();

    if (tenantErr || !tenant) {
      return NextResponse.json({ error: `Loja com slug '${slug}' não foi encontrada` }, { status: 404 });
    }

    const isApproved = event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED';
    const newPlanStatus = isApproved ? 'active' : 'suspended';

    // 2. Update status in Database
    const { error: updateErr } = await supabase
      .from('tenants')
      .update({
        plan_status: newPlanStatus,
        mercado_pago_subscription_id: `asaas_sim_${Date.now()}`,
      })
      .eq('id', tenant.id);

    if (updateErr) {
      return NextResponse.json({ error: 'Erro ao atualizar banco de dados', details: updateErr }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      simulated_event: event,
      tenant_id: tenant.id,
      slug: tenant.slug,
      previous_status: tenant.plan_status,
      new_status: newPlanStatus,
      message: `Simulação de Webhook Asaas executada com sucesso! Loja '${slug}' agora está '${newPlanStatus}'.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno no simulador' }, { status: 500 });
  }
}
