# Visão Geral & Arquitetura do Projeto MeuPedido360

## 🎯 Propósito do Projeto
**MeuPedido360** é uma plataforma SaaS Multi-Tenant completa de Cardápio Digital, Sistema de Pedidos KDS (Kitchen Display System) em Tempo Real, Gestão de Entregadores (Motoboys) e Faturamento Recorrente para estabelecimentos gastronômicos (hamburguerias, pizzarias, padarias, restaurantes e deliveries).

---

## 🏗️ Arquitetura & Roteamento (Multi-Tenancy)
- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS.
- **Roteamento Inteligente por Subdomínio (`middleware.ts`)**:
  - **Domínio Principal (`meupedido360.com`, `localhost:3000`)**:
    - Mapeado para `app/(public)/*`.
    - Landing page de vendas (`/`), Cadastro de lojistas (`/signup`), Login (`/login`) e Painel Super Admin (`/superadmin`).
  - **Subdomínios de Lojistas (`padaria.meupedido360.com`, `padaria.localhost:3000`)**:
    - Mapeados dinamicamente para `app/(store)/[subdomain]/*`.
    - Vitrine pública para o consumidor (`/`).
    - Painel administrativo da loja (`/admin`, `/admin/produtos`, `/admin/drivers`, `/admin/onboarding`).
- **Layouts & Estilização**:
  - Injeção dinâmica de variáveis CSS de marca (`--primary-color`, etc.) no wrapper da loja.
  - Suporte a rolagem suave (`scroll-smooth`) e visual moderno Dark Mode com Glassmorphism.

---

## 🗄️ Banco de Dados & Infraestrutura (Supabase)
- **Engine**: PostgreSQL com Row Level Security (RLS) ativo em todas as tabelas.
- **Tabelas Principais (`schema.sql`)**:
  - `tenants`: Estabelecimentos (id, name, slug, document, phone_whatsapp, logo_url, banner_url, primary_color, secondary_color, plan_status: `trial` | `active` | `suspended`).
  - `users`: Usuários e colaboradores vinculados ao `auth.users` do Supabase com papéis (`owner`, `attendant`, `driver`).
  - `categories`: Categorias do cardápio ordenadas por `order_index`.
  - `products`: Catálogo de produtos com preço, descrição, disponibilidade e imagens em Data URL / URL.
  - `orders`: Pedidos com dados do cliente, endereço JSON, subtotal, taxa de entrega, total, forma de pagamento e status (`pending`, `preparing`, `ready_for_pickup`, `in_route`, `delivered`, `cancelled`).
  - `order_items`: Itens associados a cada pedido.
  - `drivers`: Entregadores cadastrados por loja com status (`available`, `busy`, `offline`) e telefone.
- **Supabase Realtime**: Publicação ativa na tabela `orders` para sincronização instantânea de novos pedidos via WebSocket.

---

## 🚀 Módulos e Funcionalidades do Sistema

### 1. Landing Page de Vendas (`app/(public)/page.tsx`)
- **Apresentação Comercial de Alto Impacto**: Design moderno com tema escuro e efeitos de iluminação em degradê.
- **Seção "Como Funciona" (`#demo`)**: Jornada visual e interativa em 4 passos:
  1. *Crie sua Loja em 60s* (subdomínio próprio no Edge).
  2. *Cadastre seu Cardápio* (fotos e adicionais).
  3. *Receba Pedidos no KDS* (alerta sonoro e WebSocket em tempo real).
  4. *Despache & Feche o Caixa* (rota no WhatsApp e fechamento com motoboy).
- **Planos de Assinatura**:
  - *Trial 7 Dias*: Grátis sem necessidade de cartão de crédito.
  - *Mensal Pro*: R$ 59,90/mês com acesso total a todas as ferramentas.

### 2. Cadastro de Novos Lojistas (`app/(public)/signup/page.tsx`)
- Formulário inteligente com verificação de disponibilidade de subdomínio em tempo real (`/api/tenant/check-slug`).
- Máscara dinâmica de telefone brasileiro `(XX) XXXXX-XXXX`.
- Criação automática de usuário no Supabase Auth e inserção do tenant e permissões no banco.

### 3. Vitrine Pública do Restaurante (`app/(store)/[subdomain]/page.tsx` & `StoreMenuClient.tsx`)
- **Cardápio Digital**: Listagem de categorias e produtos responsiva e ultrarrápida.
- **Carrinho de Compras Interativo**:
  - Botão de adição direta que se transforma em seletor de quantidade `[-] [Qtd] [+]`.
  - Barra de sacola flutuante com contagem de itens e valor total em tempo real.
