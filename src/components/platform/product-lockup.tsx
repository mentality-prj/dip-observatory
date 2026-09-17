import Link from "next/link";

import { cn } from "@/lib/utils";

type ProductLockupProps = {
  href: string;
  product: "Studio" | "Observatory";
  className?: string;
  onClick?: () => void;
};

export function ProductLockup({
  href,
  product,
  className,
  onClick,
}: ProductLockupProps) {
  return (
    <Link
      aria-label={`QDIP ${product} home`}
      className={cn("product-lockup", className)}
      href={href}
      onClick={onClick}
    >
      <strong style={product === "Studio" ? { fontWeight: 650 } : undefined}>QDIP</strong>
      <span style={product === "Studio" ? { fontWeight: 500 } : undefined}>.{product}</span>
    </Link>
  );
}
