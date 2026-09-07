import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/tenant/drivers?slug=padaria
 * Lists all drivers for a tenant.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || '';

  if (!slug) {
    return NextResponse.json({ error: 'Parâmetro slug é obrigatório' }, { status: 400 });
  }

  try {
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .eq('slug', slug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (driversError) {
      console.error('[Drivers API] Error fetching drivers:', driversError);
      return NextResponse.json({ error: 'Erro ao buscar entregadores' }, { status: 500 });
    }

    return NextResponse.json({
      tenant,
      drivers: drivers || [],
    });
  } catch (err) {
    console.error('[Drivers API] Unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

/**
 * POST /api/tenant/drivers
 * Creates a new driver.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, name, phone, status = 'available' } = body;

    if (!slug || !name || !phone) {
      return NextResponse.json({ error: 'Campos slug, name e phone são obrigatórios' }, { status: 400 });
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    const { data: newDriver, error: insertError } = await supabase
      .from('drivers')
      .insert({
        tenant_id: tenant.id,
        name: name.trim(),
        phone: phone.trim(),
        status,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('[Drivers API] Insert error:', insertError);
      return NextResponse.json({ error: 'Erro ao cadastrar entregador' }, { status: 500 });
    }

    return NextResponse.json({ success: true, driver: newDriver });
  } catch (err) {
    console.error('[Drivers API] Error creating driver:', err);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
}

/**
 * PATCH /api/tenant/drivers
 * Updates driver details or status.
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, phone, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do entregador é obrigatório' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (name) updates.name = name.trim();
    if (phone) updates.phone = phone.trim();
    if (status) updates.status = status;

    const { data: updatedDriver, error: updateError } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('[Drivers API] Update error:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar entregador' }, { status: 500 });
    }

    return NextResponse.json({ success: true, driver: updatedDriver });
  } catch (err) {
    console.error('[Drivers API] Error updating driver:', err);
    return NextResponse.json({ error: 'Erro interno ao atualizar' }, { status: 500 });
  }
}

/**
 * DELETE /api/tenant/drivers?id=xyz
 * Deletes a driver.
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID do entregador é obrigatório' }, { status: 400 });
  }

  try {
    const { error: deleteError } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[Drivers API] Delete error:', deleteError);
      return NextResponse.json({ error: 'Erro ao excluir entregador' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Drivers API] Error deleting driver:', err);
    return NextResponse.json({ error: 'Erro interno ao excluir' }, { status: 500 });
  }
}
