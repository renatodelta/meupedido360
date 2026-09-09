import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const kiwifyCheckoutUrl = process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL || process.env.KIWIFY_CHECKOUT_URL || '';

// Service role client bypasses RLS for administrative onboarding
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/auth/signup
 * 
 * Handles complete onboarding for merchants:
 * 1. Validates store slug uniqueness
 * 2. Creates Tenant (Store) in public.tenants
 * 3. Creates Supabase Auth User with metadata containing tenant_id
 * 4. Ensures User profile association in public.users
 * 5. Generates Mercado Pago checkout preference for Pro plan OR initiates 7-day Trial
 */
export async function POST(request: Request) {
  let createdTenantId: string | null = null;
  let createdAuthUserId: string | null = null;

  try {
    const body = await request.json();
    const { name, email, password, phone, store_name, slug: rawSlug, plan = 'trial' } = body;

    // 1. Validate mandatory fields
    if (!name || !email || !password || !store_name || !rawSlug) {
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve conter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    // 2. Sanitize and validate subdomain slug
    const slug = rawSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '');

    if (slug.length < 3 || slug.length > 30) {
      return NextResponse.json(
        { error: 'O subdomínio da loja deve ter entre 3 e 30 caracteres.' },
        { status: 400 }
      );
    }

    // 3. Verify slug uniqueness in database
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existingTenant) {
      return NextResponse.json(
        { error: `O subdomínio "${slug}.meupedido360.com" já está registrado. Escolha outro.` },
        { status: 409 }
      );
    }

    // 4. Create Tenant Record FIRST so we have a valid tenant_id for the user trigger
    console.log(`[Signup] 1/3 Creating Tenant record for "${store_name}" (slug: ${slug})...`);
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: store_name,
        slug,
        phone_whatsapp: phone || null,
        plan_status: 'trial', // All accounts start in trial until payment confirmation
      })
      .select()
      .single();

    if (tenantError) {
      console.error('[Signup] Tenant creation error:', tenantError);
      return NextResponse.json({ error: `Erro ao criar loja: ${tenantError.message}` }, { status: 500 });
    }

    createdTenantId = tenant.id;

    // 5. Create User in Supabase Auth with tenant_id in user_metadata
    console.log(`[Signup] 2/3 Creating Auth User for ${email} with tenant_id ${createdTenantId}...`);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        tenant_id: createdTenantId,
        name,
        phone: phone || null,
      },
    });

    if (authError) {
      console.error('[Signup] Supabase Auth Error:', authError);
      // Rollback tenant
      await supabase.from('tenants').delete().eq('id', createdTenantId);

      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'Este e-mail já está cadastrado na plataforma. Faça login ou use outro e-mail.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: `Erro na criação da conta: ${authError.message}` }, { status: 400 });
    }

    createdAuthUserId = authData.user.id;

    // 6. Ensure association in public.users (in case DB trigger didn't insert it)
    console.log(`[Signup] 3/3 Ensuring user profile in public.users...`);
    const { error: userProfileError } = await supabase
      .from('users')
      .upsert({
        id: createdAuthUserId,
        tenant_id: createdTenantId,
        role: 'owner',
        name,
        email,
        phone: phone || null,
      }, { onConflict: 'id' });

    if (userProfileError) {
      console.warn('[Signup] User profile upsert notice:', userProfileError.message);
    }

    // 7. Route based on selected plan (Dynamically construct store URL)
    const requestHost = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').toLowerCase();
    const isLocalhost = requestHost.includes('localhost') || requestHost.includes('127.0.0.1') || requestHost.includes('lvh.me');

    let storeDashboardUrl = '';
    if (isLocalhost) {
      storeDashboardUrl = `http://${slug}.lvh.me:3000/admin/onboarding`;
    } else {
      // Production: Always point to the real HTTPS wildcard subdomain on meupedido360.com
      storeDashboardUrl = `https://${slug}.meupedido360.com/admin/onboarding`;
    }

    // PLAN: TRIAL
    if (plan === 'trial') {
      console.log(`[Signup] Trial account created successfully for ${slug}. Redirecting to store.`);
      return NextResponse.json({
        success: true,
        plan: 'trial',
        redirect_url: storeDashboardUrl,
        tenant,
      });
    }

    // PLAN: PRO (Kiwify or Mercado Pago Checkout)
    if (kiwifyCheckoutUrl) {
      console.log(`[Signup] Pro plan selected for ${slug}. Redirecting to Kiwify checkout...`);
      const checkoutWithParams = new URL(kiwifyCheckoutUrl);
      if (email) checkoutWithParams.searchParams.set('email', email);
      if (name) checkoutWithParams.searchParams.set('name', name);
      if (phone) checkoutWithParams.searchParams.set('phone', phone);
      checkoutWithParams.searchParams.set('custom_tenant_id', tenant.id);
      checkoutWithParams.searchParams.set('custom_slug', tenant.slug);
      checkoutWithParams.searchParams.set('src', `slug:${tenant.slug}`);

      return NextResponse.json({
        success: true,
        plan: 'pro',
        redirect_url: checkoutWithParams.toString(),
        tenant,
      });
    }

    console.log(`[Signup] Pro plan selected for ${slug}. Generating Mercado Pago preference...`);

    const isDummyToken = !mpAccessToken || mpAccessToken.includes('0000000000000000') || mpAccessToken.includes('exemplo');

    if (isDummyToken) {
      console.warn('[Signup] Mercado Pago credentials inactive. Providing demo redirection.');
      return NextResponse.json({
        success: true,
        plan: 'pro',
        is_demo: true,
        message: 'Modo Demonstração: configure o MERCADO_PAGO_ACCESS_TOKEN no .env.local para checkout real.',
        redirect_url: `${storeDashboardUrl}?demo_checkout=true`,
        tenant,
      });
    }

    try {
      const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'MeuPedido360 - Plano Pro (Mensal)',
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: 69.90,
            currency_id: 'BRL',
          },
          back_url: `${storeDashboardUrl}?payment=approved`,
          payer_email: email,
          external_reference: tenant.id,
          status: 'pending',
        }),
      });

      if (!mpResponse.ok) {
        const mpErrText = await mpResponse.text();
        console.warn('[Signup] Preapproval API failed, falling back to preference checkout:', mpErrText);
        
        // Fallback to Checkout Preferences if preapproval fails
        const prefResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mpAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [
              {
                title: 'MeuPedido360 - Plano Pro (Mensal)',
                description: `Assinatura mensal para o restaurante ${store_name} (${slug}.meupedido360.com)`,
                quantity: 1,
                currency_id: 'BRL',
                unit_price: 69.90,
              },
            ],
            payer: { name, email },
            external_reference: tenant.id,
            back_urls: {
              success: `${storeDashboardUrl}?payment=approved`,
              failure: `${appUrl}/signup?payment=rejected`,
              pending: `${storeDashboardUrl}?payment=pending`,
            },
            auto_return: 'approved',
            notification_url: `${appUrl}/api/webhooks/mercadopago`,
          }),
        });

        if (!prefResponse.ok) {
          return NextResponse.json({
            success: true,
            plan: 'pro',
            is_demo: true,
            redirect_url: `${storeDashboardUrl}?mp_simulated=true`,
            tenant,
          });
        }

        const prefData = await prefResponse.json();
        const isTestToken = mpAccessToken.startsWith('TEST-');
        const fallbackCheckoutUrl = isTestToken 
          ? (prefData.sandbox_init_point || prefData.init_point) 
          : (prefData.init_point || prefData.sandbox_init_point);

        return NextResponse.json({
          success: true,
          plan: 'pro',
          redirect_url: fallbackCheckoutUrl,
          preference_id: prefData.id,
          tenant,
        });
      }

      const mpData = await mpResponse.json();
      const isTestToken = mpAccessToken.startsWith('TEST-');
      const checkoutUrl = isTestToken 
        ? (mpData.sandbox_init_point || mpData.init_point) 
        : (mpData.init_point || mpData.sandbox_init_point);

      return NextResponse.json({
        success: true,
        plan: 'pro',
        is_subscription: true,
        redirect_url: checkoutUrl,
        preapproval_id: mpData.id,
        tenant,
      });

    } catch (mpErr) {
      console.error('[Signup] Mercado Pago fetch exception:', mpErr);
      return NextResponse.json({
        success: true,
        plan: 'pro',
        redirect_url: `${storeDashboardUrl}?mp_fallback=true`,
        tenant,
      });
    }

  } catch (error: any) {
    console.error('[Signup] Exception occurred:', error);
    // Cleanup on failure
    if (createdTenantId) {
      try {
        await supabase.from('tenants').delete().eq('id', createdTenantId);
      } catch (_) {}
    }
    if (createdAuthUserId) {
      try {
        await supabase.auth.admin.deleteUser(createdAuthUserId);
      } catch (_) {}
    }
    return NextResponse.json(
      { error: error.message || 'Ocorreu um erro interno durante o cadastro.' },
      { status: 500 }
    );
  }
}
