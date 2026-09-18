import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ProductLockup } from "@/components/platform/product-lockup";
import { cn } from "@/lib/utils";

export type DesignTheme = "green" | "cyan" | "emerald" | "amber" | "rose" | "violet";
export type DesignMode = "dark" | "light";
export type ProductName = ComponentProps<typeof ProductLockup>["product"];

export function DesignSystemProvider({ theme, mode = "dark", children, className }: { theme: DesignTheme; mode?: DesignMode; children: ReactNode; className?: string }) {
  return <div data-ds-theme={theme} data-ds-mode={mode} className={className}>{children}</div>;
}

export function ProductHeader({ href, product, center, actions, className }: { href: string; product: ProductName; center?: ReactNode; actions?: ReactNode; className?: string }) {
  return <header className={cn("ds-product-header product-header", className)}>
    <div className="ds-product-header-inner product-header-inner">
      <ProductLockup href={href} product={product} />
      {center ? <div className="ds-product-header-center">{center}</div> : <div className="ds-product-header-spacer" />}
      {actions ? <div className="ds-product-header-actions">{actions}</div> : null}
    </div>
  </header>;
}

export function ProductSwitchLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} className={cn("ds-product-switch-link product-switch-link", props.className)} />;
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
