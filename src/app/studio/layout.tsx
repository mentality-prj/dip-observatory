import Link from "next/link";
import type { ReactNode } from "react";
import "@/studio/studio.css";
import { marketingHref, observatoryHref } from "@/lib/platform-urls";
import { StudioNav } from "@/studio/studio-nav";

export const metadata = { title: "QDIP Studio" };

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <div className="studio-shell">
    <aside className="studio-sidebar">
      <div className="studio-brand-lockup">
        <Link aria-label="QDIP home" className="studio-brand" href={marketingHref("en")}><strong>QDIP</strong><span>.Studio</span></Link>
      </div>
      <div className="studio-sidebar-intro">
        <small>DECISION SYSTEM WORKSPACE</small>
        <p>Design how governed decisions are evaluated, explained and reproduced.</p>
      </div>
      <StudioNav />
      <div className="studio-sidebar-footer">
        <Link className="studio-observatory-link" href={observatoryHref("decisions")}>Open Observatory <span>↗</span></Link>
        <small>QDIP decision intelligence</small>
      </div>
    </aside>
    <div className="studio-workspace">
      <header className="studio-topbar">
        <div><span>QDIP</span><b>/</b><strong>Studio</strong></div>
        <div className="studio-engine-status"><i /> Engine connected</div>
      </header>
      <main className="studio-main">{children}</main>
    </div>
  </div>;
}
