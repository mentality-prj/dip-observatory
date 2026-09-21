import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type DesignTheme = 'green' | 'cyan' | 'emerald' | 'amber' | 'burgundy' | 'rose' | 'violet'
export type DesignMode = 'dark' | 'light'
export type ProductName = 'Studio' | 'Observatory'
export type ProductSwitch = { href: string; label: string }

export function DesignSystemProvider({ theme, mode = 'dark', children, className }: { theme: DesignTheme; mode?: DesignMode; children: ReactNode; className?: string }) {
  return <div data-ds-theme={theme} data-ds-mode={mode} className={className}>{children}</div>
}

export function ProductLockup({ href, brandHref, product, className, onClick }: { href: string; brandHref?: string; product: ProductName; className?: string; onClick?: () => void }) {
  return (
    <div className={cn('ds-product-lockup', className)}>
      <Link aria-label="QDIP home" className="ds-product-lockup-brand" href={brandHref ?? href} onClick={onClick}>QDIP</Link>
      <Link aria-label={`QDIP ${product} home`} className="ds-product-lockup-product" href={href} onClick={onClick}>.{product}</Link>
    </div>
  )
}

export function ProductSwitchLink({ href, label }: ProductSwitch) {
  return <Link className="ds-product-switch-link" href={href}>{label} <span aria-hidden>↗</span></Link>
}

export function ProductHeader({ href, brandHref, product, navigation, siteLink, productSwitch, status, utilities, className }: { href: string; brandHref?: string; product: ProductName; navigation?: ReactNode; siteLink?: ProductSwitch; productSwitch: ProductSwitch; status?: ReactNode; utilities?: ReactNode; className?: string }) {
  return (
    <header className={cn('ds-product-header', className)}>
      <div className="ds-product-header-inner">
        <ProductLockup href={href} brandHref={brandHref} product={product} />
        {navigation ? <div className="ds-product-header-center">{navigation}</div> : <div className="ds-product-header-spacer" />}
        <div className="ds-product-header-actions">
          {status}
          {siteLink ? <ProductSwitchLink {...siteLink} /> : null}
          {utilities}
          <ProductSwitchLink {...productSwitch} />
        </div>
      </div>
    </header>
  )
}

export function ProductShell({ theme, mode = 'dark', className, href, brandHref, product, navigation, mobileNavigation, siteLink, productSwitch, status, utilities, children }: { theme: DesignTheme; mode?: DesignMode; className?: string; href: string; brandHref?: string; product: ProductName; navigation?: ReactNode; mobileNavigation?: ReactNode; siteLink?: ProductSwitch; productSwitch: ProductSwitch; status?: ReactNode; utilities?: ReactNode; children: ReactNode }) {
  return (
    <DesignSystemProvider theme={theme} mode={mode} className={className}>
      <ProductHeader href={href} brandHref={brandHref} product={product} navigation={navigation} siteLink={siteLink} productSwitch={productSwitch} status={status} utilities={utilities} />
      {mobileNavigation ? <div className="ds-product-mobile-navigation">{mobileNavigation}</div> : null}
      {children}
    </DesignSystemProvider>
  )
}

export function Surface({ as: Tag = 'section', className, children }: { as?: 'section' | 'article' | 'div'; className?: string; children: ReactNode }) { return <Tag className={cn('ds-surface', className)}>{children}</Tag> }

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return <div className="ds-page-header"><div>{eyebrow ? <div className="ds-page-eyebrow">{eyebrow}</div> : null}<h1 className="ds-h1">{title}</h1>{description ? <p className="ds-page-description">{description}</p> : null}</div>{actions ? <div className="ds-page-actions">{actions}</div> : null}</div>
}

export function StatusBadge({ children, className }: { children: ReactNode; className?: string }) { return <span className={cn('ds-status-badge', className)}>{children}</span> }

export function Card({ className, children }: { className?: string; children: ReactNode }) { return <div className={cn('ds-card', className)}>{children}</div> }
export function CardHeader({ className, children }: { className?: string; children: ReactNode }) { return <div className={cn('ds-card-header', className)}>{children}</div> }
export function CardTitle({ className, children }: { className?: string; children: ReactNode }) { return <h3 className={cn('ds-card-title', className)}>{children}</h3> }
export function CardDescription({ className, children }: { className?: string; children: ReactNode }) { return <p className={cn('ds-card-description', className)}>{children}</p> }
export function CardContent({ className, children }: { className?: string; children: ReactNode }) { return <div className={cn('ds-card-content', className)}>{children}</div> }

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost'; size?: 'sm' | 'md' | 'lg' }) { return <button className={cn('ds-button', `ds-button-${variant}`, `ds-button-${size}`, className)} {...props}>{children}</button> }
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input className={cn('ds-input', props.className)} {...props} /> }
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select className={cn('ds-select', props.className)} {...props} /> }
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={cn('ds-textarea', props.className)} {...props} /> }
