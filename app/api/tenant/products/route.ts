import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/tenant/products?tenant_id=... or ?slug=...
 * Lists all products for a tenant.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const slug = searchParams.get('slug');
    const categoryId = searchParams.get('category_id');

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

    return NextResponse.json({ products: products || [] });
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
      category_id, 
      name, 
      description, 
      price, 
      image_url, 
      is_available = true,
      options_json = [] 
    } = body;

    if (!tenant_id || !category_id || !name?.trim() || price === undefined) {
      return NextResponse.json(
        { error: 'tenant_id, category_id, nome e preço são obrigatórios' },
        { status: 400 }
      );
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: 'Preço inválido' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        tenant_id,
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * PUT /api/tenant/products
 * Updates an existing product (details, price, category or toggle is_available).
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, 
      tenant_id, 
      category_id, 
      name, 
      description, 
      price, 
      image_url, 
      is_available, 
      options_json 
    } = body;

    if (!id || !tenant_id) {
      return NextResponse.json({ error: 'id e tenant_id são obrigatórios' }, { status: 400 });
    }

    const updatePayload: any = {};
    if (category_id !== undefined) updatePayload.category_id = category_id;
    if (name !== undefined) updatePayload.name = name.trim();
    if (description !== undefined) updatePayload.description = description ? description.trim() : null;
    if (price !== undefined) updatePayload.price = parseFloat(price);
    if (image_url !== undefined) updatePayload.image_url = image_url ? image_url.trim() : null;
    if (is_available !== undefined) updatePayload.is_available = is_available;
    if (options_json !== undefined) updatePayload.options_json = options_json;

    const { data, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * DELETE /api/tenant/products?id=...&tenant_id=...
 * Deletes a product.
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
      .from('products')
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
