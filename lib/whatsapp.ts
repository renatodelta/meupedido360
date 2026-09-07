/**
 * lib/whatsapp.ts
 * 
 * Utilitários centralizados para geração de links e formatação de comunicados
 * profissionais do WhatsApp para o MeuPedido360.
 * 
 * NOTA DE COMPATIBILIDADE:
 * Utilizamos o endpoint direto `https://api.whatsapp.com/send` em vez de `wa.me`
 * e símbolos universais (Unicode BMP) para evitar a conversão de emojis em '' (diamante com ponto de interrogação)
 * causada por falhas de redirecionamento HTTP 302 e proxies legados.
 */

/**
 * Converte número e texto em uma URL direta e segura do WhatsApp
 */
export function createWhatsAppUrl(phone: string, text?: string): string {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  if (!cleanPhone) return '#';

  // Garante o DDI 55 (Brasil) caso não esteja presente
  const formattedPhone = cleanPhone.startsWith('55') && cleanPhone.length > 11
    ? cleanPhone
    : `55${cleanPhone}`;

  if (!text) {
    return `https://api.whatsapp.com/send?phone=${formattedPhone}`;
  }

  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;
}

interface SettlementParams {
  driverName: string;
  storeName: string;
  deliveryCount: number;
  totalDeliveryFees: number;
  totalMoneyCollected: number;
  date?: Date;
}

/**
 * Gera o comunicado oficial de Fechamento de Caixa para o Motoboy
 */
export function formatSettlementMessage({
  driverName,
  storeName,
  deliveryCount,
  totalDeliveryFees,
  totalMoneyCollected,
  date = new Date(),
}: SettlementParams): string {
  const dateFormatted = date.toLocaleDateString('pt-BR');
  const timeFormatted = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const netBalance = totalDeliveryFees - totalMoneyCollected;

  let balanceLine = '';
  if (netBalance > 0) {
    balanceLine = `► A PAGAR AO ENTREGADOR: *R$ ${netBalance.toFixed(2).replace('.', ',')}*`;
  } else if (netBalance < 0) {
    balanceLine = `► A DEVOLVER AO CAIXA DA LOJA: *R$ ${Math.abs(netBalance).toFixed(2).replace('.', ',')}*`;
  } else {
    balanceLine = `► CONTAS ACERTADAS: *R$ 0,00* (Sem pendências)`;
  }

  return [
    `========================================`,
    `   *FECHAMENTO DE CAIXA • MOTOBOY*`,
    `========================================`,
    ``,
    `*Entregador:* ${driverName}`,
    `*Estabelecimento:* ${storeName}`,
    `*Data:* ${dateFormatted} às ${timeFormatted}`,
    ``,
    `----------------------------------------`,
    `*RESUMO OPERACIONAL DO TURNO:*`,
    `• Entregas Realizadas: ${deliveryCount}`,
    `• Taxas de Entrega a Receber: R$ ${totalDeliveryFees.toFixed(2).replace('.', ',')}`,
    `• Dinheiro Coletado a Devolver: R$ ${totalMoneyCollected.toFixed(2).replace('.', ',')}`,
    `----------------------------------------`,
    ``,
    `*BALANÇO FINAL DO ACERTO:*`,
    balanceLine,
    ``,
    `========================================`,
    `_Comprovante emitido via MeuPedido360_`,
  ].join('\n');
}

interface DispatchParams {
  orderId: string;
  storeName: string;
  customerName: string;
  customerPhone: string;
  address: string;
  mapsUrl: string;
  items?: Array<{ name: string; quantity: number }>;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  changeFor?: string;
}

/**
 * Gera o ticket de despacho de pedido para o WhatsApp do Motoboy
 */
export function formatDispatchMessage({
  orderId,
  storeName,
  customerName,
  customerPhone,
  address,
  mapsUrl,
  items,
  paymentMethod,
  paymentStatus,
  total,
  changeFor,
}: DispatchParams): string {
  const shortId = orderId.substring(0, 6).toUpperCase();
  const isPaidOnline = paymentStatus === 'paid';
  const methodLabel = paymentMethod.toUpperCase().replace('_', ' ');

  const itemsList = items && items.length > 0
    ? items.map(i => `• ${i.quantity}x ${i.name}`).join('\n')
    : '• Ver itens conferidos no pacote';

  return [
    `========================================`,
    `   *NOVA ENTREGA • PEDIDO #${shortId}*`,
    `========================================`,
    ``,
    `*Loja:* ${storeName}`,
    `*Cliente:* ${customerName}`,
    `*Telefone:* ${customerPhone}`,
    ``,
    `----------------------------------------`,
    `*ENDEREÇO DE ENTREGA:*`,
    `• ${address}`,
    ``,
    `*ROTA NO GOOGLE MAPS:*`,
    mapsUrl,
    `----------------------------------------`,
    ``,
    `*ITENS DO PACOTE:*`,
    itemsList,
    ``,
    `----------------------------------------`,
    `*CONDIÇÃO DE COBRANÇA:*`,
    `• Método: ${methodLabel}`,
    isPaidOnline
      ? `• Status: *JÁ PAGO ONLINE (NÃO COBRAR)*`
      : `• VALOR A COBRAR NA ENTREGA: *R$ ${total.toFixed(2).replace('.', ',')}*`,
    changeFor ? `• Levar troco para: ${changeFor}` : '',
    `========================================`,
    `_MeuPedido360 • Despacho Rápido_`,
  ].filter(line => line !== '').join('\n');
}
