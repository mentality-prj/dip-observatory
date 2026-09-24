'use client'

import { Card, CardContent } from '@/design-system'
import type { Audit } from './contracts'
import { studioCopy } from './studio-copy'
import { useStudioLocale } from './use-studio-locale'

export function StudioUseCasePanel({ audit }: { audit: Audit }) {
  const copy = studioCopy(useStudioLocale()).genericPanel
  return (
    <Card>
      <CardContent>
        <div className="studio-table-wrap">
          <table className="studio-table">
            <thead><tr><th>{copy.alternative}</th><th>{copy.feasible}</th><th>{copy.score}</th><th>{copy.rank}</th><th>{copy.requiredActions}</th></tr></thead>
            <tbody>{audit.dimension_results.map((alternative) => (
              <tr key={alternative.alternative_id}>
                <td>{alternative.alternative_id}</td><td>{alternative.feasible ? copy.yes : copy.no}</td><td>{alternative.score?.toFixed(4) ?? '—'}</td><td>{alternative.rank ?? '—'}</td><td>{alternative.dimensions.flatMap((dimension) => dimension.required_actions).join(', ') || '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
