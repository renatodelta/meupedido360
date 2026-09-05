import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/tenant/orders?slug=padaria&status=pending
 * 
 * Fetches all orders for a tenant with optional status filtering.
 * Includes order items for rich KDS display.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || '';
  const status = searchParams.get('status');

  if (!slug) {
    return NextResponse.json({ error: 'Parâmetro slug é obrigatório' }, { status: 400 });
  }

  try {
    // 1. Resolve Tenant ID
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug, primary_color')
      .eq('slug', slug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // 2. Fetch Orders
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error('[Orders API] Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 });
    }

    return NextResponse.json({
      tenant,
      orders: orders || [],
    });
  } catch (err: any) {
    console.error('[Orders API] Exception:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

/**
 * PATCH /api/tenant/orders
 * Body: { order_id: string, status: string, payment_status?: string }
 * 
 * Updates order status in real-time.
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { order_id, status, payment_status } = body;

    if (!order_id || !status) {
      return NextResponse.json({ error: 'order_id e status são obrigatórios' }, { status: 400 });
    }

    const updateData: any = { status };
    if (payment_status) {
      updateData.payment_status = payment_status;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order_id)
      .select()
      .single();

    if (error) {
      console.error('[Orders API] Error updating order status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (err: any) {
    console.error('[Orders API] Exception in PATCH:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

/**
 * POST /api/tenant/orders
 * Body: { slug: string, customer_name: string, customer_phone: string, delivery_address_json: object, items: array, payment_method: string }
 * 
 * Creates a new order (used by storefront checkout or live demo simulator).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      slug, 
      customer_name, 
      customer_phone, 
      delivery_address_json, 
      items, 
      payment_method = 'pix',
      delivery_fee = 5.00
    } = body;

    if (!slug || !customer_name || !customer_phone || !items || items.length === 0) {
      return NextResponse.json({ error: 'Dados incompletos para criar o pedido' }, { status: 400 });
    }

    // 1. Resolve Tenant ID
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // 2. Calculate Totals
    const subtotal = items.reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0);
    const total = subtotal + delivery_fee;

    // 3. Insert Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenant.id,
        customer_name,
        customer_phone,
        delivery_address_json: delivery_address_json || { rua: 'Rua Principal', numero: '100', bairro: 'Centro', cidade: 'São Paulo' },
        subtotal,
        delivery_fee,
        total,
        status: 'pending',
        payment_method,
        payment_status: 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('[Orders API] Insert order error:', orderError);
      return NextResponse.json({ error: 'Erro ao criar pedido no banco' }, { status: 500 });
    }

    // 4. Insert Order Items
    const orderItemsToInsert = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id || null,
      product_name: item.product_name || item.name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      customizations_json: item.customizations || [],
      total_price: item.unit_price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error('[Orders API] Insert order items error:', itemsError);
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error('[Orders API] Exception in POST:', err);
    return NextResponse.json({ error: 'Erro interno ao criar pedido' }, { status: 500 });
  }
}
