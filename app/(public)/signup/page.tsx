'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatPhone } from '@/lib/formatters';
import { 
  Sparkles, 
  ShieldCheck, 
  Store, 
  Globe, 
  Lock, 
  Mail, 
  User, 
  Phone,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

function SignupFormContent() {
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get('plan') === 'pro' ? 'pro' : 'trial';

  const [plan, setPlan] = useState<'trial' | 'pro'>(initialPlan);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  
  // Subdomain validation states
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugMessage, setSlugMessage] = useState<string>('');

  // Form states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync plan if query param changes
  useEffect(() => {
    const qPlan = searchParams.get('plan');
    if (qPlan === 'pro' || qPlan === 'trial') {
      setPlan(qPlan);
    }
  }, [searchParams]);

  // Auto-generate slug suggestion from store name if slug hasn't been manually typed
  const handleStoreNameChange = (val: string) => {
    setStoreName(val);
    if (!slug || slug === slugify(storeName)) {
      const generated = slugify(val);
      setSlug(generated);
    }
  };

  function slugify(text: string) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Debounced check for slug availability
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      setSlugMessage('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        const res = await fetch(`/api/tenant/check-slug?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        setSlugAvailable(data.available);
        setSlugMessage(data.error || (data.available ? 'Subdomínio disponível!' : ''));
      } catch (err) {
        setSlugAvailable(null);
        setSlugMessage('');
      } finally {
        setIsCheckingSlug(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [slug]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (slugAvailable === false) {
      setErrorMessage('Por favor, escolha um subdomínio disponível para a sua loja.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          store_name: storeName,
          slug,
          plan,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Erro ao realizar cadastro. Verifique os dados inseridos.');
        setIsLoading(false);
        return;
      }

      // Successful signup - redirect to Mercado Pago Checkout or Tenant Onboarding
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        setErrorMessage('Cadastro realizado com sucesso, mas a URL de destino não foi retornada.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setErrorMessage('Falha na conexão com o servidor. Tente novamente em instantes.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8 font-sans">
      
      {/* Top Header with Logo */}
      <div className="text-center space-y-4 mb-10">
        <a href="/" className="inline-flex flex-col items-center group">
          <div className="p-1 rounded-full bg-gradient-to-tr from-orange-500 via-amber-400 to-orange-600 shadow-xl shadow-orange-500/25 group-hover:scale-105 transition-transform duration-300">
            <img 
              src="/logo.png" 
              alt="Pedido 360 Logo" 
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover shadow-inner"
            />
          </div>
        </a>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Crie seu cardápio digital em segundos
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Tenha seu subdomínio exclusivo, receba pedidos em tempo real no KDS e despache entregadores sem taxas sobre suas vendas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Plan Selection & Perks (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 backdrop-blur-2xl space-y-6 shadow-2xl">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              Escolha seu plano
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Option Trial */}
              <button
                type="button"
                onClick={() => setPlan('trial')}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 relative ${
                  plan === 'trial'
                    ? 'border-orange-500 bg-orange-500/15 text-white shadow-lg shadow-orange-500/15 ring-1 ring-orange-500'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-slate-400 mb-1">Período Grátis</div>
                <div className="text-base font-black text-white">Trial 7 Dias</div>
                <div className="text-xl font-black text-orange-400 mt-2">R$ 0</div>
                <div className="text-[11px] text-slate-400 mt-1">Sem cartão</div>
              </button>

              {/* Option Pro */}
              <button
                type="button"
                onClick={() => setPlan('pro')}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 relative ${
                  plan === 'pro'
                    ? 'border-orange-500 bg-orange-500/15 text-white shadow-lg shadow-orange-500/15 ring-1 ring-orange-500'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="absolute -top-2.5 -right-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Popular
                </div>
                <div className="text-xs font-bold text-slate-400 mb-1">Completo</div>
                <div className="text-base font-black text-white">Mensal Pro</div>
                <div className="text-xl font-black text-orange-400 mt-2">
                  R$ 69,90<span className="text-xs font-normal text-slate-400">/mês</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Pix ou Cartão</div>
              </button>
            </div>

            {/* Plan Perks List */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-300">Incluso no seu acesso:</div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Subdomínio exclusivo (ex: <code className="text-orange-300 font-mono">sualoja.meupedido360.com</code>)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Personalização completa de cores e logomarca</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Painel de Cozinha KDS com alerta sonoro</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Gestão de Entregadores & Fechamento de Caixa</span>
                </li>
                {plan === 'pro' && (
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span className="text-white font-bold">Produtos e categorias ilimitadas</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3 text-xs text-slate-400">
              <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <span>Ambiente 100% seguro com isolamento de dados RLS e checkout protegido.</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Registration Form (7 cols) */}
        <div className="lg:col-span-7">
          <form 
            onSubmit={handleSubmit}
            className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6"
          >
            {/* Error Message Display */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Store className="w-4 h-4 text-orange-400" />
                Dados do Restaurante & Subdomínio
              </div>

              {/* Store Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nome do Restaurante / Loja *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Hamburgueria 360"
                    value={storeName}
                    onChange={(e) => handleStoreNameChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition duration-150"
                  />
                </div>
              </div>

              {/* Subdomain Input with Live Badge */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Subdomínio Exclusivo *
                  </label>
                  {isCheckingSlug ? (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin text-orange-400" />
                      Verificando...
                    </span>
                  ) : slugAvailable === true ? (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Disponível
                    </span>
                  ) : slugAvailable === false ? (
                    <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {slugMessage || 'Indisponível'}
                    </span>
                  ) : null}
                </div>

                <div className="relative flex rounded-xl border border-slate-800 bg-slate-950/80 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition duration-150 overflow-hidden">
                  <div className="pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="sualoja"
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    className="w-full py-2.5 px-2 bg-transparent text-white placeholder-slate-500 text-sm font-mono focus:outline-none"
                  />
                  <div className="px-3 flex items-center bg-slate-900 border-l border-slate-800 text-xs text-orange-400 font-mono select-none font-bold">
                    .meupedido360.com
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 mt-1">
                  Seus clientes acessarão sua loja em: <span className="text-slate-300 font-mono font-medium">{slug || 'sualoja'}.meupedido360.com</span>
                </p>
              </div>
            </div>

            {/* Merchant Account Details */}
            <div className="pt-2 border-t border-slate-800 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4 text-orange-400" />
                Dados do Administrador
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Seu Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Renato Santos"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition duration-150"
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    WhatsApp Comercial
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition duration-150"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    E-mail de Acesso *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="contato@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition duration-150"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Senha de Acesso *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition duration-150"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || slugAvailable === false}
                className="w-full py-4 px-6 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2 transition duration-300 shadow-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Preparando seu ambiente...</span>
                  </>
                ) : plan === 'pro' ? (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Ir para Pagamento Seguro (R$ 69,90/mês)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Criar Minha Loja Grátis (7 Dias)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-500 mt-3">
                Ao criar sua conta, você concorda com os Termos de Uso do MeuPedido360.
              </p>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#061325] text-slate-100 flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[450px] pointer-events-none opacity-20 blur-[160px] bg-gradient-to-r from-orange-500 via-amber-500 to-blue-600 -z-10 rounded-full" />

      <Suspense fallback={
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      }>
        <SignupFormContent />
      </Suspense>
    </div>
  );
}
