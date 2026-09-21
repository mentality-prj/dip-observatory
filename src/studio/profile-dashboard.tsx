'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, Database, FileJson, Play, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { Badge, Button } from '@/design-system'
import { studioHref } from '@/lib/platform-urls'
import type { Plugin, Profile, ProfileView } from './contracts'

type Props = {
  profiles: ProfileView[]
  plugins: Plugin[]
  deleting: string
  onCreate: () => void
  onImport: (profile: Profile) => void
  onError: (message: string) => void
  onEvaluate: (profile: Profile) => void
  onRequestDelete: (profileId: string) => void
  onCancelDelete: () => void
  onConfirmDelete: (profileId: string) => Promise<void>
}

type StatusFilter = 'all' | 'active' | 'draft' | 'invalid'

function profileStatus(profile: ProfileView) {
  if (profile.validation.status === 'INVALID') return 'INVALID'
  return profile.active ? 'ACTIVE' : 'DRAFT'
}

function profileDomain(profile: ProfileView, plugins: Plugin[]) {
  const plugin = plugins.find((item) => item.name === profile.plugin_id)
  return plugin?.ui?.category ?? plugin?.ui?.label ?? profile.plugin_id
}

export function ProfileDashboard({
  profiles,
  plugins,
  deleting,
  onCreate,
  onImport,
  onError,
  onEvaluate,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: Props) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [selectedId, setSelectedId] = useState('')

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return profiles.filter((profile) => {
      const matchesQuery =
        !normalized ||
        profile.name.toLowerCase().includes(normalized) ||
        profile.id.toLowerCase().includes(normalized) ||
        profile.plugin_id.toLowerCase().includes(normalized) ||
        profile.capability_id.toLowerCase().includes(normalized)
      const current = profileStatus(profile).toLowerCase()
      const matchesStatus = status === 'all' || current === status
      return matchesQuery && matchesStatus
    })
  }, [profiles, query, status])

  const selected =
    filtered.find((profile) => profile.id === selectedId) ??
    filtered[0] ??
    profiles.find((profile) => profile.id === selectedId) ??
    profiles[0]

  return (
    <section className="studio-profile-dashboard" aria-label="Decision profiles workspace">
      <div className="studio-profile-toolbar">
        <Button type="button" onClick={onCreate}>
          <Plus size={16} aria-hidden />
          Create profile
        </Button>

        <label className="studio-import-button">
          <FileJson size={16} aria-hidden />
          <span>Import profile JSON</span>
          <input
            type="file"
            accept="application/json,.json"
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (!file) return
              try {
                const parsed = JSON.parse(await file.text()) as Profile
                if (!parsed.id || !Array.isArray(parsed.dimensions) || !Array.isArray(parsed.alternatives)) {
                  throw new Error('Select a DecisionProfile JSON file.')
                }
                onImport(parsed)
              } catch (reason) {
                onError(reason instanceof Error ? reason.message : String(reason))
              }
              event.target.value = ''
            }}
          />
        </label>

        <label className="studio-profile-search">
          <Search size={16} aria-hidden />
          <span className="sr-only">Search profiles</span>
          <input
            type="search"
            placeholder="Search profiles…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className="studio-profile-filter">
          <SlidersHorizontal size={16} aria-hidden />
          <span className="sr-only">Filter profiles by status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="invalid">Invalid</option>
          </select>
        </label>
      </div>

      {!profiles.length ? (
        <div className="studio-empty-panel">
          <div className="studio-empty-icon">
            <Database size={22} aria-hidden />
          </div>
          <h2>No profiles yet</h2>
          <p>Create a profile or import an example to configure alternatives, dimensions and rules.</p>
          <Button type="button" onClick={onCreate}>
            <Plus size={16} aria-hidden />
            Create first profile
          </Button>
        </div>
      ) : (
        <div className="studio-profile-layout">
          <div className="studio-profile-table-panel">
            <div className="studio-panel-heading">
              <div>
                <h2>Decision Profiles</h2>
                <span>
                  {filtered.length} of {profiles.length}
                </span>
              </div>
            </div>

            <div className="studio-profile-table-wrap">
              <table className="studio-profile-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Domain</th>
                    <th>Version</th>
                    <th>Status</th>
                    <th>Alternatives</th>
                    <th>Dimensions</th>
                    <th>
                      <span className="sr-only">Inspect</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((profile) => {
                    const currentStatus = profileStatus(profile)
                    const active = selected?.id === profile.id
                    return (
                      <tr key={profile.id} data-selected={active ? 'true' : undefined}>
                        <td>
                          <button
                            type="button"
                            className="studio-profile-name"
                            onClick={() => setSelectedId(profile.id)}
                          >
                            {profile.name}
                          </button>
                          <small>{profile.capability_id}</small>
                        </td>
                        <td>{profileDomain(profile, plugins)}</td>
                        <td>{profile.version}</td>
                        <td>
                          <Badge
                            variant={
                              currentStatus === 'ACTIVE' ? 'emerald' : currentStatus === 'INVALID' ? 'rose' : 'neutral'
                            }
                          >
                            {currentStatus}
                          </Badge>
                        </td>
                        <td>{profile.alternatives.length}</td>
                        <td>{profile.dimensions.length}</td>
                        <td>
                          <button
                            type="button"
                            className="studio-row-action"
                            aria-label={`Inspect ${profile.name}`}
                            onClick={() => setSelectedId(profile.id)}
                          >
                            <ArrowRight size={15} aria-hidden />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {!filtered.length && (
                <div className="studio-filter-empty">No profiles match the current search and status filter.</div>
              )}
            </div>
          </div>

          {selected && (
            <aside className="studio-profile-overview" aria-label="Profile overview">
              <div className="studio-panel-heading">
                <div>
                  <span className="studio-overview-eyebrow">Profile overview</span>
                  <h2>{selected.name}</h2>
                </div>
                <Badge
                  variant={
                    profileStatus(selected) === 'ACTIVE'
                      ? 'emerald'
                      : profileStatus(selected) === 'INVALID'
                        ? 'rose'
                        : 'neutral'
                  }
                >
                  {profileStatus(selected)}
                </Badge>
              </div>

              <p className="studio-profile-meta">
                {profileDomain(selected, plugins)} · {selected.plugin_id}
                <br />
                Version {selected.version} · {selected.capability_id}
              </p>

              <div className="studio-overview-metrics">
                <div>
                  <strong>{selected.alternatives.length}</strong>
                  <span>Alternatives</span>
                </div>
                <div>
                  <strong>{selected.dimensions.length}</strong>
                  <span>Dimensions</span>
                </div>
                <div>
                  <strong>{selected.dimensions.filter((dimension) => dimension.binding_id).length}</strong>
                  <span>Bound inputs</span>
                </div>
                <div>
                  <strong>{selected.validation.warnings.length}</strong>
                  <span>Warnings</span>
                </div>
              </div>

              {selected.validation.errors.length > 0 && (
                <div className="studio-overview-validation" role="alert">
                  <strong>Validation requires attention</strong>
                  <span>{selected.validation.errors[0]}</span>
                </div>
              )}

              <div className="studio-overview-actions">
                <Button asChild>
                  <Link href={studioHref(`profiles/${encodeURIComponent(selected.id)}`)}>
                    Open profile <ArrowRight size={15} aria-hidden />
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!selected.active || selected.validation.status !== 'VALID'}
                  onClick={() => onEvaluate(selected)}
                >
                  <Play size={15} aria-hidden />
                  Evaluate
                </Button>

                {deleting !== selected.id ? (
                  <Button type="button" variant="ghost" onClick={() => onRequestDelete(selected.id)}>
                    Delete profile
                  </Button>
                ) : (
                  <div className="studio-delete-confirmation">
                    <Button type="button" variant="danger" onClick={() => void onConfirmDelete(selected.id)}>
                      Confirm delete
                    </Button>
                    <Button type="button" variant="secondary" onClick={onCancelDelete}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      )}
    </section>
  )
}
