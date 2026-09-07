'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  Clock,
  ChefHat,
  ShoppingBag,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  MapPin,
  CreditCard,
  DollarSign,
  Zap,
  Phone,
  MessageCircle,
  Share2,
  Copy,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { formatPhone } from '@/lib/formatters';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface OrderItem {
  id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  customizations_json?: any[];
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle_model?: string;
  vehicle_plate?: string;
  status?: string;
}

interface Order {
  id: string;
  tenant_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address_json: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    complemento?: string;
    troco_para?: string;
  };
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: 'pending' | 'preparing' | 'ready_for_pickup' | 'in_route' | 'delivered' | 'cancelled';
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at?: string;
  driver_id?: string | null;
  order_items: OrderItem[];
  drivers?: Driver | null;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  primary_color?: string;
  phone_whatsapp?: string | null;
  logo_url?: string | null;
}

const KANBAN_STAGES = [
  {
    id: 'pending',
    stepNumber: 1,
    title: 'Recebido',
    label: '1. Recebido',
    description: 'Pedido registrado! Aguardando confirmação da cozinha.',
    icon: Clock,
    colorTheme: 'amber',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    activeGradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'preparing',
    stepNumber: 2,
    title: 'Em Preparo',
    label: '2. Em Preparo',
    description: 'A cozinha aceitou seu pedido e já está preparando.',
    icon: ChefHat,
    colorTheme: 'blue',
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    activeGradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'ready_for_pickup',
    stepNumber: 3,
    title: 'Prontos p/ Saída',
    label: '3. Prontos p/ Saída',
    description: 'Seu pedido está pronto e embalado, aguardando o entregador.',
    icon: ShoppingBag,
    colorTheme: 'purple',
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    activeGradient: 'from-purple-500 to-pink-600',
  },
  {
    id: 'in_route',
    stepNumber: 4,
    title: 'Em Rota de Entrega',
    label: '4. Em Rota de Entrega',
    description: 'O entregador saiu com o seu pedido a caminho do endereço!',
    icon: Truck,
    colorTheme: 'emerald',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    activeGradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'delivered',
    stepNumber: 5,
    title: 'Entregue',
    label: '5. Entregue',
    description: 'Pedido entregue com sucesso! Bom apetite!',
    icon: CheckCircle2,
    colorTheme: 'teal',
    badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    activeGradient: 'from-teal-500 to-emerald-600',
  },
];

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
};

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params?.subdomain as string;
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Audio Context for synthesized status chime
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.25); // G5

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio chime unavailable:', e);
    }
  };

  // Fetch Order and Tenant details
  const fetchOrder = async (isSilent = false) => {
    if (!orderId) return;
    if (!isSilent) setLoading(true);

    try {
      const res = await fetch(`/api/tenant/orders?order_id=${encodeURIComponent(orderId)}`);
      const data = await res.json();

      if (res.ok && data.order) {
        setOrder(prev => {
          // Detect status change to alert consumer
          if (prev && prev.status !== data.order.status) {
            const newStage = KANBAN_STAGES.find(s => s.id === data.order.status);
            if (newStage) {
              setStatusNotification(`Status atualizado para: ${newStage.label}!`);
              playChime();
            }
          }
          return data.order;
        });

        if (data.tenant) {
          setTenant(data.tenant);
        }
        setError(null);
      } else {
        setError(data.error || 'Pedido não encontrado.');
      }
    } catch (err) {
      console.error('Erro ao carregar pedido:', err);
      if (!isSilent) setError('Falha de comunicação com o servidor.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // Realtime Supabase Subscription
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`consumer-order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log('[Realtime Tracker] Status update received:', payload);
          // Refresh order to get any updated driver or item associations
          fetchOrder(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // Clear notification timer
  useEffect(() => {
    if (statusNotification) {
      const timer = setTimeout(() => setStatusNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusNotification]);

  // Copy tracking link
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Stage calculation
  const getStageIndex = (status: string) => {
    if (status === 'cancelled') return -1;
    return KANBAN_STAGES.findIndex(s => s.id === status);
  };

  const currentStageIndex = order ? getStageIndex(order.status) : 0;
  const currentStage = KANBAN_STAGES[currentStageIndex] || KANBAN_STAGES[0];
  const isCancelled = order?.status === 'cancelled';

  // Calculate progress percent
  const progressPercent = isCancelled
    ? 0
    : Math.min(100, Math.max(15, (currentStageIndex / (KANBAN_STAGES.length - 1)) * 100));

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center p-6">
        <div className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin"></div>
        <p className="text-sm font-semibold text-slate-400">Localizando seu pedido em tempo real...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white">Pedido Não Encontrado</h2>
          <p className="text-xs text-slate-400">
            {error || 'Não encontramos as informações deste pedido. Verifique o código e tente novamente.'}
          </p>
        </div>
        <a
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-xs shadow-lg hover:scale-105 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Voltar ao Cardápio</span>
        </a>
      </div>
    );
  }

  const deliveryAddress = order.delivery_address_json || {};
  const hasDriver = !!order.drivers;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">

      {/* TOP HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Cardápio</span>
          </a>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Pedido #{order.id.substring(0, 6).toUpperCase()}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                AO VIVO
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {tenant?.name || subdomain} • Criado às {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-slate-900/50 border-slate-850 text-slate-500'
            }`}
            title={soundEnabled ? 'Silenciar avisos sonoros' : 'Ativar avisos sonoros'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-[11px] hidden md:inline">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-rose-400" />}
            <span>{copied ? 'Link Copiado!' : 'Compartilhar'}</span>
          </button>

          <button
            onClick={() => fetchOrder(true)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Atualizar agora"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* STATUS UPDATE POPUP TOAST */}
      {statusNotification && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-200" />
            <span className="font-extrabold text-sm">{statusNotification}</span>
          </div>
          <span className="text-[10px] font-mono bg-black/20 px-2 py-0.5 rounded-full">AGORA</span>
        </div>
      )}

      {/* ACTIVE STATUS HERO BANNER */}
      {isCancelled ? (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-xl">
          <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-rose-400">Pedido Cancelado</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Este pedido foi cancelado pelo estabelecimento. Em caso de dúvidas, entre em contato diretamente pelo WhatsApp da loja.
          </p>
        </div>
      ) : (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentStage.activeGradient} flex items-center justify-center text-white shadow-xl shadow-rose-500/10 shrink-0`}
              >
                <currentStage.icon className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-1.5 border ${currentStage.badgeClass}`}>
                  Etapa {currentStage.stepNumber} de 5
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {currentStage.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  {currentStage.description}
                </p>
              </div>
            </div>

            {/* Quick Status Pill */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex md:flex-col items-center justify-between gap-2 min-w-[200px]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Previsão de Entrega
              </span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {order.status === 'delivered' ? 'Concluído' : '30 - 45 min'}
              </span>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="space-y-2">
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
              <span>Pedido Recebido</span>
              <span>Em Preparo</span>
              <span>Prontos p/ Saída</span>
              <span>Em Rota</span>
              <span>Entregue</span>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 CONSUMER KANBAN BOARD */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span>Evolução do Pedido no Kanban</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Atualização automática via WebSocket
          </span>
        </div>

        {/* 5-COLUMN KANBAN BOARD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {KANBAN_STAGES.map((stage, idx) => {
            const isCurrent = !isCancelled && idx === currentStageIndex;
            const isCompleted = !isCancelled && idx < currentStageIndex;
            const isUpcoming = isCancelled || idx > currentStageIndex;

            return (
              <div
                key={stage.id}
                className={`rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between min-h-[220px] ${
                  isCurrent
                    ? 'bg-slate-900 border-2 border-emerald-500/80 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/50 scale-[1.02]'
                    : isCompleted
                    ? 'bg-slate-900/80 border border-slate-800 opacity-90'
                    : 'bg-slate-950/40 border border-dashed border-slate-850 opacity-50'
                }`}
              >
                {/* COLUMN HEADER */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isCurrent
                          ? `bg-gradient-to-br ${stage.activeGradient} text-white shadow-md`
                          : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stage.stepNumber}
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isCurrent
                          ? 'bg-emerald-500 text-slate-950 font-black animate-pulse'
                          : isCompleted
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-900 text-slate-600'
                      }`}
                    >
                      {isCurrent ? 'Aqui Agora' : isCompleted ? 'Concluído' : 'Aguardando'}
                    </span>
                  </div>

                  <div>
                    <h4
                      className={`font-bold text-sm ${
                        isCurrent ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {stage.label}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                      {stage.description}
                    </p>
                  </div>
                </div>

                {/* CURRENT ORDER CARD PLACED IN ACTIVE COLUMN */}
                {isCurrent && (
                  <div className="mt-4 pt-3 border-t border-slate-800 bg-slate-950/60 -mx-1 -mb-1 p-2.5 rounded-xl border border-emerald-500/30">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-emerald-400">
                      <span>#{order.id.substring(0, 6).toUpperCase()}</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                    <p className="text-[11px] text-white font-medium truncate mt-1">
                      {order.order_items?.[0]?.product_name}
                      {order.order_items?.length > 1 ? ` +${order.order_items.length - 1} itens` : ''}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* COURIER / DRIVER CARD (Shown when in route or assigned) */}
      {hasDriver && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-emerald-500/40 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-inner">
                🛵
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Entregador Designado
                </span>
                <h4 className="text-lg font-black text-white mt-1">
                  {order.drivers?.name}
                </h4>
                <p className="text-xs text-slate-400">
                  {order.drivers?.vehicle_model || 'Motocicleta'} {order.drivers?.vehicle_plate ? `• Placa ${order.drivers.vehicle_plate}` : ''}
                </p>
              </div>
            </div>

            {order.drivers?.phone && (
              <a
                href={`https://wa.me/55${order.drivers.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${order.drivers.name}! Sou o cliente do pedido #${order.id.substring(0, 6).toUpperCase()}`)}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Conversar com Entregador</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* DETAILS GRID: ADDRESS & ITEMS BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* DELIVERY ADDRESS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm border-b border-slate-800 pb-3">
            <MapPin className="w-4 h-4" />
            <span>Endereço de Entrega</span>
          </div>

          <div className="space-y-1 text-xs">
            <p className="font-bold text-white text-sm">
              {deliveryAddress.rua || 'Rua não informada'}, {deliveryAddress.numero || 'S/N'}
            </p>
            <p className="text-slate-300">
              Bairro: {deliveryAddress.bairro || 'Centro'}
            </p>
            {deliveryAddress.complemento && (
              <p className="text-slate-400">
                Complemento: {deliveryAddress.complemento}
              </p>
            )}
            <p className="text-slate-500 pt-1">
              Destinatário: <strong>{order.customer_name}</strong> ({formatPhone(order.customer_phone)})
            </p>
          </div>

          {deliveryAddress.troco_para && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              💵 Troco solicitado para: <strong>{deliveryAddress.troco_para}</strong>
            </div>
          )}
        </div>

        {/* PAYMENT METHOD */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm border-b border-slate-800 pb-3">
              <CreditCard className="w-4 h-4" />
              <span>Pagamento</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Forma escolhida:</span>
                <span className="font-bold text-white uppercase bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  {order.payment_method?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status do pagamento:</span>
                <span className="font-semibold text-emerald-400">
                  {order.payment_status === 'paid' ? 'Pago Online' : 'Pagar na Entrega'}
                </span>
              </div>
            </div>
          </div>

          {/* STORE WHATSAPP BUTTON */}
          {tenant?.phone_whatsapp && (
            <a
              href={`https://wa.me/55${tenant.phone_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Tenho uma dúvida sobre o pedido #${order.id.substring(0, 6).toUpperCase()} realizado em ${tenant.name}.`)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Dúvidas? Falar com {tenant.name}</span>
            </a>
          )}
        </div>
      </div>

      {/* ITEMS LIST & FINANCIAL TOTAL */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-rose-400" />
            <span>Itens do Pedido ({order.order_items?.length || 0})</span>
          </h4>
          <span className="text-xs font-mono text-slate-400 font-bold">
            Total: {formatCurrency(order.total)}
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {order.order_items?.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-400 font-bold flex items-center justify-center text-xs">
                  {item.quantity}x
                </span>
                <div>
                  <p className="font-bold text-white">{item.product_name}</p>
                  <p className="text-[11px] text-slate-500">
                    {formatCurrency(item.unit_price)} cada
                  </p>
                </div>
              </div>
              <span className="font-mono font-bold text-white">
                {formatCurrency(item.total_price)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal dos itens:</span>
            <span className="font-mono">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Taxa de entrega:</span>
            <span className="font-mono">{formatCurrency(order.delivery_fee)}</span>
          </div>
          <div className="flex justify-between text-white font-extrabold text-base pt-2 border-t border-slate-800/60">
            <span>Total:</span>
            <span className="font-mono text-emerald-400">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
