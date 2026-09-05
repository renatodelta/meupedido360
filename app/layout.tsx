import './globals.css';
import React from 'react';

export const metadata = {
  title: 'MeuPedido360 - Plataforma SaaS de Cardápio Digital & Delivery',
  description: 'Crie seu cardápio digital em segundos com subdomínio próprio e integração com Mercado Pago.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
