'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Table } from '@/design-system'
import { DecisionWorkflow } from '@/components/product/decision-workflow'
import { studioHref } from '@/lib/platform-urls'
import { studioRequest, type Dimension, type Plugin, type Profile, type ProfileView } from './contracts'
import { ProfileEditor } from './profile-editor'
import { ProfileRunner } from './profile-runner'
import { Breadcrumbs, dimensionSource, profileSections, sectionLabel, type ProfileSection } from './presentation'
import { studioCopy } from './studio-copy'
import { useStudioLocale } from './use-studio-locale'

export function ProfileDetail({ id, section }: { id: string; section: ProfileSection }) {
  const locale = useStudioLocale()
  const c = studioCopy(locale).detail
  const [data, setData] = useState<{ profile: ProfileView; dimensions: Dimension[]; plugins: Plugin[] } | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [retry, setRetry] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    let disposed = false
    Promise.all([
      studioRequest<ProfileView>(`decision-profiles/${encodeURIComponent(id)}`),
      studioRequest<Dimension[]>('dimensions'),
      studioRequest<Plugin[]>('decision-studio/plugins'),
    ])
      .then(([profile, dimensions, plugins]) => {
        if (!disposed) {
          setData({ profile, dimensions, plugins })
          setError('')
        }
      })
      .catch((reason) => {
        if (!disposed) setError(String(reason))
      })
    return () => {
      disposed = true
    }
  }, [id, retry])

  if (!data) {
    return (
      <>
        {error ? (
          <div role="alert">
            {error}{' '}
            <Button variant="secondary" type="button" onClick={() => setRetry(retry + 1)}>
              {c.retry}
            </Button>
          </div>
        ) : (
          <p role="status">{c.loading}</p>
        )}
        <Link href={studioHref('profiles', locale)}>{c.decisionProfiles}</Link>
      </>
    )
  }

  const { profile, dimensions, plugins } = data
  const plugin = plugins.find((p) => p.name === profile.plugin_id)
  const pluginName = plugin?.ui?.label ?? profile.plugin_id
  const base = studioHref(`profiles/${encodeURIComponent(id)}`, locale)
  const clean = Object.fromEntries(Object.entries(profile).filter(([key]) => key !== 'validation')) as Profile
  const sourceLabels = studioCopy(locale).presentation

  return (
    <>
      <Breadcrumbs
        items={[
          { label: c.decisionProfiles, href: studioHref('profiles', locale) },
          { label: profile.name, href: base },
          { label: sectionLabel(section, locale) },
        ]}
      />

      <div className="studio-title-row">
        <div>
          <h1>{profile.name}</h1>
          <p>
            {c.version} {profile.version}
          </p>
        </div>
        <Badge variant={profile.active ? 'emerald' : 'neutral'}>{profile.active ? c.active : c.draft}</Badge>
      </div>

      <DecisionWorkflow locale={locale} tone="light" compact />

      <nav aria-label={c.profileSections} className="studio-profile-nav">
        {profileSections.map((tab) => (
          <Link
            key={tab}
            aria-current={section === tab ? 'page' : undefined}
            href={tab === 'overview' ? base : `${base}/${tab}`}
          >
            {sectionLabel(tab, locale)}
          </Link>
        ))}
      </nav>

      {error && (
        <p role="alert" className="studio-error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="studio-success">
          {message}
        </p>
      )}
      {profile.validation.errors.map((validationError) => (
        <p key={validationError} className="studio-error">
          {validationError}
        </p>
      ))}

      {section === 'overview' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{c.overview}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl>
                <dt>{c.profile}</dt>
                <dd>{profile.name}</dd>
                <dt>ID</dt>
                <dd>{profile.id}</dd>
                <dt>{c.version}</dt>
                <dd>{profile.version}</dd>
                <dt>{c.status}</dt>
                <dd>{profile.active ? c.active : c.draft}</dd>
                <dt>{c.plugin}</dt>
                <dd>
                  {pluginName} @ {profile.plugin_version}
                </dd>
                <dt>{c.capability}</dt>
                <dd>
                  {profile.capability_id} @ {profile.capability_version}
                </dd>
              </dl>
              <h3>{c.executionModel}</h3>
              <p className="studio-flow">
                {pluginName} → {c.outputBindings} → {c.decisionDimensions} → {c.alternatives} → {c.decision}
              </p>
            </CardContent>
          </Card>

          <Button
            type="button"
            disabled={!profile.active || profile.validation.status !== 'VALID'}
            onClick={() => setRunning(!running)}
          >
            {c.evaluate}
          </Button>
          {running && <ProfileRunner profile={clean} />}
        </>
      )}

      {section === 'dimensions' && (
        <Card>
          <CardHeader>
            <CardTitle>{c.enabledDimensions}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <thead>
                <tr>
                  <th>{c.dimension}</th>
                  <th>{c.source}</th>
                  <th>{c.weight}</th>
                  <th>{c.required}</th>
                </tr>
              </thead>
              <tbody>
                {profile.dimensions.map((item) => {
                  const definition = dimensions.find((d) => d.id === item.dimension_id && d.version === item.version)
                  const source = dimensionSource(item, locale)
                  return (
                    <tr key={item.dimension_id}>
                      <td>{definition?.name ?? item.dimension_id}</td>
                      <td>
                        {source}
                        {source === sourceLabels.pluginSupplied
                          ? ` · ${pluginName}`
                          : source === sourceLabels.dipCalculated
                            ? ' · DIP evaluator'
                            : ''}
                      </td>
                      <td>{definition?.type === 'rules' ? '—' : item.weight}</td>
                      <td>{item.required ? c.yes : c.no}</td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      )}

      {section === 'constraints' && (
        <>
          <h2>{c.constraints}</h2>
          <p>{c.constraintsHelp}</p>
        </>
      )}

      {section === 'policies' && (
        <>
          <h2>{c.policies}</h2>
          <p>{c.policiesHelp}</p>
        </>
      )}

      {section === 'compliance' && (
        <>
          <h2>{c.compliance}</h2>
          <p>{c.complianceHelp}</p>
        </>
      )}

      <div className="studio-editor-layout">
        <div className="studio-profile-canvas">
          <ProfileEditor
            key={`${profile.id}-${profile.version}`}
            initial={clean}
            existing
            plugins={plugins}
            dimensions={dimensions}
            section={section}
            filter={
              section === 'policies' ? 'policy' : ['constraints', 'compliance'].includes(section) ? section : undefined
            }
            onSave={async (next) => {
              const saved = await studioRequest<ProfileView>(`decision-profiles/${encodeURIComponent(id)}`, {
                method: 'PATCH',
                body: JSON.stringify(next),
              })
              setData({ ...data, profile: saved })
              setMessage(`${c.profile} ${next.name} ${c.savedAtVersion} ${next.version}.`)
            }}
          />
        </div>

        <aside className="studio-context-inspector" aria-label={c.context}>
          <h2>{c.context}</h2>
          <dl>
            <dt>{c.profile}</dt>
            <dd>{profile.name}</dd>
            <dt>{c.version}</dt>
            <dd>{profile.version}</dd>
            <dt>{c.section}</dt>
            <dd>{sectionLabel(section, locale)}</dd>
            <dt>{c.plugin}</dt>
            <dd>{pluginName}</dd>
            <dt>{c.validation}</dt>
            <dd>{profile.validation.status}</dd>
          </dl>
          <p>{c.contextHelp}</p>
        </aside>
      </div>
    </>
  )
}
