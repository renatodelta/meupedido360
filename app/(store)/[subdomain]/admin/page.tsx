'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChefHat, 
  Truck, 
  DollarSign, 
  TrendingUp, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Plus, 
  Phone, 
  MapPin, 
  CreditCard, 
  Sparkles, 
  X, 
  ExternalLink,
  ChevronRight,
  Store,
  Play
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface OrderItem {
  id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  customizations_json?: any[];
  total_price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address_json: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    complemento?: string;
  };
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: 'pending' | 'preparing' | 'ready_for_pickup' | 'in_route' | 'delivered' | 'cancelled';
  payment_method: string;
  payment_status: string;
  created_at: string;
  order_items: OrderItem[];
}

export default function AdminDashboardKDS() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;

  const [tenant, setTenant] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [isSimulatingOrder, setIsSimulatingOrder] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  // Audio Context ref for synthesized chime sound
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Function to play sound chime on new order
  const playNewOrderChime = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio chime error:', e);
    }
  };

  // 1. Initial Load: Fetch Tenant and Orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tenant/orders?slug=${encodeURIComponent(subdomain)}`);
      const data = await res.json();

      if (data.tenant) {
        setTenant(data.tenant);
      }
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subdomain) {
      fetchOrders();
    }
  }, [subdomain]);

  // 2. Supabase Realtime Subscription for Live Orders
  useEffect(() => {
    if (!tenant?.id) return;

    console.log('[KDS Realtime] Subscribing to live orders for tenant:', tenant.id);
    const channel = supabase
      .channel(`tenant-orders-${tenant.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        (payload) => {
          console.log('[KDS Realtime] Order event received:', payload);
          if (payload.eventType === 'INSERT') {
            playNewOrderChime();
          }
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.id]);

  // Update order status API call
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch('/api/tenant/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(prev =>
          prev.map(o => (o.id === orderId ? { ...o, status: newStatus as any } : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => (prev ? { ...prev, status: newStatus as any } : null));
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar pedido:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Simulate a test order for quick merchant demo
  const handleSimulateOrder = async () => {
    setIsSimulatingOrder(true);
    try {
      const sampleNames = ['Ana Silva', 'Marcos Oliveira', 'Juliana Lima', 'Rodrigo Santos', 'Fernanda Souza'];
      const sampleProducts = [
        { product_name: 'MeuPedido Smash Bacon', unit_price: 32.90, quantity: 2 },
        { product_name: 'Batata Rústica c/ Alecrim', unit_price: 18.90, quantity: 1 },
        { product_name: 'Coca-Cola Zero 350ml', unit_price: 7.50, quantity: 2 },
      ];

      const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const randomPhone = `119${Math.floor(10000000 + Math.random() * 90000000)}`;

      const res = await fetch('/api/tenant/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: subdomain,
          customer_name: randomName,
          customer_phone: randomPhone,
          delivery_address_json: {
            rua: 'Av. Paulista',
            numero: `${Math.floor(100 + Math.random() * 900)}`,
            bairro: 'Bela Vista',
            cidade: 'São Paulo',
            complemento: 'Apto 42'
          },
          items: sampleProducts,
          payment_method: 'pix',
          delivery_fee: 6.00
        })
      });

      const data = await res.json();
      if (data.success) {
        playNewOrderChime();
        await fetchOrders();
      }
    } catch (err) {
      console.error('Erro ao simular pedido:', err);
    } finally {
      setIsSimulatingOrder(false);
    }
  };

  // Calculate Metrics
  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready_for_pickup');
  const inRouteOrders = orders.filter(o => o.status === 'in_route');
  const completedOrders = orders.filter(o => o.status === 'delivered');

  const todayRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((acc, o) => acc + o.total, 0);

  const averageTicket = completedOrders.length > 0 ? todayRevenue / completedOrders.length : 0;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatTimeAgo = (dateStr: string) => {
    const minutes = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    if (minutes < 1) return 'Agora mesmo';
    if (minutes === 1) return 'há 1 minuto';
    return `há ${minutes} minutos`;
  };

  return (
    <div className="space-y-6">

      {/* TOP KDS HEADER & KPI STATS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        
        {/* Header Title & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Painel de Pedidos & KDS
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Ao Vivo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Gestão em tempo real da cozinha e entregas de {tenant?.name || subdomain}
              </p>
            </div>
          </div>

          {/* Quick Control Actions */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                soundEnabled 
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
              <span>{soundEnabled ? 'Som Ativo' : 'Som Mudo'}</span>
            </button>

            {/* Refresh Orders */}
            <button
              onClick={fetchOrders}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-400' : ''}`} />
              <span>Atualizar</span>
            </button>

            {/* Demo Order Simulator */}
            <button
              onClick={handleSimulateOrder}
              disabled={isSimulatingOrder}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isSimulatingOrder ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Simular Novo Pedido</span>
            </button>
          </div>
        </div>

        {/* Financial & Performance KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Faturamento Concluído</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              {formatCurrency(todayRevenue)}
            </div>
            <p className="text-[11px] text-slate-500">Total acumulado em pedidos entregues</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Pedidos Ativos</span>
              <ShoppingBag className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 tracking-tight">
              {activeOrders.length}
            </div>
            <p className="text-[11px] text-slate-500">Em preparo ou em rota de entrega</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Pedidos Concluídos</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              {completedOrders.length}
            </div>
            <p className="text-[11px] text-slate-500">Entregues com sucesso hoje</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Ticket Médio</span>
              <TrendingUp className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              {formatCurrency(averageTicket)}
            </div>
            <p className="text-[11px] text-slate-500">Média de valor por pedido</p>
          </div>

        </div>
      </div>

      {/* KANBAN BOARD (KITCHEN DISPLAY SYSTEM) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* COLUMN 1: NOVOS PEDIDOS (PENDING) */}
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
              <Clock className="w-4 h-4 animate-bounce" />
              <span>1. Novos (Pendentes)</span>
            </div>
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black flex items-center justify-center border border-amber-500/30">
              {pendingOrders.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {pendingOrders.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                Nenhum novo pedido pendente.
              </div>
            ) : (
              pendingOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-slate-900 border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl p-4 shadow-xl space-y-3 transition duration-200 cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono text-xs font-bold text-slate-300">
                      #{order.id.substring(0, 6)}
                    </span>
                    <span className="text-[11px] text-amber-400 font-semibold">
                      {formatTimeAgo(order.created_at)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm">{order.customer_name}</h3>
                    <p className="text-xs text-slate-400">{order.customer_phone}</p>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 space-y-1">
                    {order.order_items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between font-medium">
                        <span>{item.quantity}x {item.product_name}</span>
                        <span className="text-slate-400">{formatCurrency(item.total_price)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-black text-emerald-400 text-sm">{formatCurrency(order.total)}</span>
                    <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {order.payment_method}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, 'preparing');
                    }}
                    disabled={updatingOrderId === order.id}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Aceitar & Preparar</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: EM PREPARO (PREPARING) */}
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400 font-extrabold text-sm">
              <ChefHat className="w-4 h-4" />
              <span>2. Em Preparo</span>
            </div>
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black flex items-center justify-center border border-blue-500/30">
              {preparingOrders.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {preparingOrders.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                Nenhum pedido na cozinha no momento.
              </div>
            ) : (
              preparingOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 shadow-xl space-y-3 transition duration-200 cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono text-xs font-bold text-slate-300">
                      #{order.id.substring(0, 6)}
                    </span>
                    <span className="text-[11px] text-blue-400 font-semibold">
                      {formatTimeAgo(order.created_at)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm">{order.customer_name}</h3>
                    <p className="text-xs text-slate-400">{order.customer_phone}</p>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 space-y-1">
                    {order.order_items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between font-medium">
                        <span>{item.quantity}x {item.product_name}</span>
                        <span className="text-slate-400">{formatCurrency(item.total_price)}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, 'ready_for_pickup');
                    }}
                    disabled={updatingOrderId === order.id}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Pronto para Retirada</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 3: PRONTOS / AGUARDANDO RETIRADA (READY_FOR_PICKUP) */}
        <div className="space-y-4">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-400 font-extrabold text-sm">
              <ShoppingBag className="w-4 h-4" />
              <span>3. Prontos p/ Saída</span>
            </div>
            <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black flex items-center justify-center border border-purple-500/30">
              {readyOrders.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {readyOrders.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                Nenhum pedido aguardando retirada/despacho.
              </div>
            ) : (
              readyOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 shadow-xl space-y-3 transition duration-200 cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono text-xs font-bold text-slate-300">
                      #{order.id.substring(0, 6)}
                    </span>
                    <span className="text-[11px] text-purple-400 font-semibold">
                      {formatTimeAgo(order.created_at)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm">{order.customer_name}</h3>
                    <p className="text-xs text-slate-400">{order.customer_phone}</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, 'in_route');
                    }}
                    disabled={updatingOrderId === order.id}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center gap-1.5 transition"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Despachar p/ Entrega</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 4: EM ROTA (IN_ROUTE) */}
        <div className="space-y-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
              <Truck className="w-4 h-4 animate-pulse" />
              <span>4. Em Rota de Entrega</span>
            </div>
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black flex items-center justify-center border border-emerald-500/30">
              {inRouteOrders.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {inRouteOrders.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                Nenhum pedido em rota no momento.
              </div>
            ) : (
              inRouteOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 shadow-xl space-y-3 transition duration-200 cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono text-xs font-bold text-slate-300">
                      #{order.id.substring(0, 6)}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      {formatTimeAgo(order.created_at)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm">{order.customer_name}</h3>
                    <p className="text-xs text-slate-400">{order.customer_phone}</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, 'delivered');
                    }}
                    disabled={updatingOrderId === order.id}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Concluir Entrega</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* DETAILED ORDER MODAL DRAWER */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-rose-400">
                PEDIDO #{selectedOrder.id.substring(0, 8)}
              </span>
              <h2 className="text-xl font-extrabold text-white">{selectedOrder.customer_name}</h2>
              <p className="text-xs text-slate-400">{formatTimeAgo(selectedOrder.created_at)}</p>
            </div>

            {/* Direct WhatsApp Contact Button */}
            <a
              href={`https://wa.me/55${selectedOrder.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Olá ${selectedOrder.customer_name}, sobre o seu pedido #${selectedOrder.id.substring(0, 6)} na ${tenant?.name || 'nossa loja'}:`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30 font-bold text-xs transition shadow-sm"
            >
              <Phone className="w-4 h-4" />
              <span>Falar com o Cliente no WhatsApp ({selectedOrder.customer_phone})</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Customer Delivery Address */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1 text-xs">
              <div className="font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>Endereço de Entrega</span>
              </div>
              <p className="text-white font-medium">
                {selectedOrder.delivery_address_json?.rua || 'Rua Principal'}, nº {selectedOrder.delivery_address_json?.numero || 'S/N'}
              </p>
              <p className="text-slate-400">
                {selectedOrder.delivery_address_json?.bairro || 'Bairro'} - {selectedOrder.delivery_address_json?.cidade || 'Cidade'}
              </p>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Itens do Pedido</h3>
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 divide-y divide-slate-850 overflow-hidden text-xs">
                {selectedOrder.order_items?.map((item, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center text-slate-200">
                    <div>
                      <span className="font-bold text-white">{item.quantity}x</span> {item.product_name}
                    </div>
                    <div className="font-mono font-bold text-slate-300">
                      {formatCurrency(item.total_price)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Taxa de Entrega</span>
                <span>{formatCurrency(selectedOrder.delivery_fee)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-white pt-1">
                <span>Total</span>
                <span className="text-emerald-400 font-mono text-base">{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Order Status Advancement Control */}
            <div className="pt-3 flex gap-2">
              {selectedOrder.status === 'pending' && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition"
                >
                  Mover para Em Preparo
                </button>
              )}
              {selectedOrder.status === 'preparing' && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'ready_for_pickup')}
                  className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs transition"
                >
                  Mover para Pronto para Saída
                </button>
              )}
              {selectedOrder.status === 'ready_for_pickup' && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'in_route')}
                  className="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs transition"
                >
                  Despachar para Entrega
                </button>
              )}
              {selectedOrder.status === 'in_route' && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition"
                >
                  Marcar como Entregue
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
