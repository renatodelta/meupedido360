import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const asaasApiKey = process.env.ASAAS_API_KEY || '';
const asaasCheckoutUrl = process.env.NEXT_PUBLIC_ASAAS_CHECKOUT_URL || process.env.ASAAS_CHECKOUT_URL || '';
const isSandbox = (process.env.ASAAS_ENVIRONMENT || '').toLowerCase() === 'sandbox';
const asaasBaseUrl = isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://www.asaas.com/api/v3';

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
 * 5. Generates Asaas checkout preference/subscription for Pro plan OR initiates 7-day Trial
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

    // 7. Determine Dashboard URL
    const requestHost = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').toLowerCase();
    const isLocalhost = requestHost.includes('localhost') || requestHost.includes('127.0.0.1') || requestHost.includes('lvh.me');

    let storeDashboardUrl = '';
    if (isLocalhost) {
      storeDashboardUrl = `http://${slug}.lvh.me:3000/admin/onboarding`;
    } else {
      storeDashboardUrl = `https://${slug}.meupedido360.com/admin/onboarding`;
    }

    // Check global sales status
    let isSalesActive = true;
    try {
      const { data: setSetting } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'sales_enabled')
        .maybeSingle();
      if (setSetting && typeof setSetting.value === 'boolean') {
        isSalesActive = setSetting.value;
      }
    } catch (e) {}

    // PLAN: TRIAL or Sales Locked -> 7-Day Trial direct onboarding
    if (plan === 'trial' || !isSalesActive) {
      console.log(`[Signup] Account created successfully for ${slug} on 7-Day Trial (Sales Active: ${isSalesActive}). Redirecting to store dashboard.`);
      return NextResponse.json({
        success: true,
        plan: 'trial',
        redirect_url: storeDashboardUrl,
        tenant,
      });
    }

    // PLAN: PRO -> Asaas Integration
    console.log(`[Signup] Pro plan selected for ${slug}. Generating Asaas checkout...`);

    // A. Direct Asaas API Integration if configured
    if (asaasApiKey && !asaasApiKey.includes('sua_chave')) {
      try {
        let asaasCustomerId = '';

        // 1. Try finding existing customer in Asaas by email
        const findCustRes = await fetch(`${asaasBaseUrl}/customers?email=${encodeURIComponent(email)}`, {
          method: 'GET',
          headers: { access_token: asaasApiKey },
        });

        if (findCustRes.ok) {
          const findData = await findCustRes.json();
          if (findData.data && findData.data.length > 0) {
            asaasCustomerId = findData.data[0].id;
          }
        }

        // 2. Create Asaas Customer if not found
        if (!asaasCustomerId) {
          const custRes = await fetch(`${asaasBaseUrl}/customers`, {
            method: 'POST',
            headers: {
              access_token: asaasApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name,
              email,
              mobilePhone: phone || undefined,
              externalReference: createdTenantId,
            }),
          });

          if (custRes.ok) {
            const custData = await custRes.json();
            asaasCustomerId = custData.id;
          } else {
            const errText = await custRes.text();
            console.error('[Signup] Error creating Asaas Customer:', custRes.status, errText);
          }
        }

        if (asaasCustomerId) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const nextDueDateStr = tomorrow.toISOString().split('T')[0];

          const subRes = await fetch(`${asaasBaseUrl}/subscriptions`, {
            method: 'POST',
            headers: {
              access_token: asaasApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customer: asaasCustomerId,
              billingType: 'UNDEFINED', // Customer chooses PIX, Card or Boleto
              value: 79.90,
              nextDueDate: nextDueDateStr,
              cycle: 'MONTHLY',
              description: `MeuPedido360 - Plano Completo Pro (${store_name})`,
              externalReference: createdTenantId,
            }),
          });

          if (subRes.ok) {
            const subData = await subRes.json();
            const payRes = await fetch(`${asaasBaseUrl}/subscriptions/${subData.id}/payments`, {
              method: 'GET',
              headers: { access_token: asaasApiKey },
            });

            let checkoutUrl = subData.invoiceUrl;
            if (payRes.ok) {
              const payData = await payRes.json();
              if (payData.data && payData.data.length > 0 && payData.data[0].invoiceUrl) {
                checkoutUrl = payData.data[0].invoiceUrl;
              }
            }

            if (checkoutUrl) {
              return NextResponse.json({
                success: true,
                plan: 'pro',
                redirect_url: checkoutUrl,
                tenant,
              });
            }
          } else {
            const subErrText = await subRes.text();
            console.error('[Signup] Error creating Asaas Subscription:', subRes.status, subErrText);
          }
        }
      } catch (asaasErr) {
        console.error('[Signup] Asaas fetch exception:', asaasErr);
      }
    }

    // B. Fallback to Checkout Link if URL configured
    if (asaasCheckoutUrl) {
      const checkoutWithParams = new URL(asaasCheckoutUrl);
      if (phone) checkoutWithParams.searchParams.set('phone', phone);
      checkoutWithParams.searchParams.set('externalReference', createdTenantId || '');
      checkoutWithParams.searchParams.set('custom_slug', slug);

      return NextResponse.json({
        success: true,
        plan: 'pro',
        redirect_url: checkoutWithParams.toString(),
        tenant,
      });
    }

    // C. Error feedback if Asaas API Key is missing or invalid
    return NextResponse.json({
      error: 'Para testar o pagamento real do Plano Pro no Asaas, adicione sua ASAAS_API_KEY no arquivo .env.local! (Sua conta de teste foi criada no Trial de 7 Dias).',
      redirect_url: storeDashboardUrl,
      tenant,
    }, { status: 400 });

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
