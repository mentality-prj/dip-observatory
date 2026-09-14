import Link from "next/link";
import type { ReactNode } from "react";
import "@/studio/studio.css";

export const metadata = { title: "DIP Decision Studio" };

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <div className="studio-shell">
    <aside className="studio-sidebar"><Link className="studio-brand" href="/studio">DIP <span>Decision Studio</span></Link>
      <p>Define how decisions are evaluated.</p>
      <nav aria-label="Decision Studio">
        <Link href="/studio/profiles">Decision profiles</Link>
        <Link href="/studio/plugins">Plugins & capabilities</Link>
        <Link href="/studio/dimensions">Dimension registry</Link>
        <Link href="/studio/bindings">Output bindings</Link>
        <Link href="/studio/constraints">Constraints</Link>
        <Link href="/studio/policies">Policies</Link>
        <Link href="/studio/compliance">Compliance</Link>
      </nav>
      <Link className="studio-observatory-link" href="/observatory/decisions">Open Observatory ↗</Link>
    </aside>
    <main className="studio-main">{children}</main>
  </div>;
}
