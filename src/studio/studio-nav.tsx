"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { studioHref } from "@/lib/platform-urls";

function isActive(pathname: string, section: string) {
  const cleanPath = pathname.replace(/^\/studio/, "") || "/";
  return cleanPath === `/${section}` || cleanPath.startsWith(`/${section}/`);
}

function StudioLink({ index, label, section }: { index: string; label: string; section: string }) {
  const pathname = usePathname();
  return (
    <Link aria-current={isActive(pathname, section) ? "page" : undefined} href={studioHref(section)}>
      <i>{index}</i><span>{label}</span>
    </Link>
  );
}

export function StudioNav() {
  return (
    <nav aria-label="Decision Studio">
      <span className="studio-nav-label">DESIGN</span>
      <StudioLink index="01" label="Decision Profiles" section="profiles" />
      <span className="studio-nav-label">REGISTRIES</span>
      <div className="studio-nav-group" role="group" aria-label="Plugin Registry">
        <strong>Plugin Registry</strong>
        <StudioLink index="02" label="Plugins & Capabilities" section="plugins" />
        <StudioLink index="03" label="Output Bindings" section="bindings" />
      </div>
      <StudioLink index="04" label="Dimension Registry" section="dimensions" />
    </nav>
  );
}
