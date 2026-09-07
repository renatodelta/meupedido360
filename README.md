# MeuPedido360 - Plataforma SaaS de Cardápio Digital & Delivery

Plataforma SaaS Multi-Tenant completa de Cardápio Digital com subdomínio próprio, Sistema KDS de Pedidos ao Vivo com Kanban, Gestão de Entregadores (Motoboys) e Painel Super Admin para controle de assinaturas.

---

## 🚀 Funcionalidades da Plataforma

- **🌐 Multi-Tenancy por Subdomínio (`*.meupedido360.com` / `*.localhost:3000`)**: Cada estabelecimento possui seu próprio endereço web exclusivo gerenciado no Edge pelo Next.js Middleware.
- **🛒 Vitrine do Cliente com Carrinho Interativo**: Adição rápida de itens, barra flutuante de sacola e gaveta de checkout completa com opções de pagamento na entrega (PIX, Cartão na maquininha, Dinheiro com troco).
- **📊 Painel KDS & Kanban ao Vivo (`/admin`)**: Sistema de exibição de pedidos na cozinha com alerta sonoro imediato (Chime via Supabase Realtime), atualização de status em 1 clique e despacho no WhatsApp do motoboy com link do Google Maps.
- **📸 Cardápio com Upload Direto e Compressão Automática (`/admin/produtos`)**: Upload de fotos de produtos com compressão inteligente em HTML5 Canvas no navegador (< 200 KB).
- **🛵 Gestão de Entregadores & Fechamento de Caixa (`/admin/drivers`)**: Cadastro de motoboys, atribuição de pedidos e relatório de acerto de caixa diário (taxas a pagar vs. dinheiro a devolver).
- **🎨 Customização Visual & Extrator de Cores (`/admin/onboarding`)**: Identidade visual dinâmica com extração automática da paleta de cores a partir da logo da loja.
- **🛡️ Painel Super Admin (`/superadmin`)**: Métricas de faturamento recorrente (MRR), gestão global de estabelecimentos, bloqueio/desbloqueio em 1 clique e reset administrativo de senhas via Supabase Auth Admin.
- **📞 Máscara de Telefone Brasileira**: Formatação progressiva `(XX) XXXXX-XXXX` aplicada em todos os formulários e listagens.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend / Fullstack**: [Next.js 14 (App Router)](https://nextjs.org/), React 18, TypeScript, Tailwind CSS, Lucide React
- **Banco de Dados & Auth**: [Supabase](https://supabase.com/) (PostgreSQL com Row Level Security e Realtime WebSockets)
- **Pagamentos & Assinaturas**: Mercado Pago Webhooks

---

## 💻 Como Rodar Localmente

1. Clone o repositório e instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente em `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua-url-supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
   SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse no navegador:
   - **Plataforma Principal / Landing Page**: `http://localhost:3000`
   - **Vitrine e Painel da Loja Demo**: `http://padaria.localhost:3000`
   - **Painel Super Admin**: `http://localhost:3000/superadmin`
