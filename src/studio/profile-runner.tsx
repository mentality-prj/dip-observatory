'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system'
import { observatoryHref } from '@/lib/platform-urls'
import { studioRequest, type Audit, type Profile } from './contracts'
import { JsonField, SchemaField, schemaDefault } from './schema-form'
import { studioCopy } from './studio-copy'
import { useStudioLocale } from './use-studio-locale'

export function ProfileRunner({ profile }: { profile: Profile }) {
  const locale = useStudioLocale()
  const copy = studioCopy(locale).runner
  const [context, setContext] = useState(schemaDefault(profile.context_schema))
  const [input, setInput] = useState<unknown>({})
  const [result, setResult] = useState<Audit | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <form
      className="ds-card"
      onSubmit={async (event) => {
        event.preventDefault()
        setBusy(true)
        setError('')
        setResult(null)
        try {
          setResult(
            await studioRequest<Audit>(`decision-profiles/${encodeURIComponent(profile.id)}/execute`, {
              method: 'POST',
              body: JSON.stringify({ context, plugin_input: input }),
            })
          )
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : String(reason))
        } finally {
          setBusy(false)
        }
      }}
    >
      <CardHeader>
        <CardTitle>
          {copy.evaluate} {profile.name}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <SchemaField
          schema={profile.context_schema}
          value={context}
          onChange={setContext}
          label={copy.runtimeContext}
        />
        <JsonField label={copy.pluginInput} value={input} onChange={setInput} />
        <Button disabled={busy} type="submit">
          {busy ? copy.evaluating : copy.evaluateAlternatives}
        </Button>
        {error && (
          <div role="alert" className="studio-error">
            {error}
          </div>
        )}
        {result && (
          <div className="studio-success" role="status">
            {result.status}: {result.selected_alternative ?? copy.noAlternative}.{' '}
            <Link href={observatoryHref(`decisions?decision=${encodeURIComponent(result.decision_id)}`)}>
              {copy.inspect}
            </Link>
          </div>
        )}
      </CardContent>
    </form>
  )
}
