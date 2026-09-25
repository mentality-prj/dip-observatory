'use client'

import { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/design-system'
import { studioRequest, type Binding, type Dimension, type Plugin } from './contracts'
import { outputLabel } from './presentation'
import { JsonField } from './schema-form'
import { studioCopy } from './studio-copy'
import { useStudioLocale } from './use-studio-locale'

export function BindingEditor({ plugin, dimensions }: { plugin: Plugin; dimensions: Dimension[] }) {
  const copy = studioCopy(useStudioLocale()).bindings
  const [bindings, setBindings] = useState<Binding[] | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let disposed = false
    studioRequest<Binding[]>(`plugins/${encodeURIComponent(plugin.name)}/dimension-bindings`)
      .then((result) => {
        if (!disposed) setBindings(result)
      })
      .catch((reason) => {
        if (!disposed) setError(String(reason))
      })
    return () => {
      disposed = true
    }
  }, [plugin.name])
  if (!bindings) return <p role="status">{error || copy.loading}</p>
  function update(index: number, patch: Partial<Binding>) {
    setBindings((previous) => previous!.map((b, i) => (i === index ? { ...b, ...patch } : b)))
  }
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        setBusy(true)
        setError('')
        setMessage('')
        try {
          await studioRequest(`plugins/${encodeURIComponent(plugin.name)}/dimension-bindings`, {
            method: 'PUT',
            body: JSON.stringify(bindings),
          })
          setMessage(copy.saved)
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : String(reason))
        } finally {
          setBusy(false)
        }
      }}
    >
      <p>{copy.intro}</p>
      {bindings.map((binding, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>
              {outputLabel(binding.capability_id, binding.source_path)} →{' '}
              {dimensions.find((d) => d.id === binding.dimension_id)?.name ?? binding.dimension_id}
            </CardTitle>
            <p>
              {copy.pinnedContracts}: plugin {binding.plugin_version} · capability {binding.capability_version}
            </p>
          </CardHeader>
          <CardContent>
            {(binding.plugin_version !== plugin.version ||
              binding.capability_version !== plugin.capability_versions[binding.capability_id]) && (
              <Button
                variant="secondary"
                type="button"
                onClick={() =>
                  update(index, {
                    plugin_version: plugin.version,
                    capability_version: plugin.capability_versions[binding.capability_id] ?? '',
                  })
                }
              >
                {copy.useInstalledVersions}
              </Button>
            )}
            <div className="studio-grid">
              <label className="studio-field">
                {copy.bindingId}
                <Input required value={binding.id} onChange={(e) => update(index, { id: e.target.value })} />
              </label>
              <label className="studio-field">
                {copy.version}
                <Input required value={binding.version} onChange={(e) => update(index, { version: e.target.value })} />
              </label>
              <label className="studio-field">
                {copy.availableOutput}
                <select
                  className="ds-select"
                  value={`${binding.capability_id}|${binding.dimension_id}|${binding.source_path}`}
                  onChange={(e) => {
                    const [capability_id, dimension_id, source_path] = e.target.value.split('|')
                    update(index, {
                      capability_id,
                      capability_version: plugin.capability_versions[capability_id],
                      dimension_id,
                      dimension_version: dimensions.find((d) => d.id === dimension_id)?.version ?? '1.0',
                      source_path,
                    })
                  }}
                >
                  {plugin.dimension_outputs.map((o) => (
                    <option
                      key={`${o.capability_id}|${o.dimension_id}|${o.source_path}`}
                      value={`${o.capability_id}|${o.dimension_id}|${o.source_path}`}
                    >
                      {outputLabel(o.capability_id, o.source_path)} →{' '}
                      {dimensions.find((d) => d.id === o.dimension_id)?.name ?? o.dimension_id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="studio-field">
                {copy.dimensionVersion}
                <select
                  className="ds-select"
                  value={binding.dimension_version}
                  onChange={(e) => update(index, { dimension_version: e.target.value })}
                >
                  {!dimensions.some(
                    (d) => d.id === binding.dimension_id && d.version === binding.dimension_version
                  ) && (
                    <option value={binding.dimension_version}>
                      {binding.dimension_version} ({copy.unavailable})
                    </option>
                  )}
                  {dimensions
                    .filter((d) => d.id === binding.dimension_id)
                    .map((d) => (
                      <option key={d.version}>{d.version}</option>
                    ))}
                </select>
              </label>
            </div>
            <label className="studio-check">
              <input
                type="checkbox"
                checked={binding.required}
                onChange={(e) => update(index, { required: e.target.checked })}
              />
              {copy.requiredOutput}
            </label>
            <label className="studio-check">
              <input
                type="checkbox"
                checked={binding.enabled}
                onChange={(e) => update(index, { enabled: e.target.checked })}
              />
              {copy.enabled}
            </label>
            <details>
              <summary>{copy.advancedDetails}</summary>
              <p>
                {copy.internalSourcePath}: <code>{binding.source_path}</code>
              </p>
              <JsonField
                label={copy.targetPath}
                value={binding.mapping}
                onChange={(mapping) => update(index, { mapping: mapping as Binding['mapping'] })}
              />
            </details>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setBindings(bindings.filter((_, i) => i !== index))}
            >
              {copy.removeBinding}
            </Button>
          </CardContent>
        </Card>
      ))}
      <div className="studio-toolbar">
        <Button
          type="button"
          variant="secondary"
          disabled={!plugin.dimension_outputs.length}
          onClick={() => {
            const output = plugin.dimension_outputs[0]
            setBindings([
              ...bindings,
              {
                id: `${plugin.name}-binding-${bindings.length + 1}`,
                version: '1.0',
                plugin_id: plugin.name,
                plugin_version: plugin.version,
                capability_id: output.capability_id,
                capability_version: plugin.capability_versions[output.capability_id],
                dimension_id: output.dimension_id,
                dimension_version: dimensions.find((d) => d.id === output.dimension_id)?.version ?? '1.0',
                source_path: output.source_path,
                mapping: null,
                required: true,
                enabled: true,
              },
            ])
          }}
        >
          {copy.addBinding}
        </Button>
        <Button disabled={busy || !plugin.enabled} type="submit">
          {busy ? copy.saving : copy.saveBindings}
        </Button>
      </div>
      {!plugin.dimension_outputs.length && <p>{copy.noOutputs}</p>}
      {error && (
        <div role="alert" className="studio-error">
          {error}
        </div>
      )}
      {message && (
        <div role="status" className="studio-success">
          {message}
        </div>
      )}
    </form>
  )
}
