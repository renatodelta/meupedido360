import React from 'react';
import { Shield, Sparkles, Zap, Smartphone, Check, CreditCard, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-rose-500 selection:text-white overflow-x-hidden">
      
      {/* BACKGROUND GRADIENT GLOWS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none opacity-20 blur-[150px] bg-gradient-to-r from-rose-500 via-purple-600 to-pink-500 -z-10 rounded-full" />

      {/* HEADER / NAVIGATION */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Zap className="w-6 h-6 text-white fill-white/10" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            MeuPedido<span className="bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent">360</span>
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition">Recursos</a>
          <a href="#pricing" className="hover:text-white transition">Planos</a>
          <a href="#demo" className="hover:text-white transition">Como Funciona</a>
        </nav>

        <div className="flex items-center gap-4">
          <a href="/login" className="text-sm font-semibold hover:text-white transition px-4 py-2">
            Entrar
          </a>
          <a 
            href="/signup?plan=trial" 
            className="text-sm font-semibold bg-white text-slate-950 px-5 py-2.5 rounded-xl hover:bg-slate-200 transition shadow-lg shadow-white/5"
          >
            Começar Grátis
          </a>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          Nova Era de Cardápios Digitais
        </div>
        
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-none">
          O Cardápio Digital ideal com{' '}
          <span className="bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            seu próprio subdomínio
          </span>
        </h1>

        <p className="text-slate-400 text-lg sm:text-xl max-w-3xl mx-auto font-light leading-relaxed">
          Crie uma plataforma de delivery automatizada. Tenha o domínio da sua marca (ex: <code className="text-rose-400 font-mono">sualoja.meupedido360.com</code>), 
          gerenciamento em tempo real de pedidos e pagamentos recorrentes integrados via Mercado Pago.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a 
            href="/signup?plan=trial"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 rounded-xl transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rose-500/20"
          >
            Criar meu Cardápio
            <ChevronRight className="w-5 h-5" />
          </a>
          <a 
            href="#features"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800/80 rounded-xl border border-slate-800 transition duration-300"
          >
            Conhecer Recursos
          </a>
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-900 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Recursos robustos para impulsionar seu Delivery</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Tudo que você precisa para gerenciar sua loja, receber pagamentos e fidelizar clientes sem pagar taxas abusivas de marketplaces.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Subdomínios dinâmicos */}
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md hover:border-rose-500/30 transition duration-300 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white">Subdomínios Dinâmicos</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Cada lojista recebe um endereço único na web instantaneamente (ex: <code className="text-rose-400 font-mono text-xs">padaria.meupedido360.com</code>). 
              Totalmente configurado no edge da Vercel.
            </p>
          </div>

          {/* Card 2: Cores dinâmicas */}
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md hover:border-rose-500/30 transition duration-300 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white">Identidade Visual Flexível</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Altere a logo, o banner e defina as cores primárias, secundárias e de fundo direto no painel. O cardápio digital atualiza as variáveis CSS no Tailwind na hora.
            </p>
          </div>

          {/* Card 3: Realtime */}
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md hover:border-rose-500/30 transition duration-300 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white">Pedidos em Tempo Real</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Não perca nenhum pedido. A cozinha recebe notificações automáticas no painel através do canal WebSocket de alta velocidade do Supabase Realtime.
            </p>
          </div>

          {/* Card 4: Mercado Pago */}
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md hover:border-rose-500/30 transition duration-300 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white">Webhook Mercado Pago</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Lojistas assinam e têm seus cardápios ativados em segundos. Cobrança recorrente inteligente e suspensão automatizada em caso de inadimplência.
            </p>
          </div>

          {/* Card 5: Segurança RLS */}
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md hover:border-rose-500/30 transition duration-300 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white">Segurança PostgreSQL RLS</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Isolamento completo e inviolável a nível de banco de dados. Um lojista nunca poderá visualizar pedidos, produtos ou faturamentos de outros tenants.
            </p>
          </div>

          {/* Card 6: Gestão de Entregadores & Fechamento */}
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md hover:border-rose-500/30 transition duration-300 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white">Gestão de Entregadores</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Cadastre seus motoboys, atribua entregas no Kanban em 1 clique, despache rotas via WhatsApp com link do GPS e faça o acerto de caixa diário sem complicação.
            </p>
          </div>

        </div>
      </section>

      {/* PRICING PLANS SECTION */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-900 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Planos simples, sem taxas por pedido</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Escolha o plano ideal para o tamanho do seu negócio e comece a vender hoje mesmo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
          
          {/* Plan 1: Trial */}
          <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md hover:border-slate-700/80 transition duration-300 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">Período de Testes</span>
              <h3 className="text-2xl font-bold text-white">Trial 7 dias</h3>
              <p className="text-slate-400 text-sm">Experimente todos os recursos premium sem precisar cadastrar cartão de crédito.</p>
              <div className="text-4xl font-black text-white">R$ 0</div>
            </div>
            
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Subdomínio dinâmico</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Até 100 produtos cadastrados</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Pedidos realtime ilimitados</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Painel administrativo básico</li>
            </ul>

            <a 
              href="/signup?plan=trial"
              className="w-full text-center py-3 text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl transition duration-200"
            >
              Criar Conta Grátis
            </a>
          </div>

          {/* Plan 2: Pro */}
          <div className="p-8 rounded-3xl bg-slate-900/40 border-2 border-rose-500/50 backdrop-blur-md relative overflow-hidden flex flex-col justify-between space-y-6 shadow-2xl shadow-rose-500/5">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-rose-500 to-pink-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl">
              RECOMENDADO
            </div>
            
            <div className="space-y-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Acesso Premium Completo</span>
              <h3 className="text-2xl font-bold text-white">Mensal Pro</h3>
              <p className="text-slate-400 text-sm">Todo o poder da nossa plataforma de delivery para alavancar suas vendas recorrentes.</p>
              <div className="text-4xl font-black text-white">R$ 59,90<span className="text-sm font-normal text-slate-400">/mês</span></div>
            </div>
            
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-rose-500" /> Subdomínio próprio + Cores customizadas</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-rose-500" /> Produtos e categorias ilimitados</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-rose-500" /> Painel de controle e cozinha completo</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-rose-500" /> Gestão de Entregadores + Fechamento de Caixa</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-rose-500" /> Despacho no WhatsApp com Google Maps</li>
            </ul>

            <a 
              href="/signup?plan=pro"
              className="w-full text-center py-3 text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 rounded-xl transition duration-200 shadow-md shadow-rose-500/15"
            >
              Assinar Plano Pro
            </a>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-900 text-center space-y-4 text-sm text-slate-500">
        <div>
          &copy; {new Date().getFullYear()} MeuPedido360. Todos os direitos reservados.
        </div>
        <div className="flex justify-center gap-6 text-slate-400">
          <a href="/terms" className="hover:text-white transition">Termos de Serviço</a>
          <a href="/privacy" className="hover:text-white transition">Privacidade</a>
          <a href="/contact" className="hover:text-white transition">Suporte</a>
        </div>
      </footer>

    </div>
  );
}
