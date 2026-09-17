import Link from "next/link";
import type { ReactNode } from "react";
import "@/studio/studio.css";
import "@/studio/readability.css";
import { ProductLockup } from "@/components/platform/product-lockup";
import { marketingHref, observatoryHref } from "@/lib/platform-urls";
import { StudioNav } from "@/studio/studio-nav";

export const metadata = { title: "QDIP Studio" };

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <div className="studio-shell">
    <header className="product-header studio-header">
      <div className="product-header-inner studio-header-inner">
        <ProductLockup href={marketingHref("en")} product="Studio" />
        <div className="hidden h-6 w-px shrink-0 bg-black/10 lg:block" />
        <div className="min-w-0 flex-1" />
        <div className="studio-header-actions">
          <div className="studio-engine-status"><i /> Engine connected</div>
          <Link className="product-switch-link studio-observatory-link" href={observatoryHref()}>Open Observatory <span>↗</span></Link>
        </div>
      </div>
    </header>
    <aside className="studio-sidebar">
      <div className="studio-sidebar-intro">
        <small>DECISION SYSTEM WORKSPACE</small>
        <p>Design how governed decisions are evaluated, explained and reproduced.</p>
      </div>
      <StudioNav />
      <div className="studio-sidebar-footer">
        <small>QDIP decision intelligence</small>
      </div>
    </aside>
    <div className="studio-workspace">
      <main className="studio-main" id="main-content" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}
