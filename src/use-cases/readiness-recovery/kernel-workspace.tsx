'use client'

import type { Locale } from '@/lib/observatory-i18n'
import { RRProductionOperatorPanel } from './production-operator-panel'
import { KernelReferencePreview } from './kernel-reference-preview'

const labels = {
  en: {
    title: 'Readiness Recovery',
    description:
      'QDIP Kernel is the only decision authority for RR scheduling. Use the authenticated reference operator to create executions, review history and replan. The former asset/capability Monte Carlo planner has a different data and mathematical contract and is not offered as an alternative solver here.',
    warning:
      'Zitadel authentication enabled. RR deployment and multi-tenant authorization remain subject to separate qualification.',
  },
  uk: {
    title: 'Відновлення готовності',
    description:
      'QDIP Kernel — єдине джерело рішень для планування ремонтних робіт RR. Авторизований оператор створює виконання, переглядає історію та переплановує. Попередня Monte Carlo-модель активів і спроможностей має інший контракт і не використовується як альтернативний solver.',
    warning: 'Авторизація через Zitadel. Кваліфікацію RR та багатокористувацький доступ ще не завершено.',
  },
  pl: {
    title: 'Odtwarzanie gotowości',
    description:
      'QDIP Kernel jest jedynym źródłem decyzji dla harmonogramu RR. Uprawniony operator tworzy wykonania, sprawdza historię i planuje ponownie. Poprzedni model Monte Carlo ma inny kontrakt i nie jest alternatywnym solverem.',
    warning: 'Logowanie przez Zitadel. Kwalifikacja RR i dostęp wieloorganizacyjny wymagają osobnej weryfikacji.',
  },
} as const

export function ReadinessRecoveryKernelWorkspace({ locale }: { locale: Locale }) {
  const copy = labels[locale]
  return (
    <main
      className="mx-auto w-full max-w-[1540px] px-4 pb-16 pt-8 sm:px-5 md:px-8 lg:px-10"
      data-testid="rr-kernel-only-workspace"
    >
      <h1 className="text-3xl font-semibold text-slate-100">{copy.title}</h1>
      <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">{copy.description}</p>
      <p className="mt-2 text-xs text-amber-200">{copy.warning}</p>
      <KernelReferencePreview locale={locale} />
      <RRProductionOperatorPanel locale={locale} />
    </main>
  )
}
