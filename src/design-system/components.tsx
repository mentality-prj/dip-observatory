import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DesignTheme = "green" | "cyan" | "emerald" | "amber" | "burgundy" | "rose" | "violet";
export type DesignMode = "dark" | "light";
export type ProductName = "Studio" | "Observatory";
export type ProductSwitch = { href: string; label: string };

export function DesignSystemProvider({ theme, mode = "dark", children, className }: { theme: DesignTheme; mode?: DesignMode; children: ReactNode; className?: string }) {
  return <div data-ds-theme={theme} data-ds-mode={mode} className={className}>{children}</div>;
}

export function ProductLockup({ href, product, className, onClick }: { href: string; product: ProductName; className?: string; onClick?: () => void }) {
  return <Link aria-label={`QDIP ${product} home`} className={cn("ds-product-lockup", className)} href={href} onClick={onClick}>
    <span className="ds-product-lockup-brand">QDIP</span><span className="ds-product-lockup-product">.{product}</span>
  </Link>;
}

export function ProductSwitchLink({ href, label }: ProductSwitch) {
  return <Link className="ds-product-switch-link" href={href}>{label} <span aria-hidden>↗</span></Link>;
}

export function ProductHeader({ href, product, navigation, productSwitch, status, utilities, className }: {
  href: string;
  product: ProductName;
  navigation?: ReactNode;
  productSwitch: ProductSwitch;
  status?: ReactNode;
  utilities?: ReactNode;
  className?: string;
}) {
  return <header className={cn("ds-product-header", className)}>
    <div className="ds-product-header-inner">
      <ProductLockup href={href} product={product} />
      {navigation ? <div className="ds-product-header-center">{navigation}</div> : <div className="ds-product-header-spacer" />}
      <div className="ds-product-header-actions">
        {status}
        <ProductSwitchLink {...productSwitch} />
        {utilities}
      </div>
    </div>
  </header>;
}

export function ProductShell({ theme, mode = "dark", className, href, product, navigation, mobileNavigation, productSwitch, status, utilities, children }: {
  theme: DesignTheme;
  mode?: DesignMode;
  className?: string;
  href: string;
  product: ProductName;
  navigation?: ReactNode;
  mobileNavigation?: ReactNode;
  productSwitch: ProductSwitch;
  status?: ReactNode;
  utilities?: ReactNode;
  children: ReactNode;
}) {
  return <DesignSystemProvider theme={theme} mode={mode} className={className}>
    <ProductHeader href={href} product={product} navigation={navigation} productSwitch={productSwitch} status={status} utilities={utilities} />
    {mobileNavigation ? <div className="ds-product-mobile-navigation">{mobileNavigation}</div> : null}
    {children}
  </DesignSystemProvider>;
}

export function Surface({ as: Tag = "section", className, children }: { as?: "section" | "article" | "div"; className?: string; children: ReactNode }) {
  return <Tag className={cn("ds-surface", className)}>{children}</Tag>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return <div className="ds-page-header">
    <div>{eyebrow ? <div className="ds-page-eyebrow">{eyebrow}</div> : null}<h1 className="ds-h1">{title}</h1>{description ? <p className="ds-page-description">{description}</p> : null}</div>
    {actions ? <div className="ds-page-actions">{actions}</div> : null}
  </div>;
}

export function StatusBadge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("ds-status-badge", className)}>{children}</span>;
}
