"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import type { MarketingLocale } from "./qdip-copy";
import styles from "./decision-space.module.css";

const copy={
 en:{inputs:["Context","Priorities","Constraints","Uncertainty"],options:["Option A","Option B","Option C"],states:["Higher cost","Best fit","Constraint conflict"],recommended:"Recommended",why:"Why B?",reasons:["fits active constraints","balances priorities","trade-offs remain visible"],human:"Human decision"},
 uk:{inputs:["Контекст","Пріоритети","Обмеження","Невизначеність"],options:["Варіант A","Варіант B","Варіант C"],states:["Вищі витрати","Найкраща відповідність","Конфлікт з обмеженням"],recommended:"Рекомендовано",why:"Чому B?",reasons:["відповідає чинним обмеженням","збалансовує пріоритети","компроміси залишаються видимими"],human:"Рішення людини"},
 pl:{inputs:["Kontekst","Priorytety","Ograniczenia","Niepewność"],options:["Opcja A","Opcja B","Opcja C"],states:["Wyższy koszt","Najlepsze dopasowanie","Konflikt z ograniczeniem"],recommended:"Rekomendowana",why:"Dlaczego B?",reasons:["spełnia aktywne ograniczenia","równoważy priorytety","kompromisy pozostają widoczne"],human:"Decyzja człowieka"}
} as const;

const FINAL_PHASE = 4;
const PHASE_COUNT = 5;
const PHASE_INTERVAL_MS = 1800;

function prefersReducedMotion() {
 return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function DecisionSpace({locale}:{locale:MarketingLocale}){
 const c=copy[locale];
 const [phase,setPhase]=useState(prefersReducedMotion() ? FINAL_PHASE : 0);

 useEffect(()=>{
   if(prefersReducedMotion()) return;
   const id=window.setInterval(()=>setPhase(p=>(p+1)%PHASE_COUNT),PHASE_INTERVAL_MS);
   return()=>window.clearInterval(id);
 },[]);

 return <div className={styles.space} data-phase={phase} aria-label={`${c.inputs.join(", ")} → QDIP → ${c.recommended} ${c.options[1]} → ${c.human}`}>
   <div className={styles.orbit} aria-hidden="true"/><div className={styles.inputs}>{c.inputs.map((x,i)=><span key={x} style={{"--i":i} as React.CSSProperties}>{x}</span>)}</div>
   <div className={styles.engine}><strong>QDIP</strong><small>Decision Engine</small><i/></div>
   <div className={styles.options}>{c.options.map((x,i)=><div key={x} className={i===1?styles.best:i===2?styles.blocked:""}><b>{i===1&&<Check size={13}/>} {i===2&&<X size={13}/>} {x}</b><small>{c.states[i]}</small>{i===1&&<em>{c.recommended}</em>}</div>)}</div>
   <div className={styles.explain}><strong>{c.why}</strong>{c.reasons.map(x=><span key={x}><Check size={12}/>{x}</span>)}</div>
   <div className={styles.human}>{c.human}</div>
 </div>
}
