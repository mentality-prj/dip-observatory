import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type DesignTheme = 'green' | 'cyan' | 'emerald' | 'amber' | 'burgundy' | 'rose' | 'violet'
export type DesignMode = 'dark' | 'light'
export type ProductName = 'Studio' | 'Observatory'
export type ProductSwitch = { href: string; label: string; icon?: ReactNode }

export function DesignSystemProvider({ theme, mode = 'dark', children, className }: { theme: DesignTheme; mode?: DesignMode; children: ReactNode; className?: string }) { return <div data-ds-theme={theme} data-ds-mode={mode} className={className}>{children}</div> }

export function ProductLockup({ href, brandHref, product, className, onClick }: { href: string; brandHref?: string; product: ProductName; className?: string; onClick?: () => void }) {
  return <div className={cn('ds-product-lockup', className)} style={{ gap: 0 }}>
    <Link aria-label={`QDIP ${product} home`} className="ds-product-lockup-product" href={href} onClick={onClick} style={{ fontSize: '1.35rem', fontWeight: 400, lineHeight: 1 }}>{product}.</Link>
    <Link aria-label="QDIP home" className="ds-product-lockup-brand" href={brandHref ?? href} onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '-12px', transform: 'translateY(-2px)' }}>
      <span className="ds-product-lockup-wordmark-frame" aria-hidden="true" style={{ width: '124px', flex: '0 0 124px' }}>
        <Image alt="" className="ds-product-lockup-wordmark" height={157} priority sizes="156px" src="/qdip-logo.png" style={{ clipPath: 'inset(0 10%)', height: 'auto', marginInline: '-16px', width: '156px' }} width={300} />
      </span>
    </Link>
  </div>
}

export function ProductSwitchLink({ href, label, icon }: ProductSwitch) { return <Link className="ds-product-switch-link" href={href}>{icon ? <span className="ds-product-switch-icon" aria-hidden>{icon}</span> : null}<span>{label}</span></Link> }
export function ProductHeader({ href, brandHref, product, brandStatus, navigation, siteLink, productSwitch, status, utilities, className }: { href: string; brandHref?: string; product: ProductName; brandStatus?: ReactNode; navigation?: ReactNode; siteLink?: ProductSwitch; productSwitch?: ProductSwitch; status?: ReactNode; utilities?: ReactNode; className?: string }) {
  return <header className={cn('ds-product-header', className)}><div className="ds-product-header-inner"><div className="ds-product-header-brand"><ProductLockup href={href} brandHref={brandHref} product={product} />{brandStatus ? <div className="ds-product-header-brand-status">{brandStatus}</div> : null}</div>{navigation ? <div className="ds-product-header-center">{navigation}</div> : <div className="ds-product-header-spacer" />}<div className="ds-product-header-actions">{status}{siteLink ? <ProductSwitchLink {...siteLink} /> : null}{productSwitch ? <ProductSwitchLink {...productSwitch} /> : null}{utilities}</div></div></header>
}
export function ProductShell({ theme, mode = 'dark', className, href, brandHref, product, brandStatus, navigation, mobileNavigation, siteLink, productSwitch, status, utilities, children }: { theme: DesignTheme; mode?: DesignMode; className?: string; href: string; brandHref?: string; product: ProductName; brandStatus?: ReactNode; navigation?: ReactNode; mobileNavigation?: ReactNode; siteLink?: ProductSwitch; productSwitch: ProductSwitch; status?: ReactNode; utilities?: ReactNode; children: ReactNode }) { return <DesignSystemProvider theme={theme} mode={mode} className={className}><ProductHeader href={href} brandHref={brandHref} product={product} brandStatus={brandStatus} navigation={navigation} siteLink={siteLink} productSwitch={productSwitch} status={status} utilities={utilities} />{mobileNavigation ? <div className="ds-product-mobile-navigation">{mobileNavigation}</div> : null}{children}</DesignSystemProvider> }
export function Surface({ as: Tag = 'section', className, children }: { as?: 'section' | 'article' | 'div'; className?: string; children: ReactNode }) { return <Tag className={cn('ds-surface', className)}>{children}</Tag> }
export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode }) { return <div className="ds-page-header"><div>{eyebrow ? <div className="ds-page-eyebrow">{eyebrow}</div> : null}<h1 className="ds-h1">{title}</h1>{description ? <p className="ds-page-description">{description}</p> : null}</div>{actions ? <div className="ds-page-actions">{actions}</div> : null}</div> }
export function StatusBadge({ children, className }: { children: ReactNode; className?: string }) { return <span className={cn('ds-status-badge', className)}>{children}</span> }
