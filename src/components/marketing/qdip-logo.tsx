import Image from "next/image";
import styles from "./qdip-site.module.css";

export function QdipLogo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={styles.logo} data-inverse={inverse || undefined}>
      <Image
        alt="QDIP"
        className={styles.logoWordmark}
        height={157}
        priority
        sizes="(max-width: 760px) 180px, 180px"
        src="/qdip-logo.png"
        style={{ clipPath: "inset(0 10%)", marginInline: "-10%" }}
        width={300}
      />
      <span className={styles.logoTagline} data-locale="en">Decision Engine for repeatable, explainable decisions.</span>
      <span className={styles.logoTagline} data-locale="uk">Рушій прийняття рішень для повторюваних і пояснюваних рішень.</span>
      <span className={styles.logoTagline} data-locale="pl">Silnik decyzyjny dla powtarzalnych i wyjaśnialnych decyzji.</span>
    </span>
  );
}
