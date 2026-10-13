'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import type { MarketingLocale } from './qdip-copy'
import styles from './marketing-theme-toggle.module.css'

type Appearance = 'dark' | 'light'
const key = 'qdip-marketing-appearance'
const labels = {
  en: { toLight: 'Switch to light theme', toDark: 'Switch to dark theme', light: 'Light theme', dark: 'Dark theme' },
  uk: { toLight: 'Увімкнути світлу тему', toDark: 'Увімкнути темну тему', light: 'Світла тема', dark: 'Темна тема' },
  pl: { toLight: 'Włącz jasny motyw', toDark: 'Włącz ciemny motyw', light: 'Jasny motyw', dark: 'Ciemny motyw' },
} as const

function applyAppearance(appearance: Appearance) {
  const root = document.querySelector<HTMLElement>('[data-ds-theme="burgundy"]')
  if (root) root.dataset.marketingAppearance = appearance
}

export function MarketingThemeToggle({ locale }: { locale: MarketingLocale }) {
  const [appearance, setAppearance] = useState<Appearance>('dark')
  useEffect(() => {
    let next: Appearance = 'dark'
    try {
      next = window.localStorage.getItem(key) === 'light' ? 'light' : 'dark'
    } catch {
      /* Storage can be unavailable (privacy mode): the switch still works. */
    }
    setAppearance(next)
    applyAppearance(next)
  }, [])

  const changeAppearance = () => {
    const next = appearance === 'dark' ? 'light' : 'dark'
    applyAppearance(next)
    setAppearance(next)
    try {
      window.localStorage.setItem(key, next)
    } catch {
      /* Prefer local UI behavior to a storage exception. */
    }
  }

  const l = labels[locale]
  return (
    <button
      type="button"
      className={styles.toggle}
      data-testid="marketing-theme-toggle"
      aria-pressed={appearance === 'light'}
      aria-label={appearance === 'dark' ? l.toLight : l.toDark}
      title={appearance === 'dark' ? l.toLight : l.toDark}
      onClick={changeAppearance}
    >
      {appearance === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      <span>{appearance === 'dark' ? l.light : l.dark}</span>
    </button>
  )
}
