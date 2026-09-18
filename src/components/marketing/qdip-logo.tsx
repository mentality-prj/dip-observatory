import Image from "next/image";
import styles from "./qdip-site.module.css";

export function QdipLogo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span aria-label="QDIP" className={styles.logo} data-inverse={inverse || undefined} role="img">
      <Image
        alt=""
        aria-hidden="true"
        className={styles.logoWordmark}
        height={157}
        priority
        src="/qdip-logo.jpg"
        width={300}
      />
    </span>
  );
}
