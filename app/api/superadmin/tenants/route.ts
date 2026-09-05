import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Admin client bypasses RLS for Super Admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/superadmin/tenants
 * 
 * Fetches all registered stores, subscription statuses, merchant user profiles, and SaaS MRR metrics.
 */
export async function GET() {
  try {
    // 1. Fetch all tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (tenantsError) {
      console.error('[SuperAdmin API] Error fetching tenants:', tenantsError);
      return NextResponse.json({ error: 'Erro ao buscar lojas' }, { status: 500 });
    }

    // 2. Fetch all user profiles for email & contact mapping
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.warn('[SuperAdmin API] Warning fetching user profiles:', usersError.message);
    }

    // Map user profile to tenant
    const userMap = new Map();
    if (users) {
      users.forEach(u => {
        if (u.tenant_id) {
          userMap.set(u.tenant_id, u);
        }
      });
    }

    const enrichedTenants = (tenants || []).map(t => ({
      ...t,
      owner: userMap.get(t.id) || null,
    }));

    // 3. Calculate SaaS Metrics
    const totalTenants = enrichedTenants.length;
    const activeTenants = enrichedTenants.filter(t => t.plan_status === 'active').length;
    const trialTenants = enrichedTenants.filter(t => t.plan_status === 'trial').length;
    const suspendedTenants = enrichedTenants.filter(t => t.plan_status === 'suspended').length;
    
    // MRR (Monthly Recurring Revenue) based on R$ 59.90 / active store
    const mrr = activeTenants * 59.90;

    return NextResponse.json({
      metrics: {
        totalTenants,
        activeTenants,
        trialTenants,
        suspendedTenants,
        mrr,
      },
      tenants: enrichedTenants,
    });
  } catch (err: any) {
    console.error('[SuperAdmin API] Exception in GET:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

/**
 * PATCH /api/superadmin/tenants
 * Body: { tenant_id: string, plan_status: 'active' | 'suspended' | 'trial' }
 * 
 * Updates a tenant's subscription status (e.g. block or activate store).
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, plan_status } = body;

    if (!tenant_id || !plan_status) {
      return NextResponse.json({ error: 'tenant_id e plan_status são obrigatórios' }, { status: 400 });
    }

    if (!['active', 'suspended', 'trial'].includes(plan_status)) {
      return NextResponse.json({ error: 'Status de plano inválido' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tenants')
      .update({ plan_status })
      .eq('id', tenant_id)
      .select()
      .single();

    if (error) {
      console.error('[SuperAdmin API] Error updating tenant status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, tenant: data });
  } catch (err: any) {
    console.error('[SuperAdmin API] Exception in PATCH:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

/**
 * POST /api/superadmin/tenants
 * Body: { action: 'reset_password', user_id: string, new_password: string }
 * 
 * Super Admin action to reset or update a merchant's password directly via Supabase Auth Admin.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, user_id, new_password } = body;

    if (action === 'reset_password') {
      if (!user_id || !new_password || new_password.length < 6) {
        return NextResponse.json({ error: 'ID do usuário e nova senha (mínimo 6 caracteres) são obrigatórios.' }, { status: 400 });
      }

      console.log(`[SuperAdmin API] Resetting password for auth user_id: ${user_id}...`);
      const { data, error } = await supabase.auth.admin.updateUserById(user_id, {
        password: new_password,
      });

      if (error) {
        console.error('[SuperAdmin API] Error resetting merchant password:', error);
        return NextResponse.json({ error: `Erro ao alterar senha: ${error.message}` }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'Senha do lojista alterada com sucesso!' });
    }

    return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 });
  } catch (err: any) {
    console.error('[SuperAdmin API] Exception in POST:', err);
    return NextResponse.json({ error: 'Erro interno no servidor ao processar ação' }, { status: 500 });
  }
}

/**
 * DELETE /api/superadmin/tenants
 * Body or Query: { tenant_id: string }
 * 
 * Permanently deletes a tenant, its products, categories, orders, user profile, and Auth account.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let tenant_id = searchParams.get('tenant_id');

    if (!tenant_id) {
      try {
        const body = await request.json();
        tenant_id = body.tenant_id;
      } catch (e) {}
    }

    if (!tenant_id) {
      return NextResponse.json({ error: 'ID do estabelecimento (tenant_id) é obrigatório.' }, { status: 400 });
    }

    console.log(`[SuperAdmin API] Excluindo estabelecimento ID: ${tenant_id}...`);

    // 1. Limpar tabelas filhas associadas ao tenant para evitar erro de Chave Estrangeira (FK)
    await supabase.from('products').delete().eq('tenant_id', tenant_id);
    await supabase.from('categories').delete().eq('tenant_id', tenant_id);
    await supabase.from('orders').delete().eq('tenant_id', tenant_id);

    // 2. Buscar e apagar perfis e usuários no Auth do Supabase
    const { data: userProfiles } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', tenant_id);

    if (userProfiles && userProfiles.length > 0) {
      for (const u of userProfiles) {
        try {
          await supabase.auth.admin.deleteUser(u.id);
        } catch (authErr) {
          console.warn('[SuperAdmin API] Aviso ao apagar usuário do Auth:', authErr);
        }
      }
      await supabase.from('users').delete().eq('tenant_id', tenant_id);
    }

    // 3. Excluir o estabelecimento na tabela tenants
    const { error: deleteError } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenant_id);

    if (deleteError) {
      console.error('[SuperAdmin API] Erro ao excluir registro do tenant:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Estabelecimento excluído com sucesso!' });
  } catch (err: any) {
    console.error('[SuperAdmin API] Exception in DELETE:', err);
    return NextResponse.json({ error: 'Erro interno ao excluir estabelecimento' }, { status: 500 });
  }
}
