'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { ProductHeader } from '@/design-system'
import { marketingHref, studioHref } from '@/lib/platform-urls'
import { StudioLanguageSwitcher } from './studio-language-switcher'
import { studioLocaleFromPath } from './studio-locale'

type CoreStatus = 'checking' | 'connected' | 'unavailable'

const STATUS_COPY: Record<CoreStatus, { full: string; compact: string }> = {
  checking: { full: 'Core checking', compact: 'Checking' },
  connected: { full: 'Core connected', compact: 'Connected' },
  unavailable: { full: 'Core unavailable', compact: 'Offline' },
}

export function StudioCoreStatus() {
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

  const copy = STATUS_COPY[status]
  return (
    <span
      className="studio-core-status"
      data-state={status}
      role="status"
      aria-live="polite"
      aria-label={copy.full}
    >
      <span className="studio-core-status-dot" aria-hidden />
      <span className="studio-core-status-label-full">{copy.full}</span>
      <span className="studio-core-status-label-compact">{copy.compact}</span>
    </span>
  )
}

export function StudioProductHeader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = studioLocaleFromPath(pathname, searchParams.get('lang'))

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
