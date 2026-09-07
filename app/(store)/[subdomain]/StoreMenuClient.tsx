'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  CheckCircle2, 
  ChevronRight, 
  Phone, 
  MapPin, 
  CreditCard, 
  DollarSign, 
  Zap, 
  ArrowRight, 
  Sparkles, 
  Loader2,
  AlertCircle,
  Navigation
} from 'lucide-react';
import { formatPhone } from '@/lib/formatters';

export interface Category {
  id: string;
  name: string;
  order_index: number;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface StoreMenuClientProps {
  tenant: {
    id: string;
    name: string;
    phone_whatsapp?: string | null;
  } | null;
  subdomain: string;
  categories: Category[];
  products: Product[];
  isCustomStore: boolean;
}

export default function StoreMenuClient({
  tenant,
  subdomain,
  categories,
  products,
  isCustomStore,
}: StoreMenuClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || 'all');

  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [addressRua, setAddressRua] = useState('');
  const [addressNumero, setAddressNumero] = useState('');
  const [addressBairro, setAddressBairro] = useState('');
  const [addressComplemento, setAddressComplemento] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cartao_entrega' | 'pix_entrega' | 'dinheiro_entrega'>('pix_entrega');
  const [trocoPara, setTrocoPara] = useState('');

  // Geolocation & Auto-address state
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const numeroInputRef = useRef<HTMLInputElement>(null);

