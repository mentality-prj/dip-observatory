"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  getProductionSchedulingCopy,
  type ProductionSchedulingCopy,
} from "@/production-scheduling/lib/production-scheduling-i18n";
import type { Locale } from "@/lib/observatory-i18n";

const ProductionSchedulingCopyContext = createContext<ProductionSchedulingCopy>(
  getProductionSchedulingCopy("en"),
);

export function ProductionSchedulingCopyProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <ProductionSchedulingCopyContext.Provider value={getProductionSchedulingCopy(locale)}>
      {children}
    </ProductionSchedulingCopyContext.Provider>
  );
}

export function useProductionSchedulingCopy() {
  return useContext(ProductionSchedulingCopyContext);
}
