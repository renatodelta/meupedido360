import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import '../../globals.css';

// Configure Supabase client for Server Component
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface TenantLayoutProps {
  children: React.ReactNode;
  params: {
    subdomain: string;
  };
}

// Force dynamic page generation to ensure fresh DB records (prevents stale color theme caches)
export const dynamic = 'force-dynamic';

/**
 * app/(store)/[subdomain]/layout.tsx
 * 
 * Dynamic store layout that:
 * 1. Fetches tenant metadata from Supabase by slug/subdomain.
 * 2. Checks active status and displays premium block if suspended.
 * 3. Injects custom brand colors as CSS Custom Properties for Tailwind CSS.
 */
export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { subdomain } = params;

  // Fetch tenant info from Supabase database
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', subdomain)
    .single();

  // 1. Trigger Next.js standard 404 page if store does not exist
  if (error || !tenant) {
    notFound();
  }

  // 2. Render premium suspension screen if the subscription status is suspended
  if (tenant.plan_status === 'suspended') {
    return (
      <html lang="pt-BR">
        <head>
          <title>{tenant.name} - Loja Suspensa</title>
          <meta name="robots" content="noindex, nofollow" />
        </head>
        <body className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full text-center space-y-6 bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
            {tenant.logo_url ? (
              <img 
                src={tenant.logo_url} 
                alt={tenant.name} 
                className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-rose-500/20 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 mx-auto rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-4xl font-black shadow-inner">
                {tenant.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">{tenant.name}</h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-widest">
                Cardápio Inativo
              </span>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed">
              O cardápio digital deste restaurante está temporariamente fora do ar. 
              Se você é o administrador desta conta, regularize sua assinatura no painel do cliente.
            </p>

            <div className="pt-4 border-t border-slate-800">
              <a
                href="https://meupedido360.com/login"
                className="inline-flex items-center justify-center w-full px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 rounded-xl transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rose-500/20"
              >
                Acessar Área do Lojista
              </a>
            </div>
          </div>
        </body>
      </html>
    );
  }

  // 3. Define brand fallback colors (Tailwind HSL defaults mapped internally)
  const primaryColor = tenant.primary_color || '#E11D48';
  const secondaryColor = tenant.secondary_color || '#1E293B';
  const backgroundColor = tenant.background_color || '#FFFFFF';

  // 4. Map settings to CSS Variables for inline dynamic styling
  const themeVars = {
    '--primary-color': primaryColor,
    '--secondary-color': secondaryColor,
    '--background-color': backgroundColor,
  } as React.CSSProperties;

  return (
    <html lang="pt-BR" style={themeVars}>
      <head>
        <title>{tenant.name} - Cardápio Digital & Delivery</title>
        <meta name="description" content={`Peça online no cardápio digital de ${tenant.name}. Delivery rápido e prático.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body 
        style={{ 
          backgroundColor: 'var(--background-color)',
          ...themeVars
        }}
        className="min-h-screen font-sans antialiased text-slate-800 transition-colors duration-300 pb-12"
      >
        {/* PREMIUM NAVIGATION HEADER */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tenant.logo_url ? (
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="w-10 h-10 rounded-full object-cover shadow-sm border-2"
                  style={{ borderColor: 'var(--primary-color)' }}
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-lg shadow-sm"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                >
                  {tenant.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                {tenant.name}
              </span>
            </div>
            
            {/* Realtime Open/Closed indicator */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span 
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                ></span>
                <span 
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                ></span>
              </span>
              <span 
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all duration-300"
                style={{ 
                  color: 'var(--primary-color)', 
                  borderColor: 'var(--primary-color)',
                  backgroundColor: `${primaryColor}10` // Dynamic opacity syntax (10% hex equivalent)
                }}
              >
                Aberto
              </span>
            </div>
          </div>
        </header>

        {/* STORE HERO BANNER */}
        {tenant.banner_url && (
          <div className="w-full h-40 sm:h-56 md:h-64 relative overflow-hidden bg-slate-100">
            <img 
              src={tenant.banner_url} 
              alt={`${tenant.name} Banner`} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          </div>
        )}

        {/* CONTAINER FOR STORE ROUTE (digital menu categories, products list) */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
