import React from 'react';
import '../globals.css';

export const metadata = {
  title: 'Partiu360 - Plataforma SaaS de Cardápio Digital & Delivery',
  description: 'Crie seu cardápio digital em segundos com subdomínio próprio e integração com Mercado Pago.',
};

/**
 * app/(public)/layout.tsx
 * 
 * Root layout for the public marketing site.
 * Imports globals.css to apply Tailwind styling.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className="antialiased bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
