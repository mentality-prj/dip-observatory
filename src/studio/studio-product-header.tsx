'use client'

import { Cable } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ProductHeader } from '@/design-system'
import { marketingHref, studioSurfaceHref } from '@/lib/platform-urls'
import { studioCopy } from './studio-copy'
import styles from './studio-core-status.module.css'
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
    <span
      className={styles.status}
      data-state={status}
      data-studio-core-status
      role="status"
      aria-live="polite"
      aria-label={copy.full}
    >
      <Cable className={styles.icon} aria-hidden />
      <span className={styles.fullLabel}>{copy.full}</span>
      <span className={styles.compactLabel}>{copy.compact}</span>
    </span>
  )
}

export function StudioProductHeader() {
  const locale = useStudioLocale()

  return (
    <ProductHeader
      href={studioSurfaceHref('', locale)}
      brandHref={marketingHref(locale)}
      product="Studio"
      status={<StudioCoreStatus />}
      utilities={<StudioLanguageSwitcher />}
      nativeNavigation
    />
  )
}
