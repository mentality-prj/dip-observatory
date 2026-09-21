'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Badge, Button, Select } from '@/design-system'
import { studioHref } from '@/lib/platform-urls'
import { DecisionWorkflow } from '@/components/product/decision-workflow'
import { BindingEditor } from './binding-editor'
import { emptyProfile, studioRequest, type Dimension, type Plugin, type Profile, type ProfileView } from './contracts'
import { Breadcrumbs, outputLabel } from './presentation'
import { ProfileEditor } from './profile-editor'
import { ProfileDashboard } from './profile-dashboard'
import { ProfileRunner } from './profile-runner'
import { studioLocaleFromPath } from './studio-locale'

const titles: Record<string, string> = {
  profiles: 'Decision Workspace',
  plugins: 'Evidence Sources',
  dimensions: 'Evaluation Contracts',
  bindings: 'Evidence Mapping',
}
const descriptions: Record<string, string> = {
  profiles: 'Model a decision from alternatives through evaluation, evidence and constraints, then validate and run it.',
  plugins: 'Advanced: inspect the domain capabilities that supply evidence and decision inputs.',
  dimensions: 'Advanced: inspect reusable evaluation contracts and evaluator schemas.',
  bindings: 'Advanced: map evidence-source outputs into the evaluation model.',
}

