import Link from "next/link";
import type { ReactNode } from "react";
import "@/studio/studio.css";
import { observatoryHref, studioHref } from "@/lib/platform-urls";

export const metadata = { title: "qdip Studio" };

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <div className="studio-shell">
    <aside className="studio-sidebar"><Link className="studio-brand" href={studioHref()}>qdip <span>Decision Studio</span></Link>
      <p>Define how decisions are evaluated.</p>
      <nav aria-label="Decision Studio">
        <Link href={studioHref("profiles")}>Decision Profiles</Link>
        <div className="studio-nav-group" role="group" aria-label="Plugin Registry">
          <strong>Plugin Registry</strong>
          <Link href={studioHref("plugins")}>Plugins &amp; Capabilities</Link>
          <Link href={studioHref("bindings")}>Output Bindings</Link>
        </div>
        <Link href={studioHref("dimensions")}>Dimension Registry</Link>
      </nav>
      <Link className="studio-observatory-link" href={observatoryHref("decisions")}>Open Observatory ↗</Link>
    </aside>
    <main className="studio-main">{children}</main>
  </div>;
}