- **Gaveta de Checkout Completa**:
  - Revisão e alteração de itens na sacola.
  - Dados do cliente (Nome e WhatsApp com máscara).
  - Endereço de entrega completo (Rua, Número, Bairro e Complemento).
  - **Formas de Pagamento na Entrega**:
    - ⚡ *PIX na Entrega*
    - 💳 *Cartão na Maquininha* (Crédito/Débito)
    - 💵 *Dinheiro* (com campo de troco)
  - Disparo de pedido em tempo real via `POST /api/tenant/orders` e tela de sucesso.

### 4. Painel KDS de Cozinha & Pedidos ao Vivo (`app/(store)/[subdomain]/admin/page.tsx`)
- **Quadro Kanban Operacional em 4 Colunas**:
  - `1. Novos (Pendentes)` ➔ `2. Em Preparo` ➔ `3. Prontos p/ Saída` ➔ `4. Em Rota de Entrega`.
- **Alerta Sonoro (Chime)**: Sintetizador de áudio em Web Audio API disparado imediatamente ao receber novo pedido via Supabase Realtime.
- **Simulador de Pedidos**: Botão para injetar pedidos de teste durante demonstrações do lojista.
- **Despacho em 1-Clique via WhatsApp do Motoboy**: Envia mensagem com os dados do cliente, endereço completo, valor a cobrar e **link direto para navegação no Google Maps / Waze**.
- **Métricas do Turno**: Faturamento concluído, pedidos ativos, pedidos entregues e ticket médio.

### 5. Gestão de Produtos & Cardápio (`app/(store)/[subdomain]/admin/produtos/page.tsx`)
- Gestão de categorias e itens do cardápio.
- Ativação/Desativação de itens (*Disponível / Esgotado*) em 1 clique.
- **Upload Direto de Fotos com Compressão Automática (< 200 KB)**:
  - Campo de URL externa removido.
  - Algoritmo em HTML5 Canvas que comprime e otimiza imagens no navegador antes do envio, mantendo qualidade sem sobrecarregar o carregamento do cardápio.

### 6. Módulo de Gestão de Entregadores & Fechamento de Caixa (`app/(store)/[subdomain]/admin/drivers/page.tsx`)
- Cadastro e gerenciamento de motoboys da loja com status (*Disponível / Em Rota / Off-line*).
- **Relatório de Fechamento de Turno (Acerto de Caixa)**:
  - Total de entregas realizadas pelo entregador.
  - Total de taxas de entrega a pagar ao motoboy.
  - Total de dinheiro coletado na rua a ser devolvido ao caixa.
  - Botão de **1-Clique "Enviar Acerto via WhatsApp"** com comprovante formatado.

### 7. Customização Visual & Onboarding (`app/(store)/[subdomain]/admin/onboarding/page.tsx`)
- Upload de Logo e Banner da loja.
- **Extrator Inteligente de Paleta de Cores**: Analisa os pixels da logo via Canvas e sugere automaticamente as cores primárias e secundárias da marca.

### 8. Painel Super Admin Master SaaS (`app/(public)/superadmin/page.tsx`)
- **Visão Geral Financeira do Negócio**:
  - MRR (Receita Recorrente Mensal): R$ 59,90 × número de assinantes ativos.
  - Total de lojas cadastradas, ativas, em trial e suspensas.
- **Tabela Geral de Estabelecimentos (Tenants)**:
  - Busca instantânea e filtros por status.
  - Ações em 1 clique: *Ativar Assinatura*, *Suspender/Bloquear Loja* (exibe tela de bloqueio no cardápio) e *Converter p/ Trial*.
  - Link direto para WhatsApp do proprietário e link para visitar a vitrine.
  - **Reset Administrativo de Senhas**: Modal com geração automática ou manual de nova senha via Supabase Auth Admin Service Role API.

---

## 🛠️ Utilitários Centrais & Boas Práticas
- **Máscara de Telefone (`lib/formatters.ts`)**: Função `formatPhone()` que aplica a máscara brasileira `(XX) XXXXX-XXXX` progressivamente durante a digitação e formata números em relatórios.
- **Testes Locais de Subdomínio**:
  - Domínio Master: `http://localhost:3000`
  - Subdomínio da Loja: `http://padaria.localhost:3000`
  - Super Admin: `http://localhost:3000/superadmin`
- **Validação de Build**:
  - `npx.cmd tsc --noEmit` (0 erros de tipagem).
  - Limpeza de cache `.next` antes de builds de produção: `Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue`.
  - `npm.cmd run build` (compilação estática e dinâmica de todas as páginas).
