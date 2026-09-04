import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/tenant/categories?tenant_id=... or ?slug=...
 * Lists all categories for a given tenant.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const slug = searchParams.get('slug');

    let targetTenantId = tenantId;

    if (!targetTenantId && slug) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .single();
      targetTenantId = tenant?.id;
    }

    if (!targetTenantId) {
      return NextResponse.json({ error: 'tenant_id ou slug é obrigatório' }, { status: 400 });
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

    return NextResponse.json({ categories: categories || [] });
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
    const { tenant_id, name, order_index = 0 } = body;

    if (!tenant_id || !name?.trim()) {
      return NextResponse.json({ error: 'tenant_id e nome da categoria são obrigatórios' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        tenant_id,
        name: name.trim(),
        order_index,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * PUT /api/tenant/categories
 * Updates category details (name, order_index, is_active).
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, tenant_id, name, order_index, is_active } = body;

    if (!id || !tenant_id) {
      return NextResponse.json({ error: 'id e tenant_id são obrigatórios' }, { status: 400 });
    }

    const updatePayload: any = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (order_index !== undefined) updatePayload.order_index = order_index;
    if (is_active !== undefined) updatePayload.is_active = is_active;

    const { data, error } = await supabase
      .from('categories')
      .update(updatePayload)
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * DELETE /api/tenant/categories?id=...&tenant_id=...
 * Deletes a category and cascades to its products.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tenantId = searchParams.get('tenant_id');

    if (!id || !tenantId) {
      return NextResponse.json({ error: 'id e tenant_id são obrigatórios' }, { status: 400 });
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