  // Active order stored in local session for fast tracking
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`meupedido_last_order_${subdomain}`);
      if (saved) {
        setActiveOrderId(saved);
      }
    }
  }, [subdomain]);

  // Reverse Geocoding handler using OpenStreetMap Nominatim (No external API keys required)
  const handleGetLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus({
        type: 'error',
        message: 'Geolocalização não é suportada pelo seu navegador. Preencha manualmente.',
      });
      return;
    }

    setIsLocating(true);
    setLocationStatus(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'pt-BR,pt;q=0.9',
              },
            }
          );
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const road = addr.road || addr.pedestrian || addr.street || addr.residential || addr.suburb || '';
            const neighbourhood = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || '';

            if (road) setAddressRua(road);
            if (neighbourhood) setAddressBairro(neighbourhood);

            setLocationStatus({
              type: 'success',
              message: 'Localização identificada! Digite agora o número da residência e complemento.',
            });

            // Focus directly on the number field so user only types house number and complement
            setTimeout(() => {
              numeroInputRef.current?.focus();
            }, 250);
          } else {
            setLocationStatus({
              type: 'error',
              message: 'Não foi possível identificar o nome da via automaticamente. Digite abaixo.',
            });
          }
        } catch (err) {
          console.error('Erro ao geocodificar:', err);
          setLocationStatus({
            type: 'error',
            message: 'Falha ao buscar endereço pelo GPS. Você pode digitar manualmente abaixo.',
          });
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Não foi possível obter sua localização. Digite manualmente abaixo.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Permissão de GPS não concedida. Preencha o endereço manualmente abaixo.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Sinal de GPS indisponível no momento. Preencha o endereço manualmente.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Tempo limite de GPS esgotado. Preencha o endereço manualmente.';
        }
        setLocationStatus({
          type: 'error',
          message: msg,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ id: string; total: number } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const getProductQuantityInCart = (productId: string) => {
    const found = cart.find(item => item.product.id === productId);
    return found ? found.quantity : 0;
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = 5.00;
  const totalOrder = subtotal + deliveryFee;

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Handle Checkout Order Submission
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (cart.length === 0) {
      setFormError('Sua sacola está vazia.');
      return;
    }

    if (!customerName.trim()) {
      setFormError('Informe o seu nome completo.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Informe um telefone/WhatsApp válido com DDD.');
      return;
    }

    if (!addressRua.trim() || !addressNumero.trim() || !addressBairro.trim()) {
      setFormError('Preencha o endereço completo de entrega (Rua, Número e Bairro).');
      return;
    }

    try {
      setIsSubmitting(true);

      const itemsPayload = cart.map(item => ({
        product_id: item.product.id.startsWith('prod-') ? null : item.product.id,
        product_name: item.product.name,
        unit_price: item.product.price,
        quantity: item.quantity,
        total_price: item.product.price * item.quantity,
      }));

      const deliveryAddress = {
        rua: addressRua.trim(),
        numero: addressNumero.trim(),
        bairro: addressBairro.trim(),
        complemento: addressComplemento.trim() || undefined,
        troco_para: paymentMethod === 'dinheiro_entrega' && trocoPara ? trocoPara : undefined,
      };

      const res = await fetch('/api/tenant/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: subdomain,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          delivery_address_json: deliveryAddress,
          items: itemsPayload,
          payment_method: paymentMethod,
          delivery_fee: deliveryFee,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const orderId = data.order?.id || 'PEDIDO';
        setOrderSuccess({
          id: orderId,
          total: totalOrder,
        });
        if (typeof window !== 'undefined' && data.order?.id) {
          localStorage.setItem(`meupedido_last_order_${subdomain}`, data.order.id);
          setActiveOrderId(data.order.id);
        }
        setCart([]); // Clear cart
      } else {
        setFormError(data.error || 'Erro ao enviar pedido. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao enviar pedido:', err);
      setFormError('Falha de conexão com o servidor. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">

      {/* ACTIVE ORDER BANNER (Real-time Tracker shortcut) */}
      {activeOrderId && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-200 shadow-2xl animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <p className="font-extrabold text-white text-sm flex items-center gap-1.5">
                <span>Pedido #{activeOrderId.substring(0, 6).toUpperCase()} em andamento!</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">AO VIVO</span>
              </p>
              <p className="text-slate-400 text-xs">
                Acompanhe o preparo e a rota de entrega pelo Kanban em tempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={`/pedido/${activeOrderId}`}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition transform hover:scale-105"
            >
              <span>Acompanhar Pedido</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* DEMO NOTICE BANNER (shown only when viewing default mockup items) */}
      {!isCustomStore && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300 shadow-xl">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">💡</span>
            <span>
              <strong>Modo de Demonstração:</strong> Estes itens são modelos de exemplo. Cadastre seus próprios lanches, bebidas e preços reais.
            </span>
          </div>
          <a
            href="/admin/produtos"
            className="whitespace-nowrap px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold hover:scale-105 transition duration-200 shadow-md shadow-rose-500/20"
          >
            🍽️ Cadastrar Meus Produtos
          </a>
        </div>
      )}

      {/* CATEGORY FILTER TABS (STICKY BAR) */}
      <div className="sticky top-16 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-slate-200/60 dark:border-slate-850">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/50 dark:border-slate-800'
                }`}
                style={isActive ? { backgroundColor: 'var(--primary-color)' } : {}}
              >
                {cat.name}
              </a>
            );
          })}
        </div>
      </div>

      {/* PRODUCTS BY CATEGORY */}
      <div className="space-y-12 pb-24">
        {categories.map((cat) => {
          const categoryProducts = products.filter((p) => p.category_id === cat.id);
          if (categoryProducts.length === 0) return null;

          return (
            <section key={cat.id} id={cat.id} className="scroll-mt-36 space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {cat.name}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                  {categoryProducts.length}
                </span>
                <div className="h-0.5 flex-1 bg-slate-100 dark:bg-slate-800/80" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categoryProducts.map((product) => {
                  const qtyInCart = getProductQuantityInCart(product.id);
                  return (
                    <div
                      key={product.id}
                      className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 overflow-hidden flex flex-col sm:flex-row hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition duration-300"
                    >
                      {/* Product Image */}
                      {product.image_url ? (
                        <div className="w-full sm:w-44 h-44 sm:h-auto relative overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="w-full sm:w-36 h-32 sm:h-auto bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center flex-shrink-0 text-3xl text-slate-400">
                          🍔
                        </div>
                      )}

                      {/* Product Content */}
                      <div className="p-5 flex flex-col justify-between flex-grow space-y-4">
                        <div className="space-y-1.5">
                          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors duration-200">
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {product.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span 
                            className="font-black text-xl tracking-tight"
                            style={{ color: 'var(--primary-color)' }}
                          >
                            {formatCurrency(product.price)}
                          </span>

                          {/* Action Button / Cart Quantity Controller */}
                          {qtyInCart > 0 ? (
                            <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                              <button
                                onClick={() => updateQuantity(product.id, -1)}
                                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-rose-500 hover:text-white transition"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-black text-slate-900 dark:text-white px-1">
                                {qtyInCart}
                              </span>
                              <button
                                onClick={() => updateQuantity(product.id, 1)}
                                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-rose-500 hover:text-white transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(product)}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:scale-105 active:scale-95 transition duration-200"
                              style={{ backgroundColor: 'var(--primary-color)' }}
                            >
                              <span>Adicionar</span>
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* FLOATING CART BAR (WHEN CART HAS ITEMS) */}
      {cart.length > 0 && !orderSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900/95 border border-slate-800 p-4 rounded-3xl shadow-2xl backdrop-blur-xl flex items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg relative"
                style={{ backgroundColor: 'var(--primary-color)' }}
              >
                <ShoppingBag className="w-6 h-6" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-slate-950 font-black text-[10px] flex items-center justify-center shadow-md">
                  {totalItemsCount}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item na sacola' : 'itens na sacola'}
                </p>
                <h4 className="font-extrabold text-base text-emerald-400 font-mono">
                  {formatCurrency(subtotal)}
                </h4>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white shadow-lg hover:scale-105 active:scale-95 transition duration-200 whitespace-nowrap"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              <span>Ver Sacola</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl space-y-6 p-6 sm:p-8 relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                >
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Sua Sacola de Compras</h3>
                  <p className="text-xs text-slate-400">{tenant?.name || subdomain}</p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ERROR ALERT */}
            {formError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* CART ITEMS LIST */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Itens Selecionados</h4>
              <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-2">
                {cart.map(item => (
                  <div key={item.product.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-white truncate">{item.product.name}</h5>
                      <p className="text-xs text-slate-400 font-mono">
                        {item.quantity}x {formatCurrency(item.product.price)} = {formatCurrency(item.product.price * item.quantity)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:bg-rose-500 hover:text-white flex items-center justify-center transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:bg-rose-500 hover:text-white flex items-center justify-center transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ORDER TOTALS BREAKDOWN */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal dos itens</span>
                <span className="font-mono text-white">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Taxa de Entrega</span>
                <span className="font-mono text-white">{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-black text-white">
                <span>Total a Pagar</span>
                <span className="text-emerald-400 font-mono text-lg">{formatCurrency(totalOrder)}</span>
              </div>
            </div>

            {/* CHECKOUT FORM */}
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span>👤 Seus Dados de Contato</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Seu Nome *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: João da Silva"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp para Contato *</label>
                    <input
                      type="tel"
                      required
                      placeholder="(12) 99153-0244"
                      maxLength={15}
                      value={customerPhone}
                      onChange={e => setCustomerPhone(formatPhone(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* DELIVERY ADDRESS */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Endereço para Entrega</span>
                  </h4>

                  {/* OPTIONAL GEOLOCATION BUTTON */}
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-[11px] font-bold transition disabled:opacity-50"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                        <span>Buscando GPS...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" />
                        <span>📍 Usar minha localização atual</span>
                      </>
                    )}
                  </button>
                </div>

                {locationStatus && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      locationStatus.type === 'success'
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                    }`}
                  >
                    {locationStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    )}
                    <span>{locationStatus.message}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">Rua / Avenida *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Av. Brasil"
                      value={addressRua}
                      onChange={e => setAddressRua(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Número *</label>
                    <input
                      ref={numeroInputRef}
                      type="text"
                      required
                      placeholder="Ex: 1500"
                      value={addressNumero}
                      onChange={e => setAddressNumero(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-rose-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Bairro *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Centro"
                      value={addressBairro}
                      onChange={e => setAddressBairro(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Complemento / Apto</label>
                    <input
                      type="text"
                      placeholder="Ex: Apto 32 Bloco B"
                      value={addressComplemento}
                      onChange={e => setAddressComplemento(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* PAYMENT METHOD */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Forma de Pagamento na Entrega</span>
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix_entrega')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'pix_entrega'
                        ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-lg'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">PIX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cartao_entrega')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'cartao_entrega'
                        ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-lg'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold">Cartão</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('dinheiro_entrega')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'dinheiro_entrega'
                        ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-lg'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold">Dinheiro</span>
                  </button>
                </div>

                {paymentMethod === 'dinheiro_entrega' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Precisa de troco? Para quanto?
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Troco para R$ 100,00 (ou 'Não preciso')"
                      value={trocoPara}
                      onChange={e => setTrocoPara(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>
                )}
              </div>

              {/* ACTION BUTTON */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Continuar Escolhendo
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3.5 rounded-2xl text-sm font-extrabold text-white shadow-xl hover:scale-105 active:scale-95 transition duration-200 flex items-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando Pedido...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmar Pedido ({formatCurrency(totalOrder)})</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ORDER SUCCESS MODAL */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Pedido Enviado com Sucesso!
              </span>
              <h3 className="text-2xl font-black text-white">
                #{orderSuccess.id.substring(0, 6).toUpperCase()}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seu pedido foi recebido diretamente na cozinha de <strong>{tenant?.name || subdomain}</strong> e já está sendo preparado!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Total a pagar na entrega:</span>
                <span className="font-extrabold text-white text-sm font-mono">
                  {formatCurrency(orderSuccess.total)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Forma escolhida:</span>
                <span className="uppercase font-semibold text-slate-300">
                  {paymentMethod.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="space-y-2.5 pt-2">
              <a
                href={`/pedido/${orderSuccess.id}`}
                className="w-full py-3.5 rounded-2xl text-sm font-extrabold text-white shadow-xl hover:scale-[1.02] active:scale-[0.98] transition duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20"
              >
                <span>🚀 Acompanhar Pedido ao Vivo</span>
                <ChevronRight className="w-4 h-4" />
              </a>

              <button
                onClick={() => setOrderSuccess(null)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Voltar ao Cardápio
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
