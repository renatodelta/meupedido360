# 🚀 MeuPedido360 - Status & Integração Asaas

**Data de atualização:** 14/09/2026

---

## ✅ Integração Completa do Asaas Concluída

O provedor de pagamento e assinatura recorrente do MeuPedido360 foi migrado com sucesso da Kiwify / Mercado Pago para o **Asaas**.

1. **Webhook do Asaas Criado:**
   - URL do Webhook: `app/api/webhooks/asaas/route.ts` (`POST /api/webhooks/asaas`).
   - Ativação automática de lojas quando o pagamento for recebido ou confirmado (`PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`).
   - Suspensão automática de lojas em caso de atraso/vencimento ou cancelamento (`PAYMENT_OVERDUE`, `PAYMENT_DELETED`, `PAYMENT_REFUNDED`).
   - **Auto-onboarding:** Se um novo lojista assinar diretamente pelo Asaas, o sistema cria automaticamente a loja e o usuário proprietário.

2. **Simulador de Testes Local:**
   - Criado em `app/api/webhooks/asaas/simulate/route.ts` (`POST /api/webhooks/asaas/simulate`).

3. **Geração de Assinatura via API e Checkout Fallback:**
   - Atualizados os endpoints [`app/api/tenant/subscription/route.ts`](file:///c:/xampp/htdocs/meupedido360/app/api/tenant/subscription/route.ts) e [`app/api/auth/signup/route.ts`](file:///c:/xampp/htdocs/meupedido360/app/api/auth/signup/route.ts) para criar faturas e assinaturas no Asaas enviando o `externalReference` (ID do Tenant).

---

## 📋 Como Configurar no Painel do Asaas:

1. **Obter a Chave de API:**
   - No painel do Asaas > **Configurações da Conta > Integrações > Chaves de API**.
   - Gerar nova chave e copiar o código (`$aact_...`).

2. **Configurar o Webhook de Cobranças:**
   - No painel do Asaas > **Configurações da Conta > Integrações > Webhooks > Cobranças**.
   - **URL do Webhook:** `https://meupedido360.com/api/webhooks/asaas`
   - **Token de Acesso / Segredo:** Crie uma senha/token de segurança.
   - **Eventos:** Marcar `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`, `PAYMENT_REFUNDED`.

3. **Adicionar Variáveis no `.env.local` e Vercel:**
   ```env
   ASAAS_API_KEY=$aact_sua_chave_de_api
   ASAAS_WEBHOOK_SECRET=seu_token_de_acesso_webhook
   NEXT_PUBLIC_ASAAS_CHECKOUT_URL=https://www.asaas.com/c/seu_link_fallback (opcional)
   ASAAS_ENVIRONMENT=production
   ```
