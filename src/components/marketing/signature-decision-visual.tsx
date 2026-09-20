import type { CSSProperties } from "react";
import { ArrowDown,ArrowRight } from "lucide-react";
import styles from "./signature-decision-visual.module.css";

type IndexedStyle=CSSProperties&{"--i":number};
export function SignatureDecisionVisual({labels}:{labels:readonly string[]}){
 return <figure className={styles.visual} aria-label={labels.join(" → ")}>
  <div className={styles.inputs}>{labels.slice(0,4).map((label,index)=><span style={{"--i":index} as IndexedStyle} key={label}>{label}</span>)}</div>
  <ArrowRight className={styles.arrow} aria-hidden="true" size={20}/>
  <div className={styles.engine}>QDIP<small>{labels[4]}</small></div>
  <ArrowRight className={styles.arrow} aria-hidden="true" size={20}/>
  <div className={styles.result}><strong>{labels[5]}</strong><span>{labels[6]}</span></div>
  <ArrowRight className={styles.arrow} aria-hidden="true" size={20}/>
  <div className={styles.human}>{labels[7]}<ArrowDown aria-hidden="true" size={14}/></div>
 </figure>;
}
