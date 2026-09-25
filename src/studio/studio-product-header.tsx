'use client'

import { useEffect, useState } from 'react'
import { ProductHeader } from '@/design-system'
import { marketingHref, studioHref } from '@/lib/platform-urls'
import { studioCopy } from './studio-copy'
import { StudioLanguageSwitcher } from './studio-language-switcher'
import { useStudioLocale } from './use-studio-locale'

type CoreStatus = 'checking' | 'connected' | 'unavailable'

export function StudioCoreStatus() {
  const locale = useStudioLocale()
  const [status, setStatus] = useState<CoreStatus>('checking')

  useEffect(() => {
    let disposed = false
    const controller = new AbortController()

    const check = async () => {
      try {
        const response = await fetch('/api/studio/dimensions', {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!disposed) setStatus(response.ok ? 'connected' : 'unavailable')
      } catch {
        if (!disposed && !controller.signal.aborted) setStatus('unavailable')
      }
    }

    void check()
    const interval = window.setInterval(check, 60_000)

    return () => {
      disposed = true
      controller.abort()
      window.clearInterval(interval)
    }
  }, [])

  const copy = studioCopy(locale).headerStatus[status]
  return (
    <span className="studio-core-status" data-state={status} role="status" aria-live="polite" aria-label={copy.full}>
      <span className="studio-core-status-dot" aria-hidden />
      <span className="studio-core-status-label-full">{copy.full}</span>
      <span className="studio-core-status-label-compact">{copy.compact}</span>
    </span>
  )
}

export function StudioProductHeader() {
  const locale = useStudioLocale()

  return (
    <ProductHeader
      href={studioHref('', locale)}
      brandHref={marketingHref(locale)}
      product="Studio"
      brandStatus={<StudioCoreStatus />}
      utilities={<StudioLanguageSwitcher />}
    />
  )
}
