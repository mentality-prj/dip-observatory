import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'QDIP',
    short_name: 'QDIP',
    description: 'QDIP turns priorities, constraints and uncertainty into explainable decisions with evidence.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fcf8f9',
    theme_color: '#7a1838',
    icons: [
      {
        src: '/qdip-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/qdip-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
