import './globals.css';
import React from 'react';

export const metadata = {
  title: 'MeuPedido360 - Cardápio Digital, KDS & Delivery em Tempo Real',
  description: 'A plataforma completa de Cardápio Digital & Delivery para o seu negócio: subdomínio próprio, gestão de pedidos em tempo real, motoboys e pagamentos.',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth dark">
      <body className="antialiased min-h-screen bg-[#061325] text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
