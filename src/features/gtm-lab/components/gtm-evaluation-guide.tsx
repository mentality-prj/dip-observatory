import type { Locale } from '@/lib/observatory-i18n'
import { gtmLabI18n } from '../i18n'

export function GtmEvaluationGuide({ locale }: { locale: Locale }) {
  const t = gtmLabI18n[locale].onboarding
  const metrics = [
    [t.metricOpportunity, t.metricOpportunityDescription],
    [t.metricUncertainty, t.metricUncertaintyDescription],
    [t.metricEvidence, t.metricEvidenceDescription],
    [t.metricConfidence, t.metricConfidenceDescription],
    [t.metricFit, t.metricFitDescription],
  ]
  const template = [
    'name,domain,country,industry,employee_count,revenue_eur,description',
    'Acme Logistics,acme.example,PL,logistics,120,,Manual resource allocation and capacity scheduling across depots',
    'Beta Manufacturing,beta.example,PL,manufacturing,260,,Production planning relies on spreadsheets and manual staffing decisions',
  ].join('\n')
  const href = `data:text/csv;charset=utf-8,${encodeURIComponent(template)}`

  return (
    <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <div className="border border-white/10 bg-white/[.03] p-5 md:p-6">
        <h2 className="text-lg font-medium">{t.howTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{t.howDescription}</p>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {metrics.map(([name, description]) => (
            <div key={name} className="border-t border-white/10 pt-3">
              <dt className="text-sm font-semibold text-slate-200">{name}</dt>
              <dd className="mt-1 text-xs leading-5 text-slate-500">{description}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="border border-white/10 bg-white/[.03] p-5 md:p-6">
        <h2 className="text-lg font-medium">{t.csvTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{t.csvDescription}</p>
        <p className="mt-4 text-xs leading-5 text-slate-500">{t.templateColumns}</p>
        <a href={href} download="gtm-lab-template.csv" className="mt-4 inline-block border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/[.05]">
          {t.downloadTemplate}
        </a>
      </div>
    </section>
  )
}
