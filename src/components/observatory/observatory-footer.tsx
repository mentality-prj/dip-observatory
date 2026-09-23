import { QdipFooter } from '@/components/product/qdip-footer'
import type { Locale } from '@/lib/observatory-i18n'

export function ObservatoryFooter({ locale }: { locale: Locale }) {
  return (
    <QdipFooter
      locale={locale}
      variant="observatory"
      showNavigation={false}
      testId="observatory-footer"
    />
  )
}
