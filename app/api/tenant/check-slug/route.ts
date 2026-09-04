import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const RESERVED_SLUGS = [
  'www',
  'api',
  'admin',
  'app',
  'login',
  'signup',
  'dashboard',
  'static',
  'assets',
  'mail',
  'suporte',
  'meupedido360',
];

/**
 * GET /api/tenant/check-slug?slug=meurestaurante
 * 
 * Checks if a subdomain slug is available and valid for registration.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSlug = searchParams.get('slug') || '';

  // Normalize slug: lowercase, replace spaces and special characters
  const slug = rawSlug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');

  if (!slug || slug.length < 3) {
    return NextResponse.json(
      { available: false, error: 'O subdomínio deve ter no mínimo 3 caracteres alfanuméricos.' },
      { status: 400 }
    );
  }

  if (slug.length > 30) {
    return NextResponse.json(
      { available: false, error: 'O subdomínio não pode ter mais de 30 caracteres.' },
      { status: 400 }
    );
  }

  if (RESERVED_SLUGS.includes(slug)) {
    return NextResponse.json(
      { available: false, error: 'Este subdomínio é reservado pelo sistema.' },
      { status: 200 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('[Check Slug] Supabase error:', error);
      return NextResponse.json({ available: false, error: 'Erro ao verificar disponibilidade.' }, { status: 500 });
    }

    if (data) {
      return NextResponse.json({ available: false, error: 'Este subdomínio já está em uso.' }, { status: 200 });
    }

    return NextResponse.json({ available: true, slug });
  } catch (err: any) {
    console.error('[Check Slug] Exception:', err);
    return NextResponse.json({ available: false, error: 'Erro interno ao verificar subdomínio.' }, { status: 500 });
  }
}
