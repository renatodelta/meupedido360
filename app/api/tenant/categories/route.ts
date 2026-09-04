import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resolveTenantId(tenant_id?: string | null, slug?: string | null): Promise<string | null> {
  if (tenant_id) return tenant_id;
  if (!slug) return null;
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  return tenant?.id || null;
}

/**
 * GET /api/tenant/categories?tenant_id=... or ?slug=...
 * Lists all categories for a given tenant.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantIdParam = searchParams.get('tenant_id');
    const slugParam = searchParams.get('slug');

    const targetTenantId = await resolveTenantId(tenantIdParam, slugParam);

    if (!targetTenantId) {
      return NextResponse.json({ error: 'Restaurante não encontrado. Verifique o tenant_id ou subdomínio.' }, { status: 400 });
    }

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', targetTenantId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      tenant_id: targetTenantId,
      categories: categories || [] 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/tenant/categories
 * Creates a new category for a tenant.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, slug, name, order_index = 0 } = body;

    const targetTenantId = await resolveTenantId(tenant_id, slug);

    if (!targetTenantId) {
      return NextResponse.json({ error: 'Restaurante não encontrado.' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'O nome da seção é obrigatório.' }, { status: 400 });
    }

    const categoryName = name.trim();

    const { data, error } = await supabase
      .from('categories')
      .insert({
        tenant_id: targetTenantId,
        name: categoryName,
        order_index,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[Categories POST] Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data });
  } catch (err: any) {
    console.error('[Categories POST] Exception:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao salvar seção.' }, { status: 500 });
  }
}

/**
 * PUT /api/tenant/categories
 * Updates category details (name, order_index, is_active).
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, tenant_id, slug, name, order_index, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'id da categoria é obrigatório' }, { status: 400 });
    }

    const targetTenantId = await resolveTenantId(tenant_id, slug);

    const updatePayload: any = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (order_index !== undefined) updatePayload.order_index = order_index;
    if (is_active !== undefined) updatePayload.is_active = is_active;

    let query = supabase
      .from('categories')
      .update(updatePayload)
      .eq('id', id);

    if (targetTenantId) {
      query = query.eq('tenant_id', targetTenantId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * DELETE /api/tenant/categories?id=...&tenant_id=...&slug=...
 * Deletes a category.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tenantIdParam = searchParams.get('tenant_id');
    const slugParam = searchParams.get('slug');

    if (!id) {
      return NextResponse.json({ error: 'id da categoria é obrigatório' }, { status: 400 });
    }

    const targetTenantId = await resolveTenantId(tenantIdParam, slugParam);

    let query = supabase.from('categories').delete().eq('id', id);

    if (targetTenantId) {
      query = query.eq('tenant_id', targetTenantId);
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
