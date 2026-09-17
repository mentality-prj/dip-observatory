import styles from "./qdip-site.module.css";

export function QdipLogo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span aria-label="qdip" className={styles.logo} data-inverse={inverse || undefined} role="img">
      <svg aria-hidden="true" className={styles.logoWordmark} viewBox="0 0 112 48">
        <g className={styles.wordmarkStroke}>
          <circle cx="14" cy="22" r="9" />
          <path d="M22 22v19" />
          <circle cx="43" cy="22" r="9" />
          <path d="M51 22V5" />
          <path d="M68 16v15" />
          <path d="M84 41V22" />
          <path d="M84 22a9 9 0 1 1 9 9h-9" />
        </g>
        <circle className={styles.wordmarkDot} cx="68" cy="7" r="3" />
      </svg>
    </span>
  );
}
