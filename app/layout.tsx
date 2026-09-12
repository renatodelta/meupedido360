import './globals.css';
import React from 'react';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.meupedido360.com'),
  title: {
    default: 'MeuPedido360 | Cardápio Digital & Sistema de Delivery',
    template: '%s | MeuPedido360',
  },
  description:
    'Crie seu cardápio digital próprio e delivery automatizado em minutos. Subdomínio exclusivo, pedidos em tempo real no WhatsApp, KDS para cozinha e 0% de comissão por venda.',
  keywords: [
    'cardápio digital',
    'sistema para delivery',
    'cardápio online restaurante',
    'delivery sem taxas',
    'pedidos whatsapp',
    'kds cozinha',
    'gestão de motoboys',
    'meupedido360',
  ],
  authors: [{ name: 'MeuPedido360', url: 'https://www.meupedido360.com' }],
  creator: 'MeuPedido360',
  publisher: 'MeuPedido360',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://www.meupedido360.com',
    siteName: 'MeuPedido360',
    title: 'MeuPedido360 | Cardápio Digital & Sistema de Delivery',
    description:
      'Crie sua plataforma de delivery própria em minutos. Subdomínio exclusivo, gestão de pedidos em tempo real, motoboys e 0% de comissão.',
    images: [
      {
        url: '/kiwify-cover.jpg',
        width: 1200,
        height: 630,
        alt: 'MeuPedido360 - Cardápio Digital & Delivery',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MeuPedido360 | Cardápio Digital & Sistema de Delivery',
    description:
      'Crie sua plataforma de delivery própria em minutos. Subdomínio exclusivo, gestão de pedidos em tempo real, motoboys e 0% de comissão.',
    images: ['/kiwify-cover.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'iMp3yAnPPAyIOvDl3cG55DU5FmDOZ-wKyj2OCdsEI',
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
