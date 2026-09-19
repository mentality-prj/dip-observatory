import Image from "next/image";
import styles from "./qdip-site.module.css";

export function QdipLogo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span
      aria-label="QDIP"
      className={styles.logo}
      data-inverse={inverse || undefined}
      role="img"
      style={{ overflow: "hidden" }}
    >
      <Image
        alt=""
        aria-hidden="true"
        className={styles.logoWordmark}
        height={157}
        priority
        sizes="(max-width: 760px) 180px, 180px"
        src="/qdip-logo.png"
        style={{ clipPath: "inset(0 10%)", marginInline: "-10%" }}
        width={300}
      />
    </span>
  );
}
