'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Zap, Mail, Lock, ArrowRight, Loader2, AlertCircle, Store } from 'lucide-react';

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
      const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

      const redirectTarget = isLocal
        ? `http://${tenantSlug}.localhost:3000/admin`
        : `https://${tenantSlug}.meupedido360.com/admin`;

      window.location.href = redirectTarget;
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage('Falha ao conectar com o serviço de autenticação.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] pointer-events-none opacity-20 blur-[150px] bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 -z-10 rounded-full" />

      <div className="w-full max-w-md space-y-8">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <a href="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center shadow-xl shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-7 h-7 text-white fill-white/10" />
            </div>
            <span className="text-3xl font-black tracking-tight text-white">
              MeuPedido<span className="bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent">360</span>
            </span>
          </a>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Acessar Área do Lojista
          </h1>
          <p className="text-xs text-slate-400">
            Entre com suas credenciais para gerenciar seus pedidos e cardápio
          </p>
        </div>

        {/* Login Form Box */}
        <form
          onSubmit={handleLogin}
          className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-5"
        >
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
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
                className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition duration-150"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
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
                className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition duration-150"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-xl shadow-rose-500/20 hover:scale-[1.01] transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Entrando...</span>
              </>
            ) : (
              <>
                <span>Entrar no Painel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <a href="/signup" className="text-xs text-slate-400 hover:text-rose-400 transition">
              Ainda não tem conta? <strong className="text-rose-400">Criar minha loja em 2 minutos</strong>
            </a>
          </div>
        </form>

      </div>
    </div>
  );
}
