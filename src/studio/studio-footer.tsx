'use client'

import { QdipFooter } from '@/components/product/qdip-footer'
import { useStudioLocale } from './use-studio-locale'

export function StudioFooter() {
  const locale = useStudioLocale()
  return <QdipFooter locale={locale} showNavigation={false} testId="studio-footer" />
}
