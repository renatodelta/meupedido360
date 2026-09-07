'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  Bike, 
  Plus, 
  Phone, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Trash2, 
  MessageSquare, 
  FileText, 
  UserCheck, 
  RefreshCw,
  X,
  AlertCircle
} from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: 'available' | 'busy' | 'offline';
  created_at: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  delivery_fee: number;
  payment_method: string;
  payment_status: string;
  status: string;
  driver_id: string | null;
  created_at: string;
  drivers?: Driver | null;
}

export default function AdminDriversPage() {
  const params = useParams();
  const subdomain = (params?.subdomain as string) || 'padaria';

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Driver Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Settlement Modal State
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('all');

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load Drivers
      const resDrivers = await fetch(`/api/tenant/drivers?slug=${subdomain}`);
      const driversData = await resDrivers.json();
      if (driversData.drivers) setDrivers(driversData.drivers);

      // Load Orders for statistics
      const resOrders = await fetch(`/api/tenant/orders?slug=${subdomain}`);
      const ordersData = await resOrders.json();
      if (ordersData.orders) setOrders(ordersData.orders);

    } catch (err) {
      console.error('Erro ao carregar dados dos entregadores:', err);
      showFeedback('error', 'Falha ao carregar entregadores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subdomain]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName.trim() || !newDriverPhone.trim()) {
      showFeedback('error', 'Preencha o nome e o telefone do entregador.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/tenant/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: subdomain,
          name: newDriverName,
          phone: newDriverPhone,
          status: 'available',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', 'Entregador cadastrado com sucesso!');
        setNewDriverName('');
        setNewDriverPhone('');
        setShowAddModal(false);
        loadData();
      } else {
        showFeedback('error', data.error || 'Erro ao cadastrar entregador.');
      }
    } catch (err) {
      showFeedback('error', 'Erro ao conectar com o servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (driverId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'available' ? 'busy' : currentStatus === 'busy' ? 'offline' : 'available';
    try {
      const res = await fetch('/api/tenant/drivers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: driverId, status: nextStatus }),
      });
      if (res.ok) {
        setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: nextStatus } : d));
        showFeedback('success', 'Status do entregador atualizado!');
      }
    } catch (err) {
      showFeedback('error', 'Erro ao atualizar status.');
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm('Deseja realmente remover este entregador?')) return;
    try {
      const res = await fetch(`/api/tenant/drivers?id=${driverId}`, { method: 'DELETE' });
      if (res.ok) {
        setDrivers(prev => prev.filter(d => d.id !== driverId));
        showFeedback('success', 'Entregador removido.');
      }
    } catch (err) {
      showFeedback('error', 'Erro ao remover entregador.');
    }
  };

  // Calculate shift stats
  const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'in_route');
  
  const filteredSettlementOrders = selectedDriverId === 'all' 
    ? completedOrders 
    : completedOrders.filter(o => o.driver_id === selectedDriverId);

  const totalDeliveryFees = filteredSettlementOrders.reduce((sum, o) => sum + (Number(o.delivery_fee) || 0), 0);
  const totalMoneyCollected = filteredSettlementOrders
    .filter(o => o.payment_method === 'money' || o.payment_method === 'dinheiro')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const activeDriver = drivers.find(d => d.id === selectedDriverId);

  const handleSendWhatsAppSettlement = () => {
    if (!activeDriver) return;
    const phoneClean = activeDriver.phone.replace(/\D/g, '');

    const msg = `🛵 *FECHAMENTO DE CAIXA - MOTOBOY* 🛵\n` +
      `👤 *Entregador:* ${activeDriver.name}\n` +
      `📅 *Data:* ${new Date().toLocaleDateString('pt-BR')}\n` +
      `----------------------------------------\n` +
      `📦 *Total de Entregas:* ${filteredSettlementOrders.length}\n` +
      `💰 *Taxas de Entrega a Receber:* R$ ${totalDeliveryFees.toFixed(2).replace('.', ',')}\n` +
      `💵 *Dinheiro Coletado a Devolver:* R$ ${totalMoneyCollected.toFixed(2).replace('.', ',')}\n` +
      `----------------------------------------\n` +
      `*MeuPedido360* - Gestão de Delivery`;

    window.open(`https://wa.me/55${phoneClean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-8 selection:bg-rose-500 selection:text-white">
      
      {/* FEEDBACK TOAST */}
      {feedback && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-md border flex items-center gap-3 transition-all ${
          feedback.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span className="text-sm font-semibold">{feedback.text}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                <Bike className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Gestão de Entregadores</h1>
            </div>
            <p className="text-slate-400 text-sm">Cadastre seus motoboys, despache pedidos e faça o acerto de caixa diário em 1 clique.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettlementModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold transition"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              Acerto de Caixa
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-sm font-semibold shadow-lg shadow-rose-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              Novo Entregador
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total de Motoboys</span>
              <Bike className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-black text-white">{drivers.length}</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Disponíveis Agora</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400">
              {drivers.filter(d => d.status === 'available').length}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Entregas no Turno</span>
              <CheckCircle className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-black text-white">{completedOrders.length}</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Taxas de Entrega</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-400">
              R$ {completedOrders.reduce((acc, o) => acc + (Number(o.delivery_fee) || 0), 0).toFixed(2).replace('.', ',')}
            </div>
          </div>
        </div>

        {/* DRIVERS LIST */}
        <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md overflow-hidden">
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bike className="w-5 h-5 text-rose-500" />
              Equipe de Entregadores Cadastrados
            </h2>
            <button onClick={loadData} className="p-2 text-slate-400 hover:text-white transition">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-rose-500 mb-3" />
              Carregando entregadores...
            </div>
          ) : drivers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Bike className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-400 font-medium">Nenhum entregador cadastrado ainda.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition"
              >
                Cadastrar Primeiro Motoboy
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {drivers.map(driver => {
                const driverOrdersCount = completedOrders.filter(o => o.driver_id === driver.id).length;
                return (
                  <div key={driver.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/20 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 font-bold">
                        {driver.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-bold text-white">{driver.name}</h3>
                          <button
                            onClick={() => handleToggleStatus(driver.id, driver.status)}
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border transition ${
                              driver.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' :
                              driver.status === 'busy' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' :
                              'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {driver.status === 'available' ? '🟢 Disponível' : driver.status === 'busy' ? '🟡 Em Rota' : '⚪ Off-line'}
                          </button>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {driver.phone}</span>
                          <span>•</span>
                          <span>{driverOrdersCount} entregas registradas</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <a
                        href={`https://wa.me/55${driver.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-semibold transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                      <button
                        onClick={() => handleDeleteDriver(driver.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Remover entregador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: NOVO ENTREGADOR */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Bike className="w-5 h-5 text-rose-500" />
                Cadastrar Entregador
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Nome do Entregador
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Silva"
                  value={newDriverName}
                  onChange={e => setNewDriverName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="Ex: (11) 99999-8888"
                  value={newDriverPhone}
                  onChange={e => setNewDriverPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl hover:from-rose-600 hover:to-pink-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar Entregador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ACERTO DE CAIXA */}
      {showSettlementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Fechamento de Caixa por Entregador
                </h3>
                <p className="text-xs text-slate-400 mt-1">Calcule taxas e valores a acertar no fim do turno.</p>
              </div>
              <button onClick={() => setShowSettlementModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SELETOR DE ENTREGADOR */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Selecionar Entregador
              </label>
              <select
                value={selectedDriverId}
                onChange={e => setSelectedDriverId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="all">Todos os Entregadores ({completedOrders.length} entregas)</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
                ))}
              </select>
            </div>

            {/* CARDS RESUMO DO FECHAMENTO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-semibold">Total de Entregas</span>
                <div className="text-2xl font-extrabold text-white">{filteredSettlementOrders.length}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-semibold">Taxas a Pagar ao Motoboy</span>
                <div className="text-2xl font-extrabold text-emerald-400">
                  R$ {totalDeliveryFees.toFixed(2).replace('.', ',')}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-semibold">Dinheiro Coletado a Devolver</span>
                <div className="text-2xl font-extrabold text-amber-400">
                  R$ {totalMoneyCollected.toFixed(2).replace('.', ',')}
                </div>
              </div>
            </div>

            {/* LISTA DE PEDIDOS */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pedidos no Fechamento</h4>
              <div className="max-h-56 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800/60 bg-slate-950/50">
                {filteredSettlementOrders.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">Nenhuma entrega registrada para este filtro.</div>
                ) : (
                  filteredSettlementOrders.map((o, idx) => (
                    <div key={o.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">#{o.id.substring(0, 6)}</span> - {o.customer_name}
                        <div className="text-slate-500">{new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • Pgto: {o.payment_method.toUpperCase()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">R$ {Number(o.total).toFixed(2).replace('.', ',')}</div>
                        <div className="text-emerald-400">Taxa: R$ {Number(o.delivery_fee).toFixed(2).replace('.', ',')}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSettlementModal(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Fechar
              </button>

              {activeDriver && (
                <button
                  onClick={handleSendWhatsAppSettlement}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  Enviar Acerto via WhatsApp ({activeDriver.name})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
