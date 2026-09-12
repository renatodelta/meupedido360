import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Criar Conta e Começar Grátis',
  description:
    'Cadastre seu restaurante na MeuPedido360 e crie seu cardápio digital em menos de 3 minutos. Subdomínio próprio e pedidos em tempo real.',
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
