import type { Locale } from '@/lib/observatory-i18n'
import { cn } from '@/lib/utils'
import { DECISION_WORKFLOW_COPY } from '@/product/experience'

type Props = { locale: Locale; tone?: 'dark' | 'light'; compact?: boolean; className?: string }

const workflowAriaLabel: Record<Locale, string> = {
  en: 'QDIP decision workflow',
  uk: 'Процес прийняття рішення QDIP',
  pl: 'Proces decyzyjny QDIP',
}

export function DecisionWorkflow({ locale, compact = false, className }: Props) {
  return (
    <ol aria-label={workflowAriaLabel[locale]} className={cn('ds-workflow', compact && 'ds-workflow-compact', className)}>
      {DECISION_WORKFLOW_COPY[locale].map((step, index) => (
        <li key={step.id} className="ds-workflow-step">
          <div className="ds-workflow-index">0{index + 1}</div>
          <strong>{step.label}</strong>
          <span>{step.detail}</span>
        </li>
      ))}
    </ol>
  )
}
