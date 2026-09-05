# Visão Geral & Arquitetura do Projeto MeuPedido360

## 🎯 Propósito do Projeto
**MeuPedido360** é uma plataforma SaaS Multi-Tenant de Cardápio Digital & Delivery via WhatsApp para estabelecimentos alimentícios (restaurantes, padarias, hamburguerias).

## 🏗️ Arquitetura & Roteamento (Multi-Tenancy)
- **Framework**: Next.js 14 (App Router) + React + TypeScript + Tailwind CSS.
- **Roteamento por Subdomínio (`middleware.ts`)**:
  - Dominio Principal (`meupedido360.com`, `localhost:3000`) => Mapeado para `app/(public)/*` (Landing Page, Signup).
  - Subdomínios de Lojistas (`*.meupedido360.com`, `*.localhost:3000`) => Mapeados dinamicamente para `app/(store)/[subdomain]/*`.
- **Root Layout (`app/layout.tsx`)**: Contém a injeção global do Tailwind CSS (`globals.css`) e estrutura base `<html>` / `<body>`.

## 🗄️ Banco de Dados & Infraestrutura (Supabase)
- **Credenciais**: Configuradas em `.env.local`.
- **Tabela `tenants`**: Armazena os dados das lojas (id, name, slug, cores customizadas, plan_status).
- **Tabelas Relacionadas**: `categories`, `products`, `orders`, `order_items`, `users`, `drivers`.
- **Validação de Subdomínio**: A rota `/api/tenant/check-slug` verifica no Supabase se o slug está em uso antes do cadastro.

## 🛠️ Regras de Execução & Desenvolvimento
- **Shell Preferido**: Git Bash (`cp`, `rm -rf`, `npm` direto).
- **Testes Locais de Subdomínio**: Acessar via `http://<slug>.localhost:3000` (ex: `http://padaria.localhost:3000`).
