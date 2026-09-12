import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entrar no Painel do Restaurante',
  description:
    'Acesse seu painel administrativo MeuPedido360 para gerenciar pedidos em tempo real, cardápio, produtos e entregas.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
