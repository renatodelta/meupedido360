'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Store, 
  DollarSign, 
  Users, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Ban, 
  Key, 
  Search, 
  RefreshCw, 
  Phone, 
  Mail, 
  ExternalLink, 
  ChevronRight, 
  Lock, 
  Unlock, 
  TrendingUp, 
  X, 
  Check, 
  Loader2,
  Trash2
} from 'lucide-react';

interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  document: string | null;
  phone_whatsapp: string | null;
  logo_url: string | null;
  banner_url: string | null;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  plan_status: 'active' | 'suspended' | 'trial';
  created_at: string;
  owner?: Owner | null;
}

interface Metrics {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  mrr: number;
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    suspendedTenants: 0,
    mrr: 0,
  });
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'suspended'>('all');
  
  // Action Feedback
  const [updatingTenantId, setUpdatingTenantId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Reset Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedTenantForReset, setSelectedTenantForReset] = useState<Tenant | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Load Super Admin Data
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/superadmin/tenants');
      const data = await res.json();

      if (data.metrics) setMetrics(data.metrics);
      if (data.tenants) setTenants(data.tenants);
    } catch (err) {
      console.error('Erro ao carregar dados do SuperAdmin:', err);
      showFeedback('error', 'Falha ao carregar dados do sistema.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  // Change Subscription Plan Status (Activate, Suspend, Trial)
  const handleUpdateStatus = async (tenantId: string, newStatus: 'active' | 'suspended' | 'trial') => {
    setUpdatingTenantId(tenantId);
    try {
      const res = await fetch('/api/superadmin/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, plan_status: newStatus }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTenants(prev =>
          prev.map(t => (t.id === tenantId ? { ...t, plan_status: newStatus } : t))
        );
        
        // Recalculate MRR & Status counters
        loadData();

        const statusLabels = {
          active: 'ativada',
          suspended: 'bloqueada / suspensa',
          trial: 'alterada para Trial (7 Dias)',
        };

        showFeedback('success', `Assinatura da loja ${statusLabels[newStatus]} com sucesso!`);
      } else {
        showFeedback('error', data.error || 'Erro ao alterar status da loja.');
      }
    } catch (err) {
      showFeedback('error', 'Falha na conexão com o servidor.');
    } finally {
      setUpdatingTenantId(null);
    }
  };

  // Reset Merchant Password Action
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantForReset || !newPassword || newPassword.length < 6) {
      showFeedback('error', 'A nova senha deve conter no mínimo 6 caracteres.');
      return;
    }

    const userId = selectedTenantForReset.owner?.id || selectedTenantForReset.id;
    setIsResettingPassword(true);

    try {
      const res = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          user_id: userId,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showFeedback('success', `Senha do lojista (${selectedTenantForReset.name}) redefinida com sucesso!`);
        setIsPasswordModalOpen(false);
        setSelectedTenantForReset(null);
        setNewPassword('');
      } else {
        showFeedback('error', data.error || 'Erro ao redefinir senha.');
      }
    } catch (err) {
      showFeedback('error', 'Erro ao enviar requisição de redefinição de senha.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Delete Tenant Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTenantForDelete, setSelectedTenantForDelete] = useState<Tenant | null>(null);
  const [confirmSlugInput, setConfirmSlugInput] = useState('');
  const [isDeletingTenant, setIsDeletingTenant] = useState(false);

  // Delete Store Handler
  const handleDeleteTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantForDelete) return;

    if (confirmSlugInput.trim().toLowerCase() !== selectedTenantForDelete.slug.toLowerCase()) {
      showFeedback('error', `Para confirmar, você precisa digitar exatamente o subdomínio: "${selectedTenantForDelete.slug}"`);
      return;
    }

    setIsDeletingTenant(true);

    try {
      const res = await fetch(`/api/superadmin/tenants?tenant_id=${selectedTenantForDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showFeedback('success', `Estabelecimento "${selectedTenantForDelete.name}" excluído com sucesso!`);
        setIsDeleteModalOpen(false);
        setSelectedTenantForDelete(null);
        setConfirmSlugInput('');
        loadData();
      } else {
        showFeedback('error', data.error || 'Erro ao excluir estabelecimento.');
      }
    } catch (err) {
      showFeedback('error', 'Falha na conexão com o servidor ao excluir loja.');
    } finally {
      setIsDeletingTenant(false);
    }
  };

  // Filter Tenants
  const filteredTenants = tenants.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.owner?.name && t.owner.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.owner?.email && t.owner.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || t.plan_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/I';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans space-y-8">
      
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                MeuPedido<span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">360</span> SuperAdmin
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Painel dos Fundadores
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestão executiva de assinaturas, MRR, estabelecimentos e controle de licenças
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* FEEDBACK ALERT MESSAGE */}
      {feedbackMsg && (
        <div className={`max-w-7xl mx-auto p-4 rounded-2xl border flex items-center justify-between text-sm ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SAAS EXECUTIVE FINANCIAL & SUBSCRIPTION KPIS */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* MRR */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-2 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>MRR (Receita Recorrente)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent tracking-tight">
            {formatCurrency(metrics.mrr)}
          </div>
          <p className="text-[11px] text-slate-500">Previsão mensal baseada nos R$ 59,90/mês</p>
        </div>

        {/* LOJAS ATIVAS */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-2 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Lojas Ativas (Pagas)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {metrics.activeTenants}
          </div>
          <p className="text-[11px] text-emerald-400 font-medium">Cardápios ativos e gerando receita</p>
        </div>

        {/* LOJAS EM TRIAL */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-2 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Em Período Trial</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-400 tracking-tight">
            {metrics.trialTenants}
          </div>
          <p className="text-[11px] text-slate-500">Nos 7 dias de teste grátis</p>
        </div>

        {/* LOJAS SUSPENSAS */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-2 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Lojas Suspensas</span>
            <Ban className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
            {metrics.suspendedTenants}
          </div>
          <p className="text-[11px] text-slate-500">Bloqueadas por inatividade/pagamento</p>
        </div>

        {/* TOTAL DE LOJAS */}
        <div className="col-span-2 lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-2 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Total Cadastrados</span>
            <Store className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {metrics.totalTenants}
          </div>
          <p className="text-[11px] text-slate-500">Base geral de estabelecimentos</p>
        </div>

      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-4 backdrop-blur-xl">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por loja, subdomínio ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === 'all' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              Todas ({tenants.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              Ativas ({metrics.activeTenants})
            </button>
            <button
              onClick={() => setStatusFilter('trial')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === 'trial' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              Trial ({metrics.trialTenants})
            </button>
            <button
              onClick={() => setStatusFilter('suspended')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === 'suspended' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              Suspensas ({metrics.suspendedTenants})
            </button>
          </div>

        </div>

        {/* TENANTS MANAGEMENT TABLE */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 select-none">
                  <th className="py-4 px-6">Estabelecimento / Loja</th>
                  <th className="py-4 px-6">Proprietário (Lojista)</th>
                  <th className="py-4 px-6">Status da Assinatura</th>
                  <th className="py-4 px-6">Registro</th>
                  <th className="py-4 px-6 text-right">Controles & Ações Master</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                      Nenhum estabelecimento encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map(t => (
                    <tr key={t.id} className="hover:bg-slate-850/50 transition duration-150">
                      
                      {/* Store Details */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {t.logo_url ? (
                            <img src={t.logo_url} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow-sm" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-black text-sm flex items-center justify-center">
                              {t.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-extrabold text-white text-sm flex items-center gap-1.5">
                              <span>{t.name}</span>
                              <a
                                href={`http://${t.slug}.localhost:3000`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-500 hover:text-rose-400 transition"
                                title="Abrir cardápio público"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                            <span className="font-mono text-xs text-slate-400">{t.slug}.meupedido360.com</span>
                          </div>
                        </div>
                      </td>

                      {/* Owner Info */}
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-200">{t.owner?.name || 'Não vinculado'}</p>
                          <p className="text-slate-400 text-[11px] flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{t.owner?.email || 'Sem e-mail'}</span>
                          </p>
                          {(t.phone_whatsapp || t.owner?.phone) && (
                            <p className="text-slate-400 text-[11px] flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{t.phone_whatsapp || t.owner?.phone}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Subscription Status Badge */}
                      <td className="py-4 px-6">
                        {t.plan_status === 'active' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Ativa (Mensal Pro)
                          </span>
                        )}
                        {t.plan_status === 'trial' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Clock className="w-3 h-3" />
                            Em Trial (7 Dias)
                          </span>
                        )}
                        {t.plan_status === 'suspended' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <Ban className="w-3 h-3" />
                            Suspensa / Inativa
                          </span>
                        )}
                      </td>

                      {/* Registration Date */}
                      <td className="py-4 px-6 text-slate-400 text-xs font-mono">
                        {formatDate(t.created_at)}
                      </td>

                      {/* Action Controls */}
                      <td className="py-4 px-6 text-right space-x-2">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* Activate Button */}
                          {t.plan_status !== 'active' && (
                            <button
                              onClick={() => handleUpdateStatus(t.id, 'active')}
                              disabled={updatingTenantId === t.id}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30 font-bold text-xs transition shadow-sm flex items-center gap-1"
                              title="Liberar / Ativar Assinatura"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Ativar</span>
                            </button>
                          )}

                          {/* Suspend/Block Button */}
                          {t.plan_status !== 'suspended' && (
                            <button
                              onClick={() => handleUpdateStatus(t.id, 'suspended')}
                              disabled={updatingTenantId === t.id}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 font-bold text-xs transition shadow-sm flex items-center gap-1"
                              title="Bloquear / Suspender Loja"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Bloquear</span>
                            </button>
                          )}

                          {/* Reset Password Modal Trigger */}
                          <button
                            onClick={() => {
                              setSelectedTenantForReset(t);
                              setIsPasswordModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs transition flex items-center gap-1"
                            title="Redefinir Senha do Lojista"
                          >
                            <Key className="w-3.5 h-3.5 text-amber-400" />
                            <span>Senha</span>
                          </button>

                          {/* Delete Store Trigger Button */}
                          <button
                            onClick={() => {
                              setSelectedTenantForDelete(t);
                              setConfirmSlugInput('');
                              setIsDeleteModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-800/60 font-semibold text-xs transition flex items-center gap-1"
                            title="Excluir Estabelecimento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir</span>
                          </button>

                          {/* WhatsApp Chat Direct Link */}
                          {(t.phone_whatsapp || t.owner?.phone) && (
                            <a
                              href={`https://wa.me/55${(t.phone_whatsapp || t.owner?.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                                `Olá ${t.owner?.name || t.name}, referente à sua conta na plataforma MeuPedido360:`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 transition"
                              title="Conversar no WhatsApp"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}

                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL: RESET MERCHANT PASSWORD */}
      {isPasswordModalOpen && selectedTenantForReset && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            
            <button
              onClick={() => {
                setIsPasswordModalOpen(false);
                setSelectedTenantForReset(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Redefinir Senha do Lojista</h3>
                <p className="text-xs text-slate-400">{selectedTenantForReset.name} ({selectedTenantForReset.slug})</p>
              </div>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-2">
              <div className="space-y-1 text-xs">
                <span className="text-slate-400">Usuário:</span>
                <p className="font-semibold text-slate-200">{selectedTenantForReset.owner?.email || 'E-mail do Lojista'}</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Nova Senha (Mínimo 6 caracteres) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Digite a nova senha..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setSelectedTenantForReset(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isResettingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  <span>Salvar Nova Senha</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: DELETE TENANT CONFIRMATION */}
      {isDeleteModalOpen && selectedTenantForDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/50 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedTenantForDelete(null);
                setConfirmSlugInput('');
              }}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Excluir Estabelecimento</h3>
                <p className="text-xs text-rose-400 font-semibold">{selectedTenantForDelete.name}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                Ação Irreversível!
              </p>
              <p className="text-rose-200/80">
                Isso excluirá permanentemente a loja <span className="font-bold text-white font-mono">{selectedTenantForDelete.slug}</span>, todos os seus produtos, categorias, histórico de pedidos e a conta do lojista.
              </p>
            </div>

            <form onSubmit={handleDeleteTenantSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Digite <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">{selectedTenantForDelete.slug}</span> para confirmar:
                </label>
                <input
                  type="text"
                  required
                  placeholder={`Digite ${selectedTenantForDelete.slug}`}
                  value={confirmSlugInput}
                  onChange={(e) => setConfirmSlugInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-xs focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedTenantForDelete(null);
                    setConfirmSlugInput('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDeletingTenant || confirmSlugInput.trim().toLowerCase() !== selectedTenantForDelete.slug.toLowerCase()}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isDeletingTenant ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Excluir Definitivamente</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
