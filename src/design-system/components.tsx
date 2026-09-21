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
      <ProductLockup href={href} product={product}/>
      {navigation ? <div className="ds-product-header-center">{navigation}</div> : <div className="ds-product-header-spacer"/>}
      <div className="ds-product-header-actions">{status}{utilities}<ProductSwitchLink {...productSwitch}/></div>
    </div>
  </header>;
}

export function ProductShell({ header, mobileNavigation, children, className }: { header: ReactNode; mobileNavigation?: ReactNode; children: ReactNode; className?: string }) {
  return <div className={cn("ds-app-shell", className)}>{header}{mobileNavigation ? <div className="ds-product-mobile-navigation">{mobileNavigation}</div> : null}{children}</div>;
}
