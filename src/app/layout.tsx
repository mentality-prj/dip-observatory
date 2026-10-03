import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://qdip.ai'),
  title: { default: 'QDIP — Decision Engine for consistent, explainable decisions', template: '%s · QDIP' },
  description:
    'QDIP evaluates alternatives, priorities, constraints and uncertainty to provide a recommendation with supporting evidence. The responsible person makes the final decision.',
  icons: {
    icon: [
      { url: '/qdip-favicon.svg', type: 'image/svg+xml' },
      { url: '/qdip-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/qdip-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: ['/qdip-favicon.svg'],
    apple: [{ url: '/qdip-apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: { siteName: 'QDIP', type: 'website' },
}
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}
