import type { ReactNode } from 'react'
import '@/features/studio/styles.css'

export const metadata = {
  title: 'QDIP Studio',
  description: 'Configure, validate and evaluate decision systems with QDIP.',
}

export default function StudioLayout({ children }: { children: ReactNode }) {
  return children
}
