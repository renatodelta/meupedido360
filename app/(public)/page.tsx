'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Shield, 
  Sparkles, 
  Zap, 
  Smartphone, 
  Check, 
  CreditCard, 
  ChevronRight, 
  Store, 
  UtensilsCrossed, 
  Bike,
  Monitor,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
  Calculator,
  HelpCircle,
  MessageCircle,
  Percent,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export default function LandingPage() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(15000);
  const marketplaceFeeRate = 0.27; // 27% average commission on traditional delivery apps
  const marketplaceCost = Math.round(monthlyRevenue * marketplaceFeeRate);
  const meuPedidoCost = 69.90;
  const monthlySavings = Math.max(0, marketplaceCost - meuPedidoCost);
  const annualSavings = monthlySavings * 12;

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Preciso ter meu próprio domínio ou pagar hospedagem?',
      a: 'Não! Você recebe imediatamente um subdomínio exclusivo (ex: sualoja.meupedido360.com) com SSL gratuito e hospedagem de alta performance inclusa no plano.'
    },
    {
      q: 'O MeuPedido360 cobra porcentagem sobre as minhas vendas?',
      a: 'Zero porcentagem! Você paga apenas o valor fixo da assinatura mensal (R$ 69,90) e 100% do faturamento dos seus pedidos vai direto para você.'
    },
    {
      q: 'Como funciona a gestão de motoboys e entregadores?',
      a: 'Você cadastra seus entregadores com taxa fixa ou personalizada. Ao despachar um pedido, o sistema envia mensagem pronta no WhatsApp com endereço e link do Google Maps para o motoboy. No final do turno, o relatório de acerto de caixa fecha todas as contas em segundos.'
    },
    {
      q: 'Posso testar antes de assinar?',
      a: 'Sim! Oferecemos 7 dias de teste grátis sem necessidade de cadastrar cartão de crédito. Crie sua conta e configure seu cardápio em menos de 2 minutos.'
    }
  ];

  return (
    <div className="bg-[#061325] text-slate-100 min-h-screen font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
      
      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-25 blur-[160px] bg-gradient-to-b from-orange-500/40 via-blue-600/30 to-transparent -z-10 rounded-full" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] pointer-events-none opacity-15 blur-[150px] bg-blue-600 -z-10 rounded-full" />

      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#061325]/85 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo with high prominence */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-orange-500 via-amber-400 to-orange-600 shadow-xl shadow-orange-500/25 group-hover:scale-105 transition-all duration-300">
              <img 
                src="/logo.png" 
                alt="Pedido 360 Logo" 
                className="h-11 sm:h-12 w-11 sm:w-12 rounded-full object-cover shadow-inner"
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                MEUPEDIDO<span className="text-orange-500">360</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase font-extrabold text-orange-400 -mt-0.5">
                Mais Pedidos. Menos Taxas.
              </span>
            </div>
          </a>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#como-funciona" className="hover:text-orange-400 transition-colors">Como Funciona</a>
            <a href="#recursos" className="hover:text-orange-400 transition-colors">Recursos</a>
            <a href="#calculadora" className="hover:text-orange-400 transition-colors">Economia</a>
            <a href="#planos" className="hover:text-orange-400 transition-colors">Planos</a>
            <a href="#faq" className="hover:text-orange-400 transition-colors">Dúvidas</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a 
              href="/login" 
              className="text-sm font-bold text-slate-300 hover:text-white transition px-3 sm:px-4 py-2"
            >
              Entrar
            </a>
            <a 
              href="/signup?plan=trial" 
              className="relative group overflow-hidden text-sm font-bold text-white bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 px-5 sm:px-6 py-2.5 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                Começar Grátis
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </a>
          </div>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-20 text-center space-y-8">
        
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-blue-500/10 text-orange-400 border border-orange-500/30 shadow-lg shadow-orange-500/5">
          <Sparkles className="w-4 h-4 text-orange-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>A Solução 360° Definitiva para Cardápios e Entregas</span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline text-sky-400">Zero Taxas por Pedido</span>
        </div>
        
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.08]">
          Cardápio Digital, Cozinha & Delivery em{' '}
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
            uma só plataforma 360°
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-300 text-lg sm:text-xl max-w-3xl mx-auto font-normal leading-relaxed">
          Crie sua loja com subdomínio próprio (<code className="text-orange-400 font-mono font-semibold bg-orange-950/40 px-2 py-0.5 rounded border border-orange-500/20">sualoja.meupedido360.com</code>), 
          receba pedidos com alerta sonoro no painel KDS e despache entregadores via WhatsApp em 1 clique.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <a 
            href="/signup?plan=trial"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-2xl transition duration-300 transform hover:scale-[1.03] active:scale-[0.98] shadow-xl shadow-orange-500/30"
          >
            <span>Criar Meu Cardápio Grátis</span>
            <ChevronRight className="w-5 h-5" />
          </a>
          <a 
            href="#como-funciona"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-slate-200 hover:text-white bg-[#0B2545]/60 hover:bg-[#0B2545] rounded-2xl border border-slate-700/80 transition duration-300 backdrop-blur-md"
          >
            <span>Ver Como Funciona</span>
          </a>
        </div>

        {/* REPLICATING THE 360° LOGO CONCEPT IN AN INTERACTIVE SHOWCASE */}
        <div className="pt-10 max-w-5xl mx-auto">
          <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900/90 via-[#0B2545]/40 to-slate-950/90 border border-slate-700/70 backdrop-blur-2xl shadow-2xl shadow-orange-500/10">
            
            {/* Header Badge */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Ecossistema Integrado em Tempo Real
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <span>Padaria & Hamburgueria Demo</span>
                <span className="text-orange-400 font-mono">padaria.meupedido360.com</span>
              </div>
            </div>

            {/* 3 Pillars Flow (Logo Representation) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 relative items-stretch">
              
              {/* Pillar 1: Smartphone 360 */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-orange-500/30 text-left space-y-3 relative overflow-hidden group hover:border-orange-500 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    Passo 1 • Cliente
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">
                    1. Cardápio no Celular
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    O cliente acessa seu subdomínio sem baixar aplicativo, seleciona produtos, adicionais e finaliza no Pix ou Cartão.
                  </p>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-300 font-medium">
                    <span>🍔 Combo Smash + Fritas</span>
                    <span className="text-emerald-400 font-bold">R$ 38,90</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Pagamento: Pix Instantâneo ✓</div>
                </div>
              </div>

              {/* Pillar 2: Kitchen KDS Screen */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-blue-500/30 text-left space-y-3 relative overflow-hidden group hover:border-blue-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-sky-400 flex items-center justify-center">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-sky-300 border border-blue-500/30">
                    Passo 2 • Cozinha
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors">
                    2. Painel KDS & Cozinha
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Alerta sonoro imediato no computador da cozinha via WebSocket. A equipe move os pedidos no quadro Kanban em tempo real.
                  </p>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-[11px] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>Em Preparo (04:12)</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded">
                    Pedido #1042
                  </span>
                </div>
              </div>

              {/* Pillar 3: Motoboy & Delivery */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-left space-y-3 relative overflow-hidden group hover:border-emerald-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <Bike className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Passo 3 • Entrega
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                    3. Despacho & Motoboy
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Atribuição do entregador com rota no WhatsApp e GPS. No final do turno, fechamento de caixa de corridas em 1 clique.
                  </p>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-[11px] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Em Rota com Carlos</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                    GPS Ativo
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* METRICS & PROOFS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-6">
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="text-2xl sm:text-3xl font-black text-orange-400">0%</div>
            <div className="text-xs font-semibold text-slate-400">Taxas por Pedido</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="text-2xl sm:text-3xl font-black text-white">&lt; 60s</div>
            <div className="text-xs font-semibold text-slate-400">Criação do Cardápio</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="text-2xl sm:text-3xl font-black text-sky-400">100%</div>
            <div className="text-xs font-semibold text-slate-400">Subdomínio Próprio</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">Realtime</div>
            <div className="text-xs font-semibold text-slate-400">KDS com Alerta Sonoro</div>
          </div>
        </div>

      </section>

      {/* HOW IT WORKS (COMO FUNCIONA) */}
      <section id="como-funciona" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/80 space-y-16 scroll-mt-20">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            Fluxo Ágil e Intuitivo
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Como funciona o MeuPedido360?
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg font-light leading-relaxed">
            Veja como você sai do papel para uma operação profissional de delivery em 4 etapas simples:
          </p>
        </div>

        {/* 4 STEPS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* STEP 1 */}
          <div className="relative p-7 rounded-3xl bg-gradient-to-b from-slate-900/80 to-[#0B2545]/20 border border-slate-800 hover:border-orange-500/50 transition-all duration-300 flex flex-col justify-between group space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-black bg-gradient-to-br from-orange-400 to-amber-500 bg-clip-text text-transparent">
                  01
                </span>
                <div className="w-12 h-12 rounded-2xl bg-orange-500/15 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Store className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">
                Crie sua Loja em 60s
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Escolha o seu subdomínio exclusivo (ex: <span className="text-orange-400 font-mono text-xs">sualoja.meupedido360.com</span>), defina suas cores e envie sua logo. Tudo pronto na hora.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center text-xs text-orange-400 font-semibold">
              <span>✓ Subdomínio ativo instantaneamente</span>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="relative p-7 rounded-3xl bg-gradient-to-b from-slate-900/80 to-[#0B2545]/20 border border-slate-800 hover:border-sky-500/50 transition-all duration-300 flex flex-col justify-between group space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-black bg-gradient-to-br from-sky-400 to-blue-500 bg-clip-text text-transparent">
                  02
                </span>
                <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors">
                Monte seu Cardápio
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Cadastre categorias, fotos de alta qualidade, descrições detalhadas, opções de adicionais, acompanhamentos e promoções.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center text-xs text-sky-400 font-semibold">
              <span>✓ Responsivo e ultra veloz</span>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="relative p-7 rounded-3xl bg-gradient-to-b from-slate-900/80 to-[#0B2545]/20 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between group space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-black bg-gradient-to-br from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  03
                </span>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                Receba Pedidos no KDS
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Alerta sonoro ao vivo a cada novo pedido. Acompanhe a produção no painel da cozinha em tempo real pelo Kanban.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center text-xs text-amber-400 font-semibold">
              <span>✓ WebSocket ao vivo sem recarregar</span>
            </div>
          </div>

          {/* STEP 4 */}
          <div className="relative p-7 rounded-3xl bg-gradient-to-b from-slate-900/80 to-[#0B2545]/20 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between group space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-black bg-gradient-to-br from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                  04
                </span>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bike className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                Despache & Feche o Caixa
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Atribua o motoboy em 1 clique e envie rota no WhatsApp com link do GPS. Feche o acerto de taxas e recebimentos no final do dia.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center text-xs text-emerald-400 font-semibold">
              <span>✓ Acerto com motoboy em 1 clique</span>
            </div>
          </div>

        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section id="recursos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/80 space-y-16 scroll-mt-20">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Recursos de Alta Performance
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Tudo o que seu delivery precisa para crescer
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg">
            Ferramentas profissionais projetadas para aumentar seu ticket médio e fidelizar seus clientes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-md hover:border-orange-500/40 transition duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/15 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">Subdomínios Dinâmicos</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Cada lojista recebe um endereço único na web instantaneamente (ex: <code className="text-orange-400 font-mono text-xs">padaria.meupedido360.com</code>). 
              Totalmente configurado no edge da Vercel.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-md hover:border-orange-500/40 transition duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/15 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">Identidade Visual Flexível</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Altere a logo, o banner e defina as cores primárias, secundárias e de fundo direto no painel. O cardápio digital atualiza as variáveis CSS na hora.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-md hover:border-orange-500/40 transition duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/15 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">Pedidos em Tempo Real</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Não perca nenhum pedido. A cozinha recebe notificações automáticas com alerta sonoro através do canal WebSocket de alta velocidade.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-md hover:border-orange-500/40 transition duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/15 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">Mercado Pago & Kiwify</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ativação automática via Webhook. Cobrança recorrente inteligente e liberação imediata de todos os recursos após a confirmação.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-md hover:border-orange-500/40 transition duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/15 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">Segurança PostgreSQL RLS</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Isolamento completo e inviolável a nível de banco de dados. Um lojista nunca poderá visualizar pedidos, clientes ou faturamentos de outras lojas.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-md hover:border-orange-500/40 transition duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/15 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bike className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">Gestão de Entregadores</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Cadastre seus motoboys, atribua entregas no Kanban em 1 clique, despache rotas via WhatsApp com link do GPS e faça o acerto de caixa diário sem complicação.
            </p>
          </div>

        </div>
      </section>

      {/* SAVINGS CALCULATOR (CALCULADORA DE ECONOMIA VS MARKETPLACE) */}
      <section id="calculadora" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/80 space-y-12 scroll-mt-20">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            Simulador de Lucro
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Quanto você está perdendo em taxas de marketplaces?
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg">
            Descubra quanto você economiza todo mês vendendo no seu próprio cardápio digital MeuPedido360:
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-900/90 via-[#0B2545]/40 to-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-10 backdrop-blur-2xl shadow-2xl">
          
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label htmlFor="revenue-slider" className="text-sm font-bold text-slate-300">
                Seu Faturamento Mensal Estimado no Delivery:
              </label>
              <div className="text-2xl sm:text-3xl font-black text-orange-400">
                {monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>

            {/* Slider */}
            <input 
              id="revenue-slider"
              type="range" 
              min="3000" 
              max="100000" 
              step="1000"
              value={monthlyRevenue} 
              onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-xs font-semibold text-slate-500">
              <span>R$ 3.000/mês</span>
              <span>R$ 50.000/mês</span>
              <span>R$ 100.000/mês</span>
            </div>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 mt-8 border-t border-slate-800">
            
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2">
              <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                Em Aplicativos Tradicionais (~27% Taxa)
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-400">
                - {marketplaceCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="text-xs text-rose-300/80">
                Valor pago todo mês apenas em comissões sobre suas vendas.
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Economia com MeuPedido360
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                + {monthlySavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                <span className="text-xs font-normal text-slate-400"> /mês</span>
              </div>
              <div className="text-xs text-emerald-300/80 font-semibold">
                🎉 São {annualSavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} a mais de lucro no seu bolso por ano!
              </div>
            </div>

          </div>

          <div className="mt-8 text-center">
            <a 
              href="/signup?plan=trial"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-2xl transition duration-300 shadow-xl shadow-orange-500/25"
            >
              <span>Começar a Economizar Agora (7 Dias Grátis)</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

        </div>
      </section>

      {/* PRICING PLANS SECTION */}
      <section id="planos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/80 space-y-16 scroll-mt-20">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Preço Transparente e Sem Surpresas
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Planos simples, sem taxas por pedido
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg">
            Escolha o plano ideal para o tamanho do seu negócio e comece a vender hoje mesmo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8 items-stretch">
          
          {/* Plan 1: Trial */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md hover:border-slate-700 transition duration-300 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Período de Testes
              </span>
              <h3 className="text-2xl font-bold text-white">Trial 7 dias</h3>
              <p className="text-slate-400 text-sm">
                Experimente todos os recursos premium sem precisar cadastrar cartão de crédito.
              </p>
              <div className="text-4xl font-black text-white">
                R$ 0
              </div>
            </div>
            
            <ul className="space-y-3.5 text-sm text-slate-300">
              <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Subdomínio dinâmico próprio</li>
              <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Até 100 produtos cadastrados</li>
              <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Pedidos em tempo real ilimitados</li>
              <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Painel de controle e cardápio online</li>
            </ul>

            <a 
              href="/signup?plan=trial"
              className="w-full text-center py-3.5 text-sm font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl transition duration-200"
            >
              Criar Conta Grátis
            </a>
          </div>

          {/* Plan 2: Pro (Highlighted) */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900/90 via-[#0B2545]/40 to-slate-900/90 border-2 border-orange-500/60 backdrop-blur-md relative overflow-hidden flex flex-col justify-between space-y-6 shadow-2xl shadow-orange-500/10">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-amber-500 text-white text-xs font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">
              MAIS POPULAR
            </div>
            
            <div className="space-y-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                Acesso Premium Completo
              </span>
              <h3 className="text-2xl font-bold text-white">Mensal Pro</h3>
              <p className="text-slate-400 text-sm">
                Todo o poder da nossa plataforma de delivery para alavancar suas vendas recorrentes sem intermediários.
              </p>
              <div className="text-4xl font-black text-white">
                R$ 69,90<span className="text-sm font-normal text-slate-400">/mês</span>
              </div>
            </div>
            
            <ul className="space-y-3.5 text-sm text-slate-200 font-medium">
              <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-orange-400" /> Subdomínio próprio + Cores & Logo customizadas</li>
              <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-orange-400" /> Produtos, categorias e adicionais ilimitados</li>
              <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-orange-400" /> Painel de Cozinha KDS com Alerta Sonoro</li>
              <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-orange-400" /> Gestão de Entregadores + Fechamento de Caixa</li>
              <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-orange-400" /> Despacho no WhatsApp com rota do Google Maps</li>
              <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-orange-400" /> Suporte prioritário via WhatsApp</li>
            </ul>

            <a 
              href="/signup?plan=pro"
              className="w-full text-center py-4 text-sm font-extrabold text-white bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl transition duration-200 shadow-xl shadow-orange-500/25 hover:scale-[1.02]"
            >
              Assinar Plano Pro Agora
            </a>
          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/80 space-y-12 scroll-mt-20">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <HelpCircle className="w-3.5 h-3.5" />
            Tire Suas Dúvidas
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden transition-all duration-200"
            >
              <button 
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-white hover:text-orange-400 transition"
              >
                <span>{faq.q}</span>
                <ChevronRight className={`w-5 h-5 transition-transform duration-200 text-slate-400 ${openFaq === index ? 'rotate-90 text-orange-400' : ''}`} />
              </button>
              {openFaq === index && (
                <div className="px-5 pb-5 text-slate-300 text-sm leading-relaxed border-t border-slate-800/60 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 p-8 sm:p-14 overflow-hidden shadow-2xl shadow-orange-500/20 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-3 max-w-xl">
            <h3 className="text-3xl sm:text-4xl font-black text-white">
              Pronto para transformar o delivery do seu restaurante?
            </h3>
            <p className="text-orange-100 text-sm sm:text-base">
              Crie seu cardápio digital agora mesmo. São 7 dias de teste grátis sem burocracia e sem cartão.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 justify-center">
            <a 
              href="/signup?plan=trial"
              className="px-8 py-4 text-base font-extrabold bg-slate-950 text-white hover:bg-slate-900 rounded-2xl shadow-2xl transition duration-300 hover:scale-105"
            >
              Criar Cardápio Grátis
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-800/80 space-y-8 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          
          {/* Logo in footer */}
          <div className="flex items-center gap-3">
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 shadow-md">
              <img 
                src="/logo.png" 
                alt="Pedido 360 Logo" 
                className="h-10 w-10 rounded-full object-cover"
              />
            </div>
            <div>
              <div className="text-lg font-black text-white">
                MEUPEDIDO<span className="text-orange-500">360</span>
              </div>
              <div className="text-[10px] uppercase font-extrabold text-orange-400">
                Mais Pedidos. Menos Taxas.
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-slate-400">
            <a href="/login" className="hover:text-white transition">Área do Lojista</a>
            <a href="/signup" className="hover:text-white transition">Criar Loja</a>
            <a href="#como-funciona" className="hover:text-white transition">Como Funciona</a>
            <a href="#planos" className="hover:text-white transition">Planos</a>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800/60 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} MeuPedido360. Todos os direitos reservados.
          </div>
          <div className="flex gap-4">
            <span>Tecnologia em Tempo Real</span>
            <span>•</span>
            <span>Isolamento RLS</span>
            <span>•</span>
            <span>Mercado Pago & Kiwify</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
