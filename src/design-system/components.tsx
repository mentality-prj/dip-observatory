import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type DesignTheme = 'green' | 'cyan' | 'emerald' | 'amber' | 'burgundy' | 'rose' | 'violet'
export type DesignMode = 'dark' | 'light'
export type ProductName = 'Studio' | 'Observatory'
export type ProductSwitch = { href: string; label: string; icon?: ReactNode }

function NavigationLink({
  href,
  className,
  children,
  ariaLabel,
  onClick,
  native,
}: {
  href: string
  className?: string
  children: ReactNode
  ariaLabel?: string
  onClick?: () => void
  native: boolean
}) {
  if (native) {
    return (
      <a aria-label={ariaLabel} className={className} href={href} onClick={onClick}>
        {children}
      </a>
    )
  }
  return (
    <Link aria-label={ariaLabel} className={className} href={href} onClick={onClick}>
      {children}
    </Link>
  )
}

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
  return <div data-ds-theme={theme} data-ds-mode={mode} className={className}>{children}</div>
}

export function ProductLockup({
  href,
  brandHref,
  product,
  className,
  onClick,
  nativeNavigation = false,
}: {
  href: string
  brandHref?: string
  product: ProductName
  className?: string
  onClick?: () => void
  nativeNavigation?: boolean
}) {
  return (
    <div className={cn('ds-product-lockup', className)}>
      <NavigationLink
        ariaLabel={`QDIP ${product} home`}
        className="ds-product-lockup-product"
        href={href}
        onClick={onClick}
        native={nativeNavigation}
      >
        {product}.
      </NavigationLink>
      <NavigationLink
        ariaLabel="QDIP home"
        className="ds-product-lockup-brand"
        href={brandHref ?? href}
        onClick={onClick}
        native={nativeNavigation}
      >
        <span className="ds-product-lockup-wordmark-frame" aria-hidden="true">
          <Image
            alt=""
            className="ds-product-lockup-wordmark"
            height={157}
            priority
            sizes="156px"
            src="/qdip-logo.png"
            width={300}
          />
        </span>
      </NavigationLink>
    </div>
  )
}

export function ProductSwitchLink({
  href,
  label,
  icon,
  nativeNavigation = false,
}: ProductSwitch & { nativeNavigation?: boolean }) {
  return (
    <NavigationLink
      className="ds-product-switch-link"
      href={href}
      native={nativeNavigation}
    >
      {icon ? <span className="ds-product-switch-icon" aria-hidden>{icon}</span> : null}
      <span>{label}</span>
    </NavigationLink>
  )
}

export function ProductHeader({
  href,
  brandHref,
  product,
  brandStatus,
  navigation,
  siteLink,
  productSwitch,
  status,
  utilities,
  className,
  nativeNavigation = false,
}: {
  href: string
  brandHref?: string
  product: ProductName
  brandStatus?: ReactNode
  navigation?: ReactNode
  siteLink?: ProductSwitch
  productSwitch?: ProductSwitch
  status?: ReactNode
  utilities?: ReactNode
  className?: string
  nativeNavigation?: boolean
}) {
  return (
    <header className={cn('ds-product-header', className)}>
      <div className="ds-product-header-inner">
        <div className="ds-product-header-brand">
          <ProductLockup
            href={href}
            brandHref={brandHref}
            product={product}
            nativeNavigation={nativeNavigation}
          />
          {brandStatus ? <div className="ds-product-header-brand-status">{brandStatus}</div> : null}
        </div>
        {navigation ? <div className="ds-product-header-center">{navigation}</div> : <div className="ds-product-header-spacer" />}
        <div className="ds-product-header-actions">
          {status}
          {siteLink ? <ProductSwitchLink {...siteLink} nativeNavigation={nativeNavigation} /> : null}
          {productSwitch ? <ProductSwitchLink {...productSwitch} nativeNavigation={nativeNavigation} /> : null}
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
  href,
  brandHref,
  product,
  brandStatus,
  navigation,
  mobileNavigation,
  siteLink,
  productSwitch,
  status,
  utilities,
  children,
  nativeNavigation = false,
}: {
  theme: DesignTheme
  mode?: DesignMode
  className?: string
  href: string
  brandHref?: string
  product: ProductName
  brandStatus?: ReactNode
  navigation?: ReactNode
  mobileNavigation?: ReactNode
  siteLink?: ProductSwitch
  productSwitch: ProductSwitch
  status?: ReactNode
  utilities?: ReactNode
  children: ReactNode
  nativeNavigation?: boolean
}) {
  return (
    <DesignSystemProvider theme={theme} mode={mode} className={className}>
      <ProductHeader
        href={href}
        brandHref={brandHref}
        product={product}
        brandStatus={brandStatus}
        navigation={navigation}
        siteLink={siteLink}
        productSwitch={productSwitch}
        status={status}
        utilities={utilities}
        nativeNavigation={nativeNavigation}
      />
      {mobileNavigation ? <div className="ds-product-mobile-navigation">{mobileNavigation}</div> : null}
      {children}
    </DesignSystemProvider>
  )
}

export function Surface({ as: Tag = 'section', className, children }: { as?: 'section' | 'article' | 'div'; className?: string; children: ReactNode }) {
  return <Tag className={cn('ds-surface', className)}>{children}</Tag>
}
export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return <div className="ds-page-header"><div>{eyebrow ? <div className="ds-page-eyebrow">{eyebrow}</div> : null}<h1 className="ds-h1">{title}</h1>{description ? <p className="ds-page-description">{description}</p> : null}</div>{actions ? <div className="ds-page-actions">{actions}</div> : null}</div>
}
export function StatusBadge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('ds-status-badge', className)}>{children}</span>
}
