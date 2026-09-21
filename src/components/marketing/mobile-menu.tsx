'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import styles from './qdip-site.module.css'

type Item = { href: string; label: string; icon?: ReactNode }

export function MobileMenu({ items }: { items: readonly Item[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={styles.mobileMenu}>
      <button aria-controls="mobile-navigation" aria-expanded={open} aria-label={open ? 'Close navigation' : 'Open navigation'} className={styles.menuButton} onClick={() => setOpen((v) => !v)} type="button">
        {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
      </button>
      {open && (
        <nav aria-label="Mobile navigation" className={styles.mobileNav} id="mobile-navigation">
          {items.map((item) => (
            <Link href={item.href} key={`${item.href}-${item.label}`} onClick={() => setOpen(false)}>
              {item.icon ? <span aria-hidden>{item.icon}</span> : null}
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}
