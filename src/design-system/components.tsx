import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type DesignTheme = 'green' | 'cyan' | 'emerald' | 'amber' | 'burgundy' | 'rose' | 'violet'
export type DesignMode = 'dark' | 'light'
export type ProductName = 'Studio' | 'Observatory'
export type ProductSwitch = { href: string; label: string; icon?: ReactNode }

export function DesignSystemProvider({ theme, mode = 'dark', children, className }: { theme: DesignTheme; mode?: DesignMode; children: ReactNode; className?: string }) {
  return <div data-ds-theme={theme} data-ds-mode={mode} className={className}>{children}</div>
}

export function ProductLockup({ href, brandHref, product, className, onClick }: { href: string; brandHref?: string; product: ProductName; className?: string; onClick?: () => void }) {
  return (
    <div className={cn('ds-product-lockup', className)}>
      <Link aria-label="QDIP home" className="ds-product-lockup-brand" href={brandHref ?? href} onClick={onClick}>
        <Image alt="QDIP" className="ds-product-lockup-wordmark" height={157} priority sizes="96px" src="/qdip-logo.png" style={{ clipPath: 'inset(0 10%)' }} width={300} />
      </Link>
      <Link aria-label={`QDIP ${product} home`} className="ds-product-lockup-product" href={href} onClick={onClick}>.{product}</Link>
    </div>
  )
}

export function ProductSwitchLink({ href, label, icon }: ProductSwitch) {
  return <Link className="ds-product-switch-link" href={href}>{icon ? <span className="ds-product-switch-icon" aria-hidden>{icon}</span> : null}<span>{label}</span></Link>
}

export function ProductHeader({ href, brandHref, product, navigation, siteLink, productSwitch, status, utilities, className }: { href: string; brandHref?: string; product: ProductName; navigation?: ReactNode; siteLink?: ProductSwitch; productSwitch?: ProductSwitch; status?: ReactNode; utilities?: ReactNode; className?: string }) {
  return (
    <header className={cn('ds-product-header', className)}><div className="ds-product-header-inner"><ProductLockup href={href} brandHref={brandHref} product={product} />{navigation ? <div className="ds-product-header-center">{navigation}</div> : <div className="ds-product-header-spacer" />}<div className="ds-product-header-actions">{status}{siteLink ? <ProductSwitchLink {...siteLink} /> : null}{productSwitch ? <ProductSwitchLink {...productSwitch} /> : null}{utilities}</div></div></header>
  )
}

export function ProductShell({ theme, mode = 'dark', className, href, brandHref, product, navigation, mobileNavigation, siteLink, productSwitch, status, utilities, children }: { theme: DesignTheme; mode?: DesignMode; className?: string; href: string; brandHref?: string; product: ProductName; navigation?: ReactNode; mobileNavigation?: ReactNode; siteLink?: ProductSwitch; productSwitch?: ProductSwitch; status?: ReactNode; utilities?: ReactNode; children: ReactNode }) {
  return <DesignSystemProvider theme={theme} mode={mode} className={className}><ProductHeader href={href} brandHref={brandHref} product={product} navigation={navigation} siteLink={siteLink} productSwitch={productSwitch} status={status} utilities={utilities} />{mobileNavigation}{children}</DesignSystemProvider>
}

export function StatusBadge({ children }: { children: ReactNode }) { return <span className="ds-status-badge">{children}</span> }
export function Badge({ children, variant = 'neutral' }: { children: ReactNode; variant?: 'neutral' | 'emerald' | 'amber' | 'rose' | 'cyan' }) { return <span className={cn('ds-badge', `ds-badge-${variant}`)}>{children}</span> }
export function Button({ className, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) { return <button className={cn('ds-button', `ds-button-${variant}`, className)} {...props} /> }
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input className={cn('ds-input', props.className)} {...props} /> }
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select className={cn('ds-select', props.className)} {...props} /> }
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={cn('ds-textarea', props.className)} {...props} /> }