export function DecisionStudio({ section }: { section: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = studioLocaleFromPath(pathname, searchParams.get('lang'))
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
        if (!disposed) { setData({ dimensions, plugins, profiles }); setError('') }
      })
      .catch((reason) => { if (!disposed) setError(String(reason)) })
    return () => { disposed = true }
  }, [retry, section])
  async function refreshProfiles() {
    const profiles = await studioRequest<ProfileView[]>('decision-profiles')
    setData((previous) => previous && { ...previous, profiles })
  }
  function openProfile(profile: Profile, existing: boolean) {
    const clean = Object.fromEntries(Object.entries(profile).filter(([key]) => key !== 'validation')) as Profile
    setEditor({ profile: clean, existing, key: Date.now() }); setMessage('')
  }
  async function deleteProfile(profileId: string) {
    try {
      await studioRequest(`decision-profiles/${encodeURIComponent(profileId)}`, { method: 'DELETE' })
      if (editor?.profile.id === profileId) setEditor(null)
      setDeleting(''); await refreshProfiles(); setMessage('Decision model deleted. Historical decisions are retained.')
    } catch (reason) { setError(String(reason)) }
  }
  return (
    <>
      <Breadcrumbs items={[...(['plugins', 'bindings', 'dimensions'].includes(section) ? [{ label: 'Advanced', href: studioHref('plugins') }] : []), { label: titles[section] }]} />
      <h1>{titles[section]}</h1><p>{descriptions[section]}</p>
      <DecisionWorkflow locale={locale} tone="light" compact />
      {error && <div role="alert" className="studio-error">{error} <Button type="button" variant="secondary" onClick={() => setRetry(retry + 1)}>Retry</Button></div>}
      {message && <div role="status" className="studio-success">{message}</div>}
      {!data && !error && <p role="status">Loading Decision Studio…</p>}
      {data && <>
        {section === 'plugins' && <section className="studio-registry-list" aria-label="Evidence sources">{data.plugins.map((plugin) => <article className="studio-registry-row" key={plugin.name}><header className="studio-registry-row-heading"><div><h2>{plugin.ui?.label ?? plugin.name}</h2><p>{plugin.description}</p></div><Badge variant={plugin.enabled ? 'emerald' : 'neutral'}>{plugin.enabled ? 'Enabled' : 'Disabled'}</Badge></header><div className="studio-registry-meta"><span><small>Version</small>{plugin.version}</span><span><small>Category</small>{plugin.ui?.category ?? 'General'}</span><span><small>Capabilities</small>{plugin.capabilities.length}</span><span><small>Outputs</small>{plugin.dimension_outputs.length}</span></div><details className="studio-registry-disclosure"><summary>Technical details</summary><div className="studio-registry-detail"><div><h3>Capabilities</h3><ul>{plugin.capabilities.map((capability) => <li key={capability}>{capability} <span className="studio-muted">@{plugin.capability_versions[capability] ?? 'unversioned'}</span></li>)}</ul></div><div><h3>Available outputs</h3>{plugin.dimension_outputs.length ? <ul>{plugin.dimension_outputs.map((output) => <li key={`${output.capability_id}-${output.dimension_id}-${output.source_path}`}>{outputLabel(output.capability_id, output.source_path)} → {data.dimensions.find((dimension) => dimension.id === output.dimension_id)?.name ?? output.dimension_id}</li>)}</ul> : <p>No dimension outputs declared.</p>}</div></div></details></article>)}</section>}
        {section === 'dimensions' && <section className="studio-registry-list" aria-label="Evaluation contracts">{data.dimensions.map((dimension) => <article className="studio-registry-row studio-registry-row-compact" key={`${dimension.id}-${dimension.version}`}><header className="studio-registry-row-heading"><div><h2>{dimension.name}</h2><p>{dimension.id}</p></div><Badge>{dimension.version}</Badge></header><div className="studio-registry-meta"><span><small>Type</small>{dimension.type}</span><span><small>Phase</small>{dimension.phase ?? 'Unavailable'}</span><span><small>Source</small>{dimension.source}</span><span><small>Blocking</small>{dimension.blocking ? 'Yes' : 'No'}</span></div><details className="studio-registry-disclosure"><summary>Evaluator and schemas</summary><div className="studio-registry-contracts"><div><h3>Evaluator</h3><p>{dimension.evaluator_id}@{dimension.evaluator_version}</p></div><div><h3>Configuration schema</h3><pre>{JSON.stringify(dimension.configuration_schema, null, 2)}</pre></div><div><h3>Value schema</h3><pre>{JSON.stringify(dimension.value_schema, null, 2)}</pre></div></div></details></article>)}</section>}
        {section === 'bindings' && <><label className="studio-field">Evidence source<Select value={pluginId} onChange={(e) => setPluginId(e.target.value)}><option value="">Select an evidence source</option>{data.plugins.map((p) => <option key={p.name} value={p.name}>{p.ui?.label ?? p.name}</option>)}</Select></label>{data.plugins.find((p) => p.name === pluginId) && <BindingEditor key={pluginId} plugin={data.plugins.find((p) => p.name === pluginId)!} dimensions={data.dimensions} />}</>}
        {section === 'profiles' && <>{!editor && <ProfileDashboard profiles={data.profiles} plugins={data.plugins} deleting={deleting} onCreate={() => openProfile(emptyProfile(data.plugins.find((plugin) => plugin.enabled)), false)} onImport={(profile) => { openProfile(profile, false); setError('') }} onError={setError} onEvaluate={setRunningProfile} onRequestDelete={setDeleting} onCancelDelete={() => setDeleting('')} onConfirmDelete={deleteProfile} />}{editor && <div className="studio-editor-workspace"><div className="studio-editor-toolbar"><Button type="button" variant="secondary" onClick={() => setEditor(null)}>Back to decisions</Button></div><div className="studio-editor-layout"><ProfileEditor key={editor.key} initial={editor.profile} existing={editor.existing} plugins={data.plugins} dimensions={data.dimensions} onSave={async (profile) => { await studioRequest(editor.existing ? `decision-profiles/${encodeURIComponent(profile.id)}` : 'decision-profiles', { method: editor.existing ? 'PATCH' : 'POST', body: JSON.stringify(profile) }); setEditor(null); await refreshProfiles(); setMessage(`Decision ${profile.name} saved at version ${profile.version}.`) }} /><aside className="studio-context-inspector" aria-label="Decision context"><h2>Decision workflow</h2><dl><dt>Decision</dt><dd>{editor.profile.name || 'Untitled decision'}</dd><dt>Version</dt><dd>{editor.profile.version}</dd><dt>Mode</dt><dd>{editor.existing ? 'Editing' : 'New model'}</dd><dt>Validation</dt><dd>Continuous</dd></dl><p>Define alternatives, evaluation criteria, evidence and constraints. Validate the model before running it; platform contracts stay in Advanced configuration.</p></aside></div></div>}{runningProfile && <ProfileRunner key={`${runningProfile.id}-${runningProfile.version}`} profile={runningProfile} />}</>}
      </>}
    </>
  )
}
