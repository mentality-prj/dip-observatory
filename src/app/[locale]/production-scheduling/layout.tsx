import type { ReactNode } from "react";
import { PrototypeRouteLayout } from "@/features/observatory";

export default function ProductionSchedulingLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  return <PrototypeRouteLayout params={params} theme="cyan">{children}</PrototypeRouteLayout>;
}
