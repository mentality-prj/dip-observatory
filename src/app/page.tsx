import type { Metadata } from 'next'
import { QdipSite } from '@/components/marketing/qdip-site'
const title = 'QDIP — Decision Engine for consistent, explainable decisions'
const description =
  'Evaluate recurring decisions consistently when priorities, constraints and available information change. QDIP provides a recommendation with supporting evidence; your team makes the final decision.'
export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: {
    canonical: 'https://qdip.ai/en',
    languages: { en: 'https://qdip.ai/en', uk: 'https://qdip.ai/uk', pl: 'https://qdip.ai/pl' },
  },
  openGraph: { title, description, url: 'https://qdip.ai', siteName: 'QDIP', type: 'website' },
}
export default function Home() {
  return <QdipSite locale="en" />
}
