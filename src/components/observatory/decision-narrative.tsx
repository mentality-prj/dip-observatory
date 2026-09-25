import type { Locale } from '@/lib/observatory-i18n'
import type { DipUseCase } from '@/use-cases/registry'
import { decisionPatternLabel } from '@/product/experience'
import { observatoryDecisionNarrativeI18n } from '@/lib/product-i18n'

export function ObservatoryDecisionNarrative({ locale, useCase }: { locale: Locale; useCase: DipUseCase }) {
  const t = observatoryDecisionNarrativeI18n[locale]
  return (
    <section className="mx-auto w-full max-w-[1540px] px-4 pt-5 sm:px-5 md:px-8 lg:px-10" aria-label={t.ariaLabel}>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">
            {decisionPatternLabel(useCase.decisionPattern, locale)} · {useCase.tag[locale]}
          </span>
          <p className="mt-1 text-xs text-slate-500">{t.helper}</p>
        </div>
      </div>
      <ol className="grid grid-cols-2 gap-x-4 gap-y-2 py-4 text-xs text-slate-500 sm:grid-cols-4 xl:grid-cols-7">
        {t.labels.map((label, index) => (
          <li
            key={label}
            className={`relative border-t pt-3 ${index === 4 ? 'border-[var(--ds-semantic-selected)] text-[var(--ds-semantic-selected)]' : index === 3 ? 'border-[var(--ds-semantic-uncertainty)] text-[var(--ds-semantic-uncertainty)]' : 'border-white/10'}`}
          >
            <span
              aria-hidden
              className={`absolute -top-1.5 left-0 h-3 w-3 rounded-full border-2 border-slate-950 ${
                index === 4
                  ? 'bg-[var(--ds-semantic-selected)]'
                  : index === 3
                    ? 'bg-[var(--ds-semantic-uncertainty)]'
                    : 'bg-slate-600'
              }`}
            />
            <span className="mr-2 text-[10px] opacity-70">0{index + 1}</span>
            <strong className="font-medium">{label}</strong>
          </li>
        ))}
      </ol>
    </section>
  )
}
