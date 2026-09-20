"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, CircleSlash2 } from "lucide-react";
import { observatoryHref } from "@/lib/platform-urls";
import type { MarketingLocale } from "./qdip-copy";
import styles from "./decision-patterns.module.css";

type Pattern = "allocate" | "decide" | "prioritize";
type Props = { locale: MarketingLocale; cases: readonly string[] };

const labels = {
  en: {
    input: ["Needs", "Resources", "Priorities", "Constraints"],
    decide: ["Current state", "Actions", "Expected effects", "Uncertainty"],
    prioritize: ["Opportunities", "Objectives", "Costs", "Evidence"],
    output: ["Recommended allocation", "Recommended action", "Recommended priority"],
    why: "Why this recommendation?",
    reason: ["Fits the active constraints", "Balances the configured priorities", "Keeps the trade-offs visible"],
    unavailable: "Coming soon",
  },
  uk: {
    input: ["Потреби", "Ресурси", "Пріоритети", "Обмеження"],
    decide: ["Поточний стан", "Дії", "Очікувані ефекти", "Невизначеність"],
    prioritize: ["Можливості", "Цілі", "Витрати", "Обґрунтування"],
    output: ["Рекомендований розподіл", "Рекомендована дія", "Рекомендований пріоритет"],
    why: "Чому ця рекомендація?",
    reason: ["Відповідає чинним обмеженням", "Ураховує задані пріоритети", "Показує компроміси між варіантами"],
    unavailable: "Незабаром",
  },
  pl: {
    input: ["Potrzeby", "Zasoby", "Priorytety", "Ograniczenia"],
    decide: ["Stan bieżący", "Działania", "Oczekiwane efekty", "Niepewność"],
    prioritize: ["Szanse", "Cele", "Koszty", "Uzasadnienie"],
    output: ["Rekomendowany przydział", "Rekomendowane działanie", "Rekomendowany priorytet"],
    why: "Dlaczego ta rekomendacja?",
    reason: ["Spełnia aktywne ograniczenia", "Uwzględnia skonfigurowane priorytety", "Pokazuje kompromisy między opcjami"],
    unavailable: "Wkrótce",
  },
} as const;

export function DecisionPatterns({ locale, cases: c }: Props) {
  const [active, setActive] = useState<Pattern>("allocate");
  const l = labels[locale];
  const observatoryLocale = locale === "uk" ? "en" : locale;
  const config = {
    allocate: { tab: c[1], title: c[2], question: c[3], body: c[4], inputs: l.input, output: l.output[0], href: observatoryHref(`${observatoryLocale}/resource-allocation`), cta: c[5] },
    decide: { tab: c[6], title: c[7], question: c[8], body: c[9], inputs: l.decide, output: l.output[1], href: observatoryHref(`${observatoryLocale}/gas-forecast`), cta: c[10] },
    prioritize: { tab: c[11], title: c[12], question: c[13], body: l.reason[1], inputs: l.prioritize, output: l.output[2], href: null, cta: l.unavailable },
  } satisfies Record<Pattern, { tab: string; title: string; question: string; body: string; inputs: readonly string[]; output: string; href: string | null; cta: string }>;
  const current = config[active];

  return <div className={styles.showcase}>
    <div className={styles.tabs} role="tablist" aria-label={c[0]}>
      {(Object.keys(config) as Pattern[]).map(key => <button key={key} type="button" role="tab" aria-selected={active === key} onClick={() => setActive(key)}>{config[key].tab}</button>)}
    </div>
    <div className={styles.stage} role="tabpanel">
      <div className={styles.context}><span className={styles.kicker}>{current.title}</span><h3>{current.question}</h3><p>{current.body}</p>{current.href ? <Link href={current.href}>{current.cta} <ArrowRight size={15}/></Link> : <span className={styles.coming}>{current.cta}</span>}</div>
      <div className={styles.engineFlow} aria-label={`${current.inputs.join(", ")} → QDIP → ${current.output}`}>
        <div className={styles.inputs}>{current.inputs.map(item => <span key={item}>{item}</span>)}</div>
        <ArrowRight className={styles.arrow} aria-hidden="true"/>
        <div className={styles.engine}>QDIP<small>Decision Engine</small></div>
        <ArrowRight className={styles.arrow} aria-hidden="true"/>
        <div className={styles.output}><strong>{current.output}</strong><span><Check size={14}/>{l.reason[0]}</span><span><Check size={14}/>{l.reason[1]}</span><span><CircleSlash2 size={14}/>{l.reason[2]}</span><small>{l.why}</small></div>
      </div>
    </div>
  </div>;
}
