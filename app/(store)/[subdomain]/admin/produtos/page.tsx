'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Plus, 
  UtensilsCrossed, 
  Layers, 
  Edit3, 
  Trash2, 
  Eye, 
  Check, 
  X, 
  Loader2, 
  Image as ImageIcon, 
  ArrowLeft, 
  Paintbrush, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  AlertCircle
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  order_index: number;
  is_active: boolean;
}

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
}

export default function AdminProductsPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;

  const [tenant, setTenant] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: '',
    description: '',
    price: '',
    image_url: '',
    is_available: true,
  });

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Action states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [tenantId, setTenantId] = useState<string | null>(null);

  // 1. Initial Load: Fetch Tenant, Categories and Products
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch categories and products in parallel
        const [catRes, prodRes] = await Promise.all([
          fetch(`/api/tenant/categories?slug=${encodeURIComponent(subdomain)}`),
          fetch(`/api/tenant/products?slug=${encodeURIComponent(subdomain)}`),
        ]);

        const catData = await catRes.json();
        const prodData = await prodRes.json();

        if (catData.tenant_id) setTenantId(catData.tenant_id);
        if (catData.categories) setCategories(catData.categories);
        if (prodData.products) setProducts(prodData.products);

        // Set default selected category for the product form
        if (catData.categories && catData.categories.length > 0) {
          setProductForm(prev => ({ ...prev, category_id: catData.categories[0].id }));
        }

      } catch (err: any) {
        console.error('Erro ao carregar cardápio:', err);
        showFeedback('error', 'Falha ao carregar itens do cardápio.');
      } finally {
        setLoading(false);
      }
    }

    if (subdomain) {
      loadData();
    }
  }, [subdomain]);

  // Temporary Toast Feedback
  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Open Product Modal
  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        category_id: product.category_id,
        description: product.description || '',
        price: product.price.toString(),
        image_url: product.image_url || '',
        is_available: product.is_available,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        category_id: categories.length > 0 ? categories[0].id : '',
        description: '',
        price: '',
        image_url: '',
        is_available: true,
      });
    }
    setIsProductModalOpen(true);
  };

  // Handle Save Product (Create or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.category_id) {
      showFeedback('error', 'Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        // Edit Product
        const res = await fetch('/api/tenant/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingProduct.id,
            tenant_id: tenantId,
            slug: subdomain,
            name: productForm.name,
            category_id: productForm.category_id,
            description: productForm.description,
            price: productForm.price,
            image_url: productForm.image_url,
            is_available: productForm.is_available,
          }),
        });
        const data = await res.json();
        if (res.ok && data.product) {
          setProducts(prev => prev.map(p => p.id === data.product.id ? data.product : p));
          showFeedback('success', 'Produto atualizado com sucesso!');
          setIsProductModalOpen(false);
        } else {
          showFeedback('error', data.error || 'Erro ao atualizar produto.');
        }
      } else {
        // Create Product
        const res = await fetch('/api/tenant/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenantId,
            slug: subdomain,
            category_id: productForm.category_id,
            name: productForm.name,
            description: productForm.description,
            price: productForm.price,
            image_url: productForm.image_url,
            is_available: productForm.is_available,
          }),
        });
        const data = await res.json();
        if (res.ok && data.product) {
          setProducts(prev => [data.product, ...prev]);
          showFeedback('success', 'Produto adicionado com sucesso!');
          setIsProductModalOpen(false);
        } else {
          showFeedback('error', data.error || 'Erro ao adicionar produto.');
        }
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Erro ao salvar produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Availability (Liga / Desliga)
  const handleToggleAvailability = async (product: Product) => {
    setTogglingProductId(product.id);
    const newStatus = !product.is_available;
    try {
      const res = await fetch('/api/tenant/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          tenant_id: tenantId,
          slug: subdomain,
          is_available: newStatus,
        }),
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_available: newStatus } : p));
        showFeedback('success', `Item "${product.name}" marcado como ${newStatus ? 'Disponível' : 'Esgotado'}`);
      }
    } catch (err) {
      showFeedback('error', 'Erro ao atualizar disponibilidade.');
    } finally {
      setTogglingProductId(null);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Tem certeza que deseja excluir "${product.name}"?`)) return;

    try {
      const res = await fetch(`/api/tenant/products?id=${product.id}&slug=${encodeURIComponent(subdomain)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== product.id));
        showFeedback('success', 'Produto excluído com sucesso.');
      }
    } catch (err) {
      showFeedback('error', 'Erro ao excluir produto.');
    }
  };

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tenant/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          slug: subdomain,
          name: newCategoryName.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.category) {
        setCategories(prev => [...prev, data.category]);
        showFeedback('success', `Seção "${data.category.name}" criada com sucesso!`);
        setNewCategoryName('');
        setIsCategoryModalOpen(false);
      } else {
        showFeedback('error', data.error || 'Erro ao criar seção.');
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Erro ao criar seção.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products by selected category
  const filteredProducts = selectedCategoryId === 'all'
    ? products
    : products.filter(p => p.category_id === selectedCategoryId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 selection:bg-rose-500 selection:text-white">
      
      {/* Top Admin Notification / Breadcrumbs */}
      <div className="border-b border-slate-900 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a 
              href={`http://${subdomain}.localhost:3000/`}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à Loja</span>
            </a>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-400 capitalize">{subdomain}</span>
              <span className="text-slate-600">/</span>
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <UtensilsCrossed className="w-4 h-4 text-rose-500" />
                Gestão do Cardápio
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`http://${subdomain}.localhost:3000/admin/onboarding`}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition"
            >
              <Paintbrush className="w-3.5 h-3.5 text-rose-400" />
              <span>Visual da Loja</span>
            </a>
            <a
              href={`http://${subdomain}.localhost:3000/`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-rose-500/20"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver Cardápio ao Vivo</span>
            </a>
          </div>
        </div>
      </div>

      {/* Floating Feedback Toast */}
      {feedbackMsg && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold animate-in fade-in slide-in-from-bottom-4 duration-300 border ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800/80'
            : 'bg-rose-950/90 text-rose-300 border-rose-800/80'
        }`}>
          {feedbackMsg.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Header Title & Quick Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Produtos & Seções</h1>
            <p className="text-slate-400 text-sm mt-1">
              Adicione itens ao cardápio, organize por categorias e defina preços e disponibilidade.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 transition"
            >
              <Layers className="w-4 h-4 text-rose-400" />
              <span>+ Nova Seção</span>
            </button>
            <button
              onClick={() => handleOpenProductModal()}
              disabled={categories.length === 0}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-rose-500/20 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>+ Novo Produto</span>
            </button>
          </div>
        </div>

        {/* Categories Bar / Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-900">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              selectedCategoryId === 'all'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            Todos os Itens ({products.length})
          </button>
          
          {categories.map(cat => {
            const count = products.filter(p => p.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-2 ${
                  selectedCategoryId === cat.id
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white border border-slate-800'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 font-mono">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 space-y-4 text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
            <p className="text-sm">Carregando catálogo do cardápio...</p>
          </div>
        ) : categories.length === 0 ? (
          /* Empty Categories Callout */
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <Layers className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Nenhuma seção criada ainda</h2>
            <p className="text-slate-400 text-sm">
              Crie a primeira seção do seu cardápio (ex: Burgers, Bebidas, Pizzas) para começar a cadastrar seus produtos.
            </p>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-bold shadow-lg shadow-rose-500/20 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Primeira Seção</span>
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty Products Callout */
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <UtensilsCrossed className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Nenhum produto nesta seção</h2>
            <p className="text-slate-400 text-sm">
              Cadastre itens com fotos, descrições irresistíveis e preços para atrair seus clientes.
            </p>
            <button
              onClick={() => handleOpenProductModal()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-bold shadow-lg shadow-rose-500/20 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Produto</span>
            </button>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => {
              const categoryName = categories.find(c => c.id === product.category_id)?.name || 'Geral';
              const isAvailable = product.is_available;

              return (
                <div 
                  key={product.id}
                  className={`rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                    isAvailable 
                      ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700/80 shadow-xl' 
                      : 'bg-slate-950/80 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="p-5 space-y-4">
                    {/* Image & Category Pill */}
                    <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 flex items-center justify-center group">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="flex flex-col items-center text-slate-600 gap-2">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-xs">Sem foto</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-rose-300 border border-slate-800">
                        {categoryName}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-bold text-white leading-snug line-clamp-1">
                          {product.name}
                        </h3>
                        <div className="text-base font-black text-rose-400 whitespace-nowrap">
                          {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                        {product.description || 'Sem descrição cadastrada.'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="px-5 py-3.5 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                    
                    {/* Availability Switch */}
                    <button
                      onClick={() => handleToggleAvailability(product)}
                      disabled={togglingProductId === product.id}
                      className="flex items-center gap-2 text-xs font-semibold group cursor-pointer"
                    >
                      {togglingProductId === product.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      ) : isAvailable ? (
                        <ToggleRight className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-600" />
                      )}
                      <span className={isAvailable ? 'text-emerald-400' : 'text-slate-500'}>
                        {isAvailable ? 'Disponível' : 'Esgotado'}
                      </span>
                    </button>

                    {/* Edit & Delete Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenProductModal(product)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
                        title="Editar produto"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition"
                        title="Excluir produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* MODAL: CREATE / EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-rose-500" />
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome do Item *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Smash Bacon Burger"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Seção / Categoria *
                </label>
                <select
                  required
                  value={productForm.category_id}
                  onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Preço de Venda (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ex: 29.90"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Descrição dos Ingredientes / Detalhes
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Pão brioche selado, 2 carnes smash de 80g, cheddar cremoso..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  URL da Foto do Produto
                </label>
                <input
                  type="url"
                  placeholder="https://exemplo.com/foto-do-burger.jpg"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Cole um link direto da imagem (Unsplash, Imgur, CDN, etc).</p>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-sm font-bold shadow-lg shadow-rose-500/25 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CATEGORY / SECTION */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-500" />
                Nova Seção do Cardápio
              </h2>
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome da Seção *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 🍔 Smash Burgers, 🥤 Bebidas..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-sm font-bold shadow-lg shadow-rose-500/25 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Criar Seção</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
