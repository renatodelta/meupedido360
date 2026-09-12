import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/superadmin/',
          '/*/admin/',
          '/*/kds/',
          '/*/motoboy/',
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/favicon.ico', '/icon*', '/logo.png', '/*.png', '/*.jpg'],
      },
    ],
    sitemap: 'https://www.meupedido360.com/sitemap.xml',
    host: 'https://www.meupedido360.com',
  };
}
