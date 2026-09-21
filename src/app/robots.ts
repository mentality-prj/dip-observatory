import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/platform/', '/admin/', '/api/'] },
    sitemap: 'https://qdip.ai/sitemap.xml',
    host: 'https://qdip.ai',
  }
}
