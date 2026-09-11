export const metadata = {
  title: 'MeuPedido360 - Cardápio Digital & Delivery',
  description: 'Crie seu cardápio digital em segundos com subdomínio próprio e gestão de pedidos em tempo real.',
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#061325] text-slate-100">
      {children}
    </div>
  );
}
