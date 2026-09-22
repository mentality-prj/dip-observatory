'use client'

import { useEffect, useState } from 'react'
import { Badge, Button, Select } from '@/design-system'
import { studioHref } from '@/lib/platform-urls'
import { DecisionWorkflow } from '@/components/product/decision-workflow'
import { BindingEditor } from './binding-editor'
import { emptyProfile, studioRequest, type Dimension, type Plugin, type Profile, type ProfileView } from './contracts'
import { Breadcrumbs, outputLabel } from './presentation'
import { ProfileEditor } from './profile-editor'
import { ProfileDashboard } from './profile-dashboard'
import { ProfileRunner } from './profile-runner'
import { studioCopy } from './studio-copy'
import { useStudioLocale } from './use-studio-locale'

export function DecisionStudio({ section }: { section: string }) {
  const locale = useStudioLocale()
  const c = studioCopy(locale).decisionStudio
  const title = c.titles[section as keyof typeof c.titles] ?? section
  const description = c.descriptions[section as keyof typeof c.descriptions] ?? ''
  const [data, setData] = useState<{ dimensions: Dimension[]; plugins: Plugin[]; profiles: ProfileView[] } | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editor, setEditor] = useState<{ profile: Profile; existing: boolean; key: number } | null>(null)
  const [pluginId, setPluginId] = useState('')
  const [deleting, setDeleting] = useState('')
  const [retry, setRetry] = useState(0)
  const [runningProfile, setRunningProfile] = useState<Profile | null>(null)

  useEffect(() => {
    let disposed = false
    Promise.all([
      studioRequest<Dimension[]>('dimensions'),
      studioRequest<Plugin[]>('decision-studio/plugins'),
      section === 'profiles' ? studioRequest<ProfileView[]>('decision-profiles') : Promise.resolve([]),
    ])
      .then(([dimensions, plugins, profiles]) => {
        if (!disposed) {
          setData({ dimensions, plugins, profiles })
          setError('')
        }
      })
      .catch((reason) => {
        if (!disposed) setError(String(reason))
      })
    return () => {
      disposed = true
    }
  }, [retry, section])

  async function refreshProfiles() {
    const profiles = await studioRequest<ProfileView[]>('decision-profiles')
    setData((previous) => previous && { ...previous, profiles })
  }

  function openProfile(profile: Profile, existing: boolean) {
    const clean = Object.fromEntries(Object.entries(profile).filter(([key]) => key !== 'validation')) as Profile
    setEditor({ profile: clean, existing, key: Date.now() })
    setMessage('')
  }

  async function deleteProfile(profileId: string) {
    try {
      await studioRequest(`decision-profiles/${encodeURIComponent(profileId)}`, { method: 'DELETE' })
      if (editor?.profile.id === profileId) setEditor(null)
      setDeleting('')
      await refreshProfiles()
      setMessage(c.deleted)
    } catch (reason) {
      setError(String(reason))
    }
  }

  return (
    <>
      <Breadcrumbs
        items={[
          ...(['plugins', 'bindings', 'dimensions'].includes(section)
            ? [{ label: studioCopy(locale).breadcrumbs.advanced, href: studioHref('plugins', locale) }]
            : []),
          { label: title },
        ]}
      />
      <h1>{title}</h1>
      <p>{description}</p>
      <DecisionWorkflow locale={locale} tone="light" compact />

      {error && (
        <div role="alert" className="studio-error">
          {error}{' '}
          <Button type="button" variant="secondary" onClick={() => setRetry(retry + 1)}>
            {c.retry}
          </Button>
        </div>
      )}
      {message && <div role="status" className="studio-success">{message}</div>}
      {!data && !error && <p role="status">{c.loading}</p>}

      {data && (
        <>
          {section === 'plugins' && (
            <section className="studio-registry-list" aria-label={c.titles.plugins}>
              {data.plugins.map((plugin) => (
                <article className="studio-registry-row" key={plugin.name}>
                  <header className="studio-registry-row-heading">
                    <div>
                      <h2>{plugin.ui?.label ?? plugin.name}</h2>
                      <p>{plugin.description}</p>
                    </div>
                    <Badge variant={plugin.enabled ? 'emerald' : 'neutral'}>
                      {plugin.enabled ? c.enabled : c.disabled}
                    </Badge>
                  </header>
                  <div className="studio-registry-meta">
                    <span><small>{c.version}</small>{plugin.version}</span>
                    <span><small>{c.category}</small>{plugin.ui?.category ?? c.general}</span>
                    <span><small>{c.capabilities}</small>{plugin.capabilities.length}</span>
                    <span><small>{c.outputs}</small>{plugin.dimension_outputs.length}</span>
                  </div>
                  <details className="studio-registry-disclosure">
                    <summary>{c.technicalDetails}</summary>
                    <div className="studio-registry-detail">
                      <div>
                        <h3>{c.capabilities}</h3>
                        <ul>
                          {plugin.capabilities.map((capability) => (
                            <li key={capability}>
                              {capability}{' '}
                              <span className="studio-muted">@{plugin.capability_versions[capability] ?? '—'}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3>{c.availableOutputs}</h3>
                        {plugin.dimension_outputs.length ? (
                          <ul>
                            {plugin.dimension_outputs.map((output) => (
                              <li key={`${output.capability_id}-${output.dimension_id}-${output.source_path}`}>
                                {outputLabel(output.capability_id, output.source_path)} →{' '}
                                {data.dimensions.find((dimension) => dimension.id === output.dimension_id)?.name ?? output.dimension_id}
                              </li>
                            ))}
                          </ul>
                        ) : <p>{c.noOutputs}</p>}
                      </div>
                    </div>
                  </details>
                </article>
              ))}
            </section>
          )}

          {section === 'dimensions' && (
            <section className="studio-registry-list" aria-label={c.titles.dimensions}>
              {data.dimensions.map((dimension) => (
                <article className="studio-registry-row studio-registry-row-compact" key={`${dimension.id}-${dimension.version}`}>
                  <header className="studio-registry-row-heading">
                    <div><h2>{dimension.name}</h2><p>{dimension.id}</p></div>
                    <Badge>{dimension.version}</Badge>
                  </header>
                  <div className="studio-registry-meta">
                    <span><small>{c.type}</small>{dimension.type}</span>
                    <span><small>{c.phase}</small>{dimension.phase ?? c.unavailable}</span>
                    <span><small>{c.source}</small>{dimension.source}</span>
                    <span><small>{c.blocking}</small>{dimension.blocking ? c.yes : c.no}</span>
                  </div>
                  <details className="studio-registry-disclosure">
                    <summary>{c.evaluatorSchemas}</summary>
                    <div className="studio-registry-contracts">
                      <div><h3>{c.evaluator}</h3><p>{dimension.evaluator_id}@{dimension.evaluator_version}</p></div>
                      <div><h3>{c.configurationSchema}</h3><pre>{JSON.stringify(dimension.configuration_schema, null, 2)}</pre></div>
                      <div><h3>{c.valueSchema}</h3><pre>{JSON.stringify(dimension.value_schema, null, 2)}</pre></div>
                    </div>
                  </details>
                </article>
              ))}
            </section>
          )}

          {section === 'bindings' && (
            <>
              <label className="studio-field">
                {c.evidenceSource}
                <Select value={pluginId} onChange={(e) => setPluginId(e.target.value)}>
                  <option value="">{c.selectEvidenceSource}</option>
                  {data.plugins.map((p) => <option key={p.name} value={p.name}>{p.ui?.label ?? p.name}</option>)}
                </Select>
              </label>
              {data.plugins.find((p) => p.name === pluginId) && (
                <BindingEditor
                  key={pluginId}
                  plugin={data.plugins.find((p) => p.name === pluginId)!}
                  dimensions={data.dimensions}
                />
              )}
            </>
          )}

          {section === 'profiles' && (
            <>
              {!editor && (
                <ProfileDashboard
                  profiles={data.profiles}
                  plugins={data.plugins}
                  deleting={deleting}
                  onCreate={() => openProfile(emptyProfile(data.plugins.find((plugin) => plugin.enabled)), false)}
                  onImport={(profile) => { openProfile(profile, false); setError('') }}
                  onError={setError}
                  onEvaluate={setRunningProfile}
                  onRequestDelete={setDeleting}
                  onCancelDelete={() => setDeleting('')}
                  onConfirmDelete={deleteProfile}
                />
              )}
              {editor && (
                <div className="studio-editor-workspace">
                  <div className="studio-editor-toolbar">
                    <Button type="button" variant="secondary" onClick={() => setEditor(null)}>{c.backToDecisions}</Button>
                  </div>
                  <div className="studio-editor-layout">
                    <ProfileEditor
                      key={editor.key}
                      initial={editor.profile}
                      existing={editor.existing}
                      plugins={data.plugins}
                      dimensions={data.dimensions}
                      onSave={async (profile) => {
                        await studioRequest(
                          editor.existing ? `decision-profiles/${encodeURIComponent(profile.id)}` : 'decision-profiles',
                          { method: editor.existing ? 'PATCH' : 'POST', body: JSON.stringify(profile) }
                        )
                        setEditor(null)
                        await refreshProfiles()
                        setMessage(`${c.decision} ${profile.name} ${c.savedAtVersion} ${profile.version}.`)
                      }}
                    />
                    <aside className="studio-context-inspector" aria-label={c.decisionWorkflow}>
                      <h2>{c.decisionWorkflow}</h2>
                      <dl>
                        <dt>{c.decision}</dt><dd>{editor.profile.name || c.untitledDecision}</dd>
                        <dt>{c.version}</dt><dd>{editor.profile.version}</dd>
                        <dt>{c.mode}</dt><dd>{editor.existing ? c.editing : c.newModel}</dd>
                        <dt>{c.validation}</dt><dd>{c.continuous}</dd>
                      </dl>
                      <p>{c.workflowHelp}</p>
                    </aside>
                  </div>
                </div>
              )}
              {runningProfile && <ProfileRunner key={`${runningProfile.id}-${runningProfile.version}`} profile={runningProfile} />}
            </>
          )}
        </>
      )}
    </>
  )
}
