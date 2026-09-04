import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShoppingBag, ChevronRight, Compass, ArrowRight, Heart } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface StorePageProps {
  params: {
    subdomain: string;
  };
}

export const dynamic = 'force-dynamic';

// Interface for database categories and products
interface Category {
  id: string;
  name: string;
  order_index: number;
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

// Fallback seed data if database is empty
const MOCKUP_CATEGORIES = [
  { id: 'cat-burgers', name: '🔥 Mais Vendidos', order_index: 0 },
  { id: 'cat-artesanais', name: '🍔 Burgers Artesanais', order_index: 1 },
  { id: 'cat-acompanhamentos', name: '🍟 Acompanhamentos', order_index: 2 },
  { id: 'cat-bebidas', name: '🥤 Bebidas Geladas', order_index: 3 },
];

const MOCKUP_PRODUCTS = [
  {
    id: 'prod-1',
    category_id: 'cat-burgers',
    name: 'MeuPedido Smash Bacon',
    description: 'Dois smash burgers de 80g, muito queijo cheddar derretido, fatias de bacon crocante e maionese artesanal da casa no pão brioche selado na manteiga.',
    price: 32.90,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    is_available: true,
  },
  {
    id: 'prod-2',
    category_id: 'cat-burgers',
    name: 'Monster Cheddar Duplo',
    description: 'Dois blends de 150g grelhados no fogo, creme de queijo cheddar injetado e cebola caramelizada artesanal.',
    price: 39.90,
    image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
    is_available: true,
  },
  {
    id: 'prod-3',
    category_id: 'cat-artesanais',
    name: 'Classic Burger',
    description: 'Blend bovino de 150g, queijo prato macio, alface americana fresca, rodelas de tomate e molho especial no pão com gergelim.',
    price: 26.90,
    image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
    is_available: true,
  },
  {
    id: 'prod-4',
    category_id: 'cat-acompanhamentos',
    name: 'Batata Rústica da Casa',
    description: 'Porção de batatas fritas rústicas salpicadas com páprica defumada, alecrim fresco e servidas com nossa maionese de alho.',
    price: 18.00,
    image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
    is_available: true,
  },
  {
    id: 'prod-5',
    category_id: 'cat-bebidas',
    name: 'Milkshake de Ninho com Nutella',
    description: 'Milkshake cremoso batido com leite ninho integral e calda abundante de Nutella genuína de 400ml.',
    price: 21.90,
    image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
    is_available: true,
  },
];

export default async function StorePage({ params }: StorePageProps) {
  const { subdomain } = params;

  // 1. Fetch tenant ID
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('slug', subdomain)
    .single();

  let categories: Category[] = [];
  let products: Product[] = [];

  // 2. Fetch categories and products if tenant is registered in DB
  if (tenant) {
    const { data: dbCategories } = await supabase
      .from('categories')
      .select('id, name, order_index')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    const { data: dbProducts } = await supabase
      .from('products')
      .select('id, category_id, name, description, price, image_url, is_available')
      .eq('tenant_id', tenant.id)
      .eq('is_available', true);

    if (dbCategories && dbCategories.length > 0) {
      categories = dbCategories;
    }
    if (dbProducts && dbProducts.length > 0) {
      products = dbProducts;
    }
  }

  // 3. Determine if using real DB records or mockup demonstration
  const hasDbContent = categories.length > 0 && products.length > 0;
  const displayCategories = categories.length > 0 ? categories : MOCKUP_CATEGORIES;
  const displayProducts = products.length > 0 ? products : MOCKUP_PRODUCTS;

  return (
    <div className="space-y-8">
      
      {/* DEMO NOTICE BANNER (shown only when viewing default mockup items) */}
      {!hasDbContent && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300 shadow-xl">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">💡</span>
            <span>
              <strong>Modo de Demonstração:</strong> Estes itens são modelos de exemplo. Cadastre seus próprios lanches, bebidas e preços reais.
            </span>
          </div>
          <a
            href={`http://${subdomain}.localhost:3000/admin/produtos`}
            className="whitespace-nowrap px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold hover:scale-105 transition duration-200 shadow-md shadow-rose-500/20"
          >
            🍽️ Cadastrar Meus Produtos
          </a>
        </div>
      )}

      {/* WELCOME BANNER & CATEGORY SLIDER */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-8 sm:p-12 shadow-2xl flex flex-col justify-end min-h-[220px]">
        {/* Soft layout background overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-slate-950/20 z-0" />
        
        <div className="relative z-20 max-w-xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-white border border-white/10">
            <Compass className="w-3.5 h-3.5" />
            Cardápio Interativo
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Faça seu pedido online, direto pelo WhatsApp!
          </h1>
          <p className="text-slate-300 text-sm sm:text-base font-light">
            Selecione seus itens favoritos abaixo, monte seu carrinho e envie o pedido diretamente para nossa equipe de atendimento.
          </p>
        </div>
      </div>

      {/* STICKY CATEGORIES HEADER BAR */}
      <div className="sticky top-16 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-4 border-b border-slate-200/50 dark:border-slate-800/50 -mx-4 px-4 sm:-mx-8 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">
          {displayCategories.map((category) => (
            <a
              key={category.id}
              href={`#${category.id}`}
              className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors duration-200"
            >
              {category.name}
            </a>
          ))}
        </div>
      </div>

      {/* CATALOG GRID */}
      {displayProducts.length === 0 ? (
        <div className="text-center py-16 px-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto text-2xl font-bold">
            🍽️
          </div>
          <h3 className="text-xl font-bold text-white">Nenhum produto cadastrado ainda</h3>
          <p className="text-slate-400 text-sm">
            Este restaurante ainda não adicionou itens ao cardápio. Acesse o painel de produtos para começar a cadastrar.
          </p>
          <a
            href={`http://${subdomain}.localhost:3000/admin/produtos`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm shadow-lg shadow-rose-500/25"
          >
            Cadastrar Meus Produtos Agora
          </a>
        </div>
      ) : (
        <div className="space-y-12">
          {displayCategories.map((category) => {
            const categoryProducts = displayProducts.filter((p) => p.category_id === category.id);
            
            if (categoryProducts.length === 0) return null;

            return (
              <section key={category.id} id={category.id} className="scroll-mt-36 space-y-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {category.name}
                  </h2>
                  <div className="h-0.5 flex-1 bg-slate-100 dark:bg-slate-800" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {categoryProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden flex flex-col sm:flex-row hover:shadow-lg transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      {/* Product Image */}
                      {product.image_url && (
                        <div className="w-full sm:w-44 h-44 sm:h-auto relative overflow-hidden bg-slate-100 flex-shrink-0">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}

                      {/* Product Details */}
                      <div className="p-5 flex flex-col justify-between flex-grow space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary transition-colors duration-200">
                              {product.name}
                            </h3>
                            <button className="text-slate-400 hover:text-rose-500 transition duration-150 flex-shrink-0">
                              <Heart className="w-5 h-5" />
                            </button>
                          </div>
                          {product.description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {product.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span 
                            className="font-extrabold text-xl"
                            style={{ color: 'var(--primary-color)' }}
                          >
                            {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>

                          <button 
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md hover:scale-105 active:scale-95 transition duration-200"
                            style={{ backgroundColor: 'var(--primary-color)' }}
                          >
                            Adicionar
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* FLOATING CART BAR PREVIEW */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50">
        <div className="glass rounded-2xl p-4 shadow-2xl flex items-center justify-between border border-white/20">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-lg"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Carrinho</p>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">0 itens adicionados</h4>
            </div>
          </div>

          <button 
            disabled
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-slate-300 dark:bg-slate-800 cursor-not-allowed transition duration-300"
          >
            Ver Sacola
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
