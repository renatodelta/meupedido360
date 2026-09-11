'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Sparkles, Store, ShieldCheck } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        setErrorMessage(authError?.message || 'E-mail ou senha incorretos.');
        setIsLoading(false);
        return;
      }

      // 2. Fetch User Profile to get tenant_id
      const { data: userProfile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', authData.user.id)
        .single();

      let tenantSlug = 'padaria'; // Default demo fallback if profile not found

      if (userProfile?.tenant_id) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('slug')
          .eq('id', userProfile.tenant_id)
          .single();

        if (tenant?.slug) {
          tenantSlug = tenant.slug;
        }
      }

      // 3. Redirect to Tenant Admin Dashboard
      const host = window.location.hostname;
      const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('lvh.me');

      const parts = window.location.host.split(':')[0].split('.');
      const rootDomain = parts.length >= 2 ? parts.slice(-2).join('.') : 'meupedido360.com';

      const redirectTarget = isLocal
        ? `http://${tenantSlug}.lvh.me:3000/admin`
        : `https://${tenantSlug}.${rootDomain}/admin`;

      window.location.href = redirectTarget;
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage('Falha ao conectar com o serviço de autenticação.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#061325] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[450px] pointer-events-none opacity-20 blur-[160px] bg-gradient-to-r from-orange-500 via-amber-500 to-blue-600 -z-10 rounded-full" />

      <div className="w-full max-w-md space-y-8">
        
        {/* Brand Header with prominent Logo */}
        <div className="text-center space-y-4">
          <a href="/" className="inline-flex flex-col items-center group">
            <div className="p-1 rounded-full bg-gradient-to-tr from-orange-500 via-amber-400 to-orange-600 shadow-2xl shadow-orange-500/30 group-hover:scale-105 transition-transform duration-300">
              <img 
                src="/logo.png" 
                alt="Pedido 360 Logo" 
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover shadow-inner"
              />
            </div>
          </a>
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Acessar Painel do Lojista
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Gerencie seus pedidos em tempo real, cardápio e entregadores
            </p>
          </div>
        </div>

        {/* Login Form Box */}
        <form
          onSubmit={handleLogin}
          className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-5"
        >
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              E-mail de Acesso
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="seu@restaurante.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition duration-150"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Sua Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition duration-150"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-xl shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Entrando no painel...</span>
              </>
            ) : (
              <>
                <span>Entrar no Painel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <a href="/signup" className="text-xs text-slate-400 hover:text-orange-400 transition">
              Ainda não tem conta? <strong className="text-orange-400 font-bold">Criar minha loja em 2 minutos</strong>
            </a>
          </div>
        </form>

        {/* Support Note */}
        <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Ambiente Seguro com Autenticação Criptografada</span>
        </div>

      </div>
    </div>
  );
}
