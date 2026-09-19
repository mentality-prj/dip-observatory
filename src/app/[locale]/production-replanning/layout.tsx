import type { ReactNode } from "react";
import { PrototypeRouteLayout } from "@/features/observatory";

export default function ProductionReplanningLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  return <PrototypeRouteLayout params={params} theme="amber">{children}</PrototypeRouteLayout>;
}
