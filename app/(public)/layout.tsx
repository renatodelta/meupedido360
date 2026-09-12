import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MeuPedido360 | Cardápio Digital & Sistema de Delivery para Restaurantes',
  description:
    'Crie seu cardápio digital próprio em minutos com subdomínio exclusivo, pedidos em tempo real integrados com WhatsApp, painel KDS e sem comissões por venda.',
  alternates: {
    canonical: 'https://www.meupedido360.com',
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://www.meupedido360.com/#website',
      url: 'https://www.meupedido360.com',
      name: 'MeuPedido360',
      description: 'Plataforma SaaS de Cardápio Digital e Delivery em Tempo Real',
      inLanguage: 'pt-BR',
      publisher: {
        '@id': 'https://www.meupedido360.com/#organization',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://www.meupedido360.com/#organization',
      name: 'MeuPedido360',
      url: 'https://www.meupedido360.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.meupedido360.com/icon-512.png',
        width: 512,
        height: 512,
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'MeuPedido360',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'BRL',
        availability: 'https://schema.org/InStock',
      },
      description:
        'Solução completa de cardápio digital, delivery online com subdomínio próprio, KDS para cozinha e automação de pedidos.',
    },
  ],
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#061325] text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {children}
    </div>
  );
}
