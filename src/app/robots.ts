import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/s/', '/r/', '/abruf/', '/anfrage/', '/api/'], // API und Geheimnis-URLs nicht indexieren!
    },
    sitemap: 'https://unser-geheimnis.de/sitemap.xml',
  };
}
