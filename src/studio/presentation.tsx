import { Card, CardContent, CardHeader, CardTitle } from '@/design-system'
import type { ProfileDimension } from './contracts'
import { StudioBreadcrumbs } from './studio-breadcrumbs'

export const profileSections = [
  'overview',
  'alternatives',
  'dimensions',
  'constraints',
  'policies',
  'compliance',
] as const
export type ProfileSection = (typeof profileSections)[number]
export const sectionLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
export const outputLabel = (capability: string, path: string) => `${capability}.${path.replace(/^result\./, '')}`

export function dimensionSource(item: ProfileDimension): string {
  const config = item.configuration
  if (['constraints', 'policy', 'compliance'].includes(item.dimension_id)) return 'Business configured'
  if (Array.isArray(config.components)) return 'DIP calculated'
  if (item.binding_id) return 'Plugin supplied'
  if (typeof config.source_path === 'string' && /^(context|runtime)\./.test(config.source_path))
    return 'Runtime supplied'
  return 'Business configured'
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
export function RuleSummary({ configuration }: { configuration: Record<string, unknown> }) {
  const rules = Array.isArray(configuration.rules) ? (configuration.rules as Record<string, unknown>[]) : []
  return (
    <div className="studio-grid">
      {rules.map((rule, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>{sectionLabel(readable(rule.id ?? `Rule ${index + 1}`))}</CardTitle>
          </CardHeader>
          <CardContent>
            {rule.framework != null && <p>Framework: {String(rule.framework)}</p>}
            <p>
              {readable(rule.path)} {operators[String(rule.operator)] ?? String(rule.operator)}{' '}
              {readable(rule.limit_path ?? rule.limit)}
            </p>
            {rule.action != null && (
              <p>
                Action: {readable(rule.action)}
                {rule.required_action != null ? ` · ${readable(rule.required_action)}` : ''}
              </p>
            )}
            {rule.severity != null && <p>Severity: {readable(rule.severity)}</p>}
          </CardContent>
        </Card>
      ))}
      {configuration.budget != null && (
        <Card>
          <CardHeader>
            <CardTitle>Budget constraint</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Calculated cost must stay within the configured budget.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
