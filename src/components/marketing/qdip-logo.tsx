import Image from "next/image";
import styles from "./qdip-site.module.css";
import logoStyles from "./qdip-logo.module.css";

export function QdipLogo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`${styles.logo} ${logoStyles.brand}`} data-inverse={inverse || undefined}>
      <Image alt="QDIP" className={styles.logoWordmark} height={157} priority sizes="(max-width: 760px) 180px, 180px" src="/qdip-logo.png" style={{ clipPath: "inset(0 10%)", marginInline: "-10%" }} width={300} />
      <span className={logoStyles.tagline} data-locale="en">Decision Engine for consistent, explainable decisions.</span>
      <span className={logoStyles.tagline} data-locale="uk">Рушій прийняття рішень для послідовних і зрозуміло обґрунтованих рішень.</span>
      <span className={logoStyles.tagline} data-locale="pl">Silnik decyzyjny do spójnych i zrozumiale uzasadnionych decyzji.</span>
    </span>
  );
}
