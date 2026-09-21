import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type DesignTheme = 'green' | 'cyan' | 'emerald' | 'amber' | 'burgundy' | 'rose' | 'violet'
export type DesignMode = 'dark' | 'light'
export type ProductName = 'Studio' | 'Observatory'
export type ProductSwitch = { href: string; label: string; icon?: ReactNode }

export function DesignSystemProvider({
  theme,
  mode = 'dark',
  children,
  className,
}: {
  theme: DesignTheme
  mode?: DesignMode
  children: ReactNode
  className?: string
}) {
  return (
    <div data-ds-theme={theme} data-ds-mode={mode} className={className}>
      {children}
    </div>
  )
}

export function ProductLockup({
  href,
  brandHref,
  product,
  className,
  onClick,
}: {
  href: string
  brandHref?: string
  product: ProductName
  className?: string
  onClick?: () => void
}) {
  return (
    <div className={cn('ds-product-lockup', className)}>
      <Link aria-label={`QDIP ${product} home`} className="ds-product-lockup-product" href={href} onClick={onClick}>
        {product}.
      </Link>
      <Link aria-label="QDIP home" className="ds-product-lockup-brand" href={brandHref ?? href} onClick={onClick}>
        <Image
          alt="QDIP"
          className="ds-product-lockup-wordmark"
          height={157}
          priority
          sizes="116px"
          src="/qdip-logo.png"
          width={300}
        />
      </Link>
    </div>
  )
}

export function ProductSwitchLink({ href, label, icon }: ProductSwitch) {
  return (
    <Link className="ds-product-switch-link" href={href}>
      {icon ? (
        <span className="ds-product-switch-icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span>{label}</span>
    </Link>
  )
}

export function ProductHeader({
  href,
  brandHref,
  product,
  navigation,
  siteLink,
  productSwitch,
  status,
  utilities,
  className,
}: {
  href: string
  brandHref?: string
  product: ProductName
  navigation?: ReactNode
  siteLink?: ProductSwitch
  productSwitch?: ProductSwitch
  status?: ReactNode
  utilities?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('ds-product-header', className)}>
      <div className="ds-product-header-inner">
        <ProductLockup href={href} brandHref={brandHref} product={product} />
        {navigation ? (
          <div className="ds-product-header-center">{navigation}</div>
        ) : (
          <div className="ds-product-header-spacer" />
        )}
        <div className="ds-product-header-actions">
          {status}
          {siteLink ? <ProductSwitchLink {...siteLink} /> : null}
          {productSwitch ? <ProductSwitchLink {...productSwitch} /> : null}
          {utilities}
        </div>
      </div>
    </header>
  )
}

export function ProductShell({
  theme,
  mode = 'dark',
  className,
  header,
  mobileNavigation,
  children,
}: {
  theme: DesignTheme
  mode?: DesignMode
  className?: string
  header: ReactNode
  mobileNavigation?: ReactNode
  children: ReactNode
}) {
  return (
    <DesignSystemProvider theme={theme} mode={mode} className={cn('ds-app-shell', className)}>
      {header}
      {mobileNavigation ? <div className="ds-product-mobile-navigation">{mobileNavigation}</div> : null}
      {children}
    </DesignSystemProvider>
  )
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('ds-container', className)}>{children}</div>
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn('ds-page', className)}>{children}</main>
}

export function Section({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('ds-section', className)}>{children}</section>
}

export function Button({
  children,
  className,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  return (
    <button className={cn('ds-button', `ds-button-${variant}`, className)} {...props}>
      {children}
    </button>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="ds-input" {...props} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="ds-select" {...props} />
}

export function Badge({
  children,
  variant = 'neutral',
}: {
  children: ReactNode
  variant?: 'neutral' | 'emerald' | 'amber' | 'rose' | 'cyan'
}) {
  return <span className={cn('ds-badge', `ds-badge-${variant}`)}>{children}</span>
}

export function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="ds-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function Divider() {
  return <hr className="ds-divider" />
}
