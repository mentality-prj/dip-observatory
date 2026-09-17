import styles from "./qdip-site.module.css";

export function QdipLogo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={styles.logo} data-inverse={inverse || undefined}>
      <span aria-hidden="true" className={styles.logoMark}>
        <i />
        <i />
        <i />
      </span>
      <span>QDIP</span>
    </span>
  );
}
