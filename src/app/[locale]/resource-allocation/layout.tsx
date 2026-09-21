import type { ReactNode } from 'react'
import { PrototypeRouteLayout } from '@/features/observatory'

export default function ResourceAllocationLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  return (
    <PrototypeRouteLayout params={params} theme="rose">
      {children}
    </PrototypeRouteLayout>
  )
}
