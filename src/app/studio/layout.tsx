import Link from "next/link";
import type { ReactNode } from "react";
import "@/studio/studio.css";

export const metadata = { title: "DIP Decision Studio" };

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <div className="studio-shell">
    <aside className="studio-sidebar"><Link className="studio-brand" href="/studio">DIP <span>Decision Studio</span></Link>
      <p>Define how decisions are evaluated.</p>
      <nav aria-label="Decision Studio">
        <Link href="/studio/profiles">Decision Profiles</Link>
        <div className="studio-nav-group" role="group" aria-label="Plugin Registry">
          <strong>Plugin Registry</strong>
          <Link href="/studio/plugins">Plugins &amp; Capabilities</Link>
          <Link href="/studio/bindings">Output Bindings</Link>
        </div>
        <Link href="/studio/dimensions">Dimension Registry</Link>
      </nav>
      <Link className="studio-observatory-link" href="/observatory/decisions">Open Observatory ↗</Link>
    </aside>
    <main className="studio-main">{children}</main>
  </div>;
}
