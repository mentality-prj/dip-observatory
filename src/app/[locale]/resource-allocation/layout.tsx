import type { ReactNode } from "react";
import { PrototypeRouteLayout } from "@/components/observatory/prototype-route-layout";

export default function ResourceAllocationLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  return <PrototypeRouteLayout params={params} theme="rose">{children}</PrototypeRouteLayout>;
}
