import Link from "next/link";
import type { ReactNode } from "react";
import "@/studio/studio.css";
import { QdipLogo } from "@/components/marketing/qdip-logo";
import { marketingHref, observatoryHref, studioHref } from "@/lib/platform-urls";

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
      <nav aria-label="Decision Studio">
        <span className="studio-nav-label">DESIGN</span>
        <Link href={studioHref("profiles")}><i>01</i><span>Decision Profiles</span></Link>
        <span className="studio-nav-label">REGISTRIES</span>
        <div className="studio-nav-group" role="group" aria-label="Plugin Registry">
          <strong>Plugin Registry</strong>
          <Link href={studioHref("plugins")}><i>02</i><span>Plugins &amp; Capabilities</span></Link>
          <Link href={studioHref("bindings")}><i>03</i><span>Output Bindings</span></Link>
        </div>
        <Link href={studioHref("dimensions")}><i>04</i><span>Dimension Registry</span></Link>
      </nav>
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
