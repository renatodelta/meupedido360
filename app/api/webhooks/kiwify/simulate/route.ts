import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/webhooks/kiwify/simulate
 * Simulates a Kiwify webhook event for local testing or validation.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, status = 'paid' } = body;

    if (!slug) {
      return NextResponse.json({ error: 'Slug do restaurante é obrigatório para o teste' }, { status: 400 });
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name, slug, plan_status')
      .eq('slug', slug)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 });
    }

    const newPlanStatus = status === 'paid' ? 'active' : 'suspended';

    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        plan_status: newPlanStatus,
        mercado_pago_subscription_id: `kiwify_sim_${Date.now()}`,
      })
      .eq('id', tenant.id);

    if (updateError) {
      return NextResponse.json({ error: 'Erro ao atualizar banco' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Simulação de Webhook Kiwify executada com sucesso! Loja '${slug}' agora está '${newPlanStatus}'.`,
      tenant_id: tenant.id,
      slug: tenant.slug,
      plan_status: newPlanStatus,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
