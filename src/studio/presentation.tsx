import { Card, CardContent, CardHeader, CardTitle } from '@/design-system'
import type { ProfileDimension } from './contracts'
import { StudioBreadcrumbs } from './studio-breadcrumbs'
import { studioCopy } from './studio-copy'
import type { StudioLocale } from './studio-locale'

export const profileSections = [
  'overview',
  'alternatives',
  'dimensions',
  'constraints',
  'policies',
  'compliance',
] as const
export type ProfileSection = (typeof profileSections)[number]

export const sectionLabel = (value: string, locale: StudioLocale = 'en') => {
  const labels = studioCopy(locale).presentation.sections
  return labels[value as keyof typeof labels] ?? value.charAt(0).toUpperCase() + value.slice(1)
}

export const outputLabel = (capability: string, path: string) => `${capability}.${path.replace(/^result\./, '')}`

export function dimensionSource(item: ProfileDimension, locale: StudioLocale = 'en'): string {
  const config = item.configuration
  const c = studioCopy(locale).presentation
  if (['constraints', 'policy', 'compliance'].includes(item.dimension_id)) return c.businessConfigured
  if (Array.isArray(config.components)) return c.dipCalculated
  if (item.binding_id) return c.pluginSupplied
  if (typeof config.source_path === 'string' && /^(context|runtime)\./.test(config.source_path))
    return c.runtimeSupplied
  return c.businessConfigured
}

export const Breadcrumbs = StudioBreadcrumbs

const operators: Record<string, string> = { lt: '<', lte: '≤', gt: '>', gte: '≥', eq: '=', ne: '≠', in: 'in' }

function readable(value: unknown): string {
  return typeof value === 'string'
    ? value
        .replace(/^alternative\.attributes\./, '')
        .replace(/^context\./, 'runtime.')
        .replaceAll('_', ' ')
    : JSON.stringify(value)
}

export function RuleSummary({
  configuration,
  locale = 'en',
}: {
  configuration: Record<string, unknown>
  locale?: StudioLocale
}) {
  const c = studioCopy(locale).presentation
  const rules = Array.isArray(configuration.rules) ? (configuration.rules as Record<string, unknown>[]) : []
  return (
    <div className="studio-grid">
      {rules.map((rule, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>{sectionLabel(readable(rule.id ?? `${c.rule} ${index + 1}`), locale)}</CardTitle>
          </CardHeader>
          <CardContent>
            {rule.framework != null && (
              <p>
                {c.framework}: {String(rule.framework)}
              </p>
            )}
            <p>
              {readable(rule.path)} {operators[String(rule.operator)] ?? String(rule.operator)}{' '}
              {readable(rule.limit_path ?? rule.limit)}
            </p>
            {rule.action != null && (
              <p>
                {c.action}: {readable(rule.action)}
                {rule.required_action != null ? ` · ${readable(rule.required_action)}` : ''}
              </p>
            )}
            {rule.severity != null && (
              <p>
                {c.severity}: {readable(rule.severity)}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
      {configuration.budget != null && (
        <Card>
          <CardHeader>
            <CardTitle>{c.budgetConstraint}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{c.budgetHelp}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
