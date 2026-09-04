import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resolveTenantId(tenant_id?: string | null, slug?: string | null, category_id?: string | null): Promise<string | null> {
  if (tenant_id) return tenant_id;
  if (slug) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (tenant?.id) return tenant.id;
  }
  if (category_id) {
    const { data: category } = await supabase
      .from('categories')
      .select('tenant_id')
      .eq('id', category_id)
      .maybeSingle();
    if (category?.tenant_id) return category.tenant_id;
  }
  return null;
}

/**
 * GET /api/tenant/products?tenant_id=... or ?slug=...
 * Lists all products for a tenant.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantIdParam = searchParams.get('tenant_id');
    const slugParam = searchParams.get('slug');
    const categoryId = searchParams.get('category_id');

    const targetTenantId = await resolveTenantId(tenantIdParam, slugParam);

    if (!targetTenantId) {
      return NextResponse.json({ error: 'Restaurante não encontrado.' }, { status: 400 });
    }

    let query = supabase
      .from('products')
      .select('*')
      .eq('tenant_id', targetTenantId)
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: products, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      tenant_id: targetTenantId,
      products: products || [] 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/tenant/products
 * Creates a new product for a tenant.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      tenant_id, 
      slug,
      category_id, 
      name, 
      description, 
      price, 
      image_url, 
      is_available = true,
      options_json = [] 
    } = body;

    const targetTenantId = await resolveTenantId(tenant_id, slug, category_id);

    if (!targetTenantId) {
      return NextResponse.json({ error: 'Restaurante não identificado.' }, { status: 400 });
    }

    if (!category_id) {
      return NextResponse.json({ error: 'Selecione uma categoria para o produto.' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'O nome do produto é obrigatório.' }, { status: 400 });
    }

    if (price === undefined || price === null || price === '') {
      return NextResponse.json({ error: 'O preço do produto é obrigatório.' }, { status: 400 });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: 'Preço inválido.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        tenant_id: targetTenantId,
        category_id,
        name: name.trim(),
        description: description?.trim() || null,
        price: parsedPrice,
        image_url: image_url?.trim() || null,
        is_available,
        options_json,
      })
      .select()
      .single();

    if (error) {
      console.error('[Products POST] Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: data });
  } catch (err: any) {
    console.error('[Products POST] Exception:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao cadastrar produto.' }, { status: 500 });
  }
}

/**
 * PUT /api/tenant/products
 * Updates an existing product.
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, 
      tenant_id, 
      slug,
      category_id, 
      name, 
      description, 
      price, 
      image_url, 
      is_available, 
      options_json 
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'id do produto é obrigatório' }, { status: 400 });
    }

    const targetTenantId = await resolveTenantId(tenant_id, slug, category_id);

    const updatePayload: any = {};
    if (category_id !== undefined) updatePayload.category_id = category_id;
    if (name !== undefined) updatePayload.name = name.trim();
    if (description !== undefined) updatePayload.description = description ? description.trim() : null;
    if (price !== undefined && price !== '') updatePayload.price = parseFloat(price);
    if (image_url !== undefined) updatePayload.image_url = image_url ? image_url.trim() : null;
    if (is_available !== undefined) updatePayload.is_available = is_available;
    if (options_json !== undefined) updatePayload.options_json = options_json;

    let query = supabase.from('products').update(updatePayload).eq('id', id);

    if (targetTenantId) {
      query = query.eq('tenant_id', targetTenantId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno ao atualizar produto.' }, { status: 500 });
  }
}

/**
 * DELETE /api/tenant/products?id=...&tenant_id=...&slug=...
 * Deletes a product.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tenantIdParam = searchParams.get('tenant_id');
    const slugParam = searchParams.get('slug');

    if (!id) {
      return NextResponse.json({ error: 'id do produto é obrigatório' }, { status: 400 });
    }

    const targetTenantId = await resolveTenantId(tenantIdParam, slugParam);

    let query = supabase.from('products').delete().eq('id', id);

    if (targetTenantId) {
      query = query.eq('tenant_id', targetTenantId);
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno ao excluir produto.' }, { status: 500 });
  }
}
