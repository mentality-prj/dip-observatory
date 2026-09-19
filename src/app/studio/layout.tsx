import type { ReactNode } from "react";
import "@/studio/studio.css";
import { DesignSystemProvider, ProductHeader, ProductSwitchLink, StatusBadge } from "@/design-system";
import { StudioNav } from "@/features/studio";
import { marketingHref, observatoryHref } from "@/lib/platform-urls";

export const metadata = { title: "QDIP Studio" };

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <DesignSystemProvider theme="green" mode="light" className="studio-shell">
    <ProductHeader
      href={marketingHref("en")}
      product="Studio"
      actions={<><StatusBadge><i /> Engine connected</StatusBadge><ProductSwitchLink href={observatoryHref()}>Open Observatory <span aria-hidden>↗</span></ProductSwitchLink></>}
    />
    <aside className="studio-sidebar">
      <div className="studio-sidebar-intro"><small>DECISION SYSTEM WORKSPACE</small><p>Design how governed decisions are evaluated, explained and reproduced.</p></div>
      <StudioNav />
      <div className="studio-sidebar-footer"><small>QDIP decision intelligence</small></div>
    </aside>
    <div className="studio-workspace"><main className="studio-main" id="main-content" tabIndex={-1}>{children}</main></div>
  </DesignSystemProvider>;
}
