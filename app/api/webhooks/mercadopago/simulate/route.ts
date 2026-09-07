import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/webhooks/mercadopago/simulate
 * Body: { slug: string, status?: 'approved' | 'rejected' | 'suspended' }
 * 
 * Helper endpoint for local development and QA testing to simulate
 * a Mercado Pago payment approval or suspension without needing external webhooks or Ngrok.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, status = 'approved' } = body;

    if (!slug) {
      return NextResponse.json({ error: 'O parâmetro slug é obrigatório' }, { status: 400 });
    }

    // 1. Resolve Tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug, plan_status')
      .eq('slug', slug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: `Loja com slug "${slug}" não encontrada no banco de dados` }, { status: 404 });
    }

    const newPlanStatus = status === 'approved' ? 'active' : 'suspended';

    // 2. Update Tenant Plan Status
    const { data: updatedTenant, error: updateError } = await supabase
      .from('tenants')
      .update({
        plan_status: newPlanStatus,
        mercado_pago_subscription_id: `simulated_sub_${Date.now()}`,
      })
      .eq('id', tenant.id)
      .select('id, name, slug, plan_status')
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Erro ao atualizar status no banco', details: updateError }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Simulação concluída! O restaurante "${tenant.name}" agora está com plano = "${newPlanStatus}".`,
      simulated_event: status === 'approved' ? 'payment.approved' : 'payment.rejected',
      tenant: updatedTenant,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
