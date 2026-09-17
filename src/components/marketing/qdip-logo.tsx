import styles from "./qdip-site.module.css";

export function QdipLogo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={styles.logo} data-inverse={inverse || undefined}>
      <svg
        aria-hidden="true"
        className={styles.logoGlyph}
        viewBox="0 0 40 40"
      >
        <circle className={styles.logoOrbit} cx="18" cy="18" r="12.5" />
        <path className={styles.logoTail} d="M26.8 26.8 35 35" />
        <path className={styles.logoBranch} d="m11.5 21.5 6-7 7 6" />
        <circle className={styles.logoNode} cx="11.5" cy="21.5" r="2.1" />
        <circle className={`${styles.logoNode} ${styles.logoNodePrimary}`} cx="17.5" cy="14.5" r="2.1" />
        <circle className={styles.logoNode} cx="24.5" cy="20.5" r="2.1" />
      </svg>
      <span>QDIP</span>
    </span>
  );
}
