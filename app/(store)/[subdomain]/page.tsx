import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';
import StoreMenuClient, { Category, Product } from './StoreMenuClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  global: {
    fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }),
  },
});

interface StorePageProps {
  params: {
    subdomain: string;
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Fallback seed data if database is empty
const MOCKUP_CATEGORIES: Category[] = [
  { id: 'cat-burgers', name: '🔥 Mais Vendidos', order_index: 0 },
  { id: 'cat-artesanais', name: '🍔 Burgers Artesanais', order_index: 1 },
  { id: 'cat-acompanhamentos', name: '🍟 Acompanhamentos', order_index: 2 },
  { id: 'cat-bebidas', name: '🥤 Bebidas Geladas', order_index: 3 },
];

const MOCKUP_PRODUCTS: Product[] = [
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
    name: 'Truffled Brie Burger',
    description: 'Blend de costela 180g, queijo brie maçaricado, cogumelos salteados no azeite trufado e rúcula fresca.',
    price: 44.90,
    image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
    is_available: true,
  },
  {
    id: 'prod-4',
    category_id: 'cat-acompanhamentos',
    name: 'Batata Rústica com Alecrim',
    description: 'Batatas com corte especial artesanal, sal grosso, alecrim fresco e páprica defumada.',
    price: 18.90,
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
  noStore();
  const { subdomain } = params;

  // 1. Fetch tenant ID
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, phone_whatsapp')
    .eq('slug', subdomain)
    .single();

  let categories: Category[] = [];
  let products: Product[] = [];

  // 2. Fetch categories and products if tenant is registered in DB
  if (tenant) {
    const [catQuery, prodQuery] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, order_index')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('order_index', { ascending: true }),
      supabase
        .from('products')
        .select('id, category_id, name, description, price, image_url, is_available')
        .eq('tenant_id', tenant.id)
        .eq('is_available', true)
        .order('created_at', { ascending: false }),
    ]);

    if (catQuery.data && catQuery.data.length > 0) {
      categories = catQuery.data;
    }
    if (prodQuery.data && prodQuery.data.length > 0) {
      products = prodQuery.data;
    }
  }

  // 3. Determine if using real DB records or mockup demonstration
  const isCustomStore = categories.length > 0 || products.length > 0;
  const displayCategories = isCustomStore ? categories : MOCKUP_CATEGORIES;
  const displayProducts = isCustomStore ? products : MOCKUP_PRODUCTS;

  return (
    <StoreMenuClient
      tenant={tenant}
      subdomain={subdomain}
      categories={displayCategories}
      products={displayProducts}
      isCustomStore={isCustomStore}
    />
  );
}
