import { QdipFooter } from '@/components/product/qdip-footer'
import type { MarketingLocale } from './qdip-copy'

export function MarketingFooter({ locale }: { locale: MarketingLocale }) {
  return <QdipFooter locale={locale} />
}
