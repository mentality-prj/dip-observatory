import Link from "next/link";
import type { ReactNode } from "react";
import "@/studio/studio.css";
import { QdipLogo } from "@/components/marketing/qdip-logo";
import { marketingHref, observatoryHref } from "@/lib/platform-urls";
import { StudioNav } from "@/studio/studio-nav";

export const metadata = { title: "qdip Studio" };

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <div className="studio-shell">
    <aside className="studio-sidebar">
      <div className="studio-brand-lockup">
        <Link aria-label="qdip home" className="studio-brand" href={marketingHref("en")}><QdipLogo inverse /></Link>
        <span>studio</span>
      </div>
      <div className="studio-sidebar-intro">
        <small>DECISION SYSTEM WORKSPACE</small>
        <p>Design how governed decisions are evaluated, explained and reproduced.</p>
      </div>
      <StudioNav />
      <div className="studio-sidebar-footer">
        <Link className="studio-observatory-link" href={observatoryHref("decisions")}>Open Observatory <span>↗</span></Link>
        <small>qdip decision intelligence</small>
      </div>
    </aside>
    <div className="studio-workspace">
      <header className="studio-topbar">
        <div><span>qdip</span><b>/</b><strong>studio</strong></div>
        <div className="studio-engine-status"><i /> Engine connected</div>
      </header>
      <main className="studio-main">{children}</main>
    </div>
  </div>;
}
