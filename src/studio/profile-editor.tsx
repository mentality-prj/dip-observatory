"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { emptyProfile, studioRequest, type Binding, type Dimension, type Plugin, type Profile, type ProfileDimension } from "./contracts";
import { JsonField, SchemaField } from "./schema-form";
import { RuleSummary, type ProfileSection } from "./presentation";

export function ProfileEditor({ initial, existing, plugins, dimensions, onSave, filter, section }: {
  initial: Profile; existing: boolean; plugins: Plugin[]; dimensions: Dimension[];
  onSave: (profile: Profile) => Promise<void>; filter?: string; section?: ProfileSection;
}) {
  const [profile, setProfile] = useState<Profile>(initial);
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const plugin = plugins.find((p) => p.name === profile.plugin_id);
  useEffect(() => {
    let disposed = false;
    studioRequest<Binding[]>(`plugins/${encodeURIComponent(profile.plugin_id)}/dimension-bindings`)
      .then((result) => { if (!disposed) setBindings(result); })
      .catch((reason) => { if (!disposed) setError(String(reason)); });
    return () => { disposed = true; };
  }, [profile.plugin_id]);
  function changeDimension(index: number, patch: Partial<ProfileDimension>) {
    setProfile({ ...profile, dimensions: profile.dimensions.map((item, i) => i === index ? { ...item, ...patch } : item) });
  }
  const ids = [...new Set(dimensions.map((d) => d.id))];
  return <form onSubmit={async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try { await onSave(profile); } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(false); }
  }}>
    <Card><CardHeader><div className="studio-card-heading"><CardTitle>{existing ? "Edit profile" : "Create profile"}</CardTitle>
      <Badge variant={profile.active ? "emerald" : "neutral"}>{profile.active ? "Active" : "Draft"}</Badge></div></CardHeader><CardContent>
      <div className="studio-grid">
        <label className="studio-field">Profile ID<Input required pattern="[a-zA-Z0-9][a-zA-Z0-9_-]*" readOnly={existing} value={profile.id} onChange={(e) => setProfile({ ...profile, id: e.target.value })} /></label>
        {(!section || section === "overview") && <label className="studio-field">Name<Input required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>}
        <label className="studio-field">{existing ? "New version" : "Version"}<Input required value={profile.version} onChange={(e) => setProfile({ ...profile, version: e.target.value })} />
          {existing && <small>Use a new version to preserve previous configuration.</small>}</label>
      </div>
      {(!section || section === "overview") && <><div className="studio-grid">
        <label className="studio-field">Plugin<select className="ds-select" required value={profile.plugin_id} onChange={(e) => {
          const selected = plugins.find((p) => p.name === e.target.value)!;
          const fresh = emptyProfile(selected);
          setProfile({ ...profile, plugin_id: fresh.plugin_id, plugin_version: fresh.plugin_version,
            capability_id: fresh.capability_id, capability_version: fresh.capability_version,
            dimensions: profile.dimensions.map((d) => ({ ...d, binding_id: null, binding_version: null })) });
        }}><option value="">Select plugin</option>{plugins.map((p) => <option key={p.name} value={p.name} disabled={!p.enabled}>{p.ui?.label ?? p.name} · {p.version}{!p.enabled && " (disabled)"}</option>)}</select></label>
        <label className="studio-field">Capability<select className="ds-select" required value={profile.capability_id} onChange={(e) => setProfile({ ...profile,
          capability_id: e.target.value, capability_version: plugin?.capability_versions[e.target.value] ?? "",
          dimensions: profile.dimensions.map((d) => ({ ...d, binding_id: null, binding_version: null })) })}>
          {plugin?.capabilities.map((id) => <option key={id} value={id}>{id} · {plugin.capability_versions[id] ?? "unversioned"}</option>)}
        </select></label>
      </div>
      <p className="studio-muted">Pinned contracts: plugin {profile.plugin_version || "unavailable"} · capability {profile.capability_version || "unavailable"}</p>
      {plugin && (profile.plugin_version !== plugin.version || profile.capability_version !== plugin.capability_versions[profile.capability_id]) &&
        <Button type="button" variant="secondary" onClick={() => setProfile({ ...profile,
          plugin_version: plugin.version, capability_version: plugin.capability_versions[profile.capability_id] ?? "" })}>Use installed contract versions</Button>}
      <label className="studio-check"><input type="checkbox" checked={profile.active} onChange={(e) => setProfile({ ...profile, active: e.target.checked })} />Activate after validation</label></>}
    </CardContent></Card>
    {(!section || section === "alternatives") && <Card><CardHeader><CardTitle>Alternatives</CardTitle><p>Describe the options and their attributes. Dimensions evaluate each option separately.</p></CardHeader><CardContent>
      {profile.alternatives.map((alternative, index) => <div key={index} className="studio-schema">
        <div className="studio-grid">
          <label className="studio-field">Alternative ID<Input required value={alternative.id} onChange={(e) => setProfile({ ...profile, alternatives: profile.alternatives.map((a, i) => i === index ? { ...a, id: e.target.value } : a) })} /></label>
          <label className="studio-field">Label<Input value={alternative.label} onChange={(e) => setProfile({ ...profile, alternatives: profile.alternatives.map((a, i) => i === index ? { ...a, label: e.target.value } : a) })} /></label>
        </div>
        <JsonField label="Attributes" value={alternative.attributes} onChange={(attributes) => setProfile({ ...profile,
          alternatives: profile.alternatives.map((a, i) => i === index ? { ...a, attributes: attributes as Record<string, unknown> } : a) })} />
        <Button type="button" variant="secondary" disabled={profile.alternatives.length === 1} onClick={() => setProfile({ ...profile, alternatives: profile.alternatives.filter((_, i) => i !== index) })}>Remove alternative</Button>
      </div>)}
      <Button type="button" variant="secondary" onClick={() => setProfile({ ...profile, alternatives: [...profile.alternatives, { id: `alternative-${profile.alternatives.length + 1}`, label: "", attributes: {} }] })}>Add alternative</Button>
    </CardContent></Card>}
    {(!section || !["overview", "alternatives"].includes(section)) && <Card><CardHeader><CardTitle>Decision dimensions</CardTitle><p>Select relevant dimensions, pin their contracts, and configure evaluation.</p></CardHeader><CardContent>
      <div className="studio-grid">{ids.filter((id) => !filter || id === filter).map((id) => {
        const selected = profile.dimensions.some((d) => d.dimension_id === id);
        const definition = dimensions.find((d) => d.id === id)!;
        return <label className="studio-check" key={id}><input type="checkbox" checked={selected} onChange={(event) => {
          if (!event.target.checked) setProfile({ ...profile, dimensions: profile.dimensions.filter((d) => d.dimension_id !== id) });
          else {
            const binding = bindings.find((b) => b.dimension_id === id && b.capability_id === profile.capability_id && b.enabled);
            setProfile({ ...profile, dimensions: [...profile.dimensions, { dimension_id: id, version: definition.version,
              required: true, weight: definition.type === "rules" ? 0 : 1, configuration: {},
              binding_id: binding?.id ?? null, binding_version: binding?.version ?? null }] });
          }
        }} />{definition.name}</label>;
      })}</div>
      {profile.dimensions.map((item, index) => {
        if (filter && item.dimension_id !== filter) return null;
        const definition = dimensions.find((d) => d.id === item.dimension_id && d.version === item.version);
        return <section key={item.dimension_id} className="studio-schema">
          <h3>{definition?.name ?? item.dimension_id}</h3>
          {definition?.type === "rules" && <RuleSummary configuration={item.configuration} />}
          {!definition && <p className="studio-error">This pinned dimension contract is unavailable.</p>}
          <div className="studio-grid">
            <label className="studio-field">Contract version<select className="ds-select" value={item.version} onChange={(e) => changeDimension(index, { version: e.target.value })}>
              {!definition && <option value={item.version}>{item.version} (unavailable)</option>}
              {dimensions.filter((d) => d.id === item.dimension_id).map((d) => <option key={d.version} value={d.version}>{d.version} · {d.evaluator_id}@{d.evaluator_version}</option>)}
            </select></label>
            {definition?.type !== "rules" && <label className="studio-field">Weight<Input type="number" min={0} step="any" required value={item.weight} onChange={(e) => changeDimension(index, { weight: e.target.valueAsNumber })} /></label>}
            <label className="studio-field">Plugin output binding<select className="ds-select" value={item.binding_id ? `${item.binding_id}|${item.binding_version}` : ""} onChange={(e) => {
              const binding = bindings.find((b) => `${b.id}|${b.version}` === e.target.value);
              changeDimension(index, { binding_id: binding?.id ?? null, binding_version: binding?.version ?? null });
            }}><option value="">Configuration / runtime input</option>
              {item.binding_id && !bindings.some((b) => b.id === item.binding_id && b.version === item.binding_version) && <option value={`${item.binding_id}|${item.binding_version}`}>{item.binding_id}@{item.binding_version} (unavailable)</option>}
              {bindings.filter((b) => b.dimension_id === item.dimension_id && b.capability_id === profile.capability_id).map((b) => <option key={b.id} value={`${b.id}|${b.version}`} disabled={!b.enabled}>{b.source_path} → {b.dimension_id} · {b.version}</option>)}
            </select></label>
          </div>
          <label className="studio-check"><input type="checkbox" checked={item.required} onChange={(e) => changeDimension(index, { required: e.target.checked })} />Required</label>
          {definition && <SchemaField key={`${item.dimension_id}-${item.version}`} schema={definition.configuration_schema} value={item.configuration}
            onChange={(configuration) => changeDimension(index, { configuration: configuration as Record<string, unknown> })} />}
        </section>;
      })}
    </CardContent></Card>}
    {(!section || section === "overview") && <details className="studio-card"><summary>Runtime context schema</summary>
      <p>Validate application-supplied context separately from business configuration and plugin inputs.</p>
      <JsonField label="JSON Schema" value={profile.context_schema} onChange={(schema) => setProfile({ ...profile, context_schema: schema as Profile["context_schema"] })} />
    </details>}
    {error && <div className="studio-error" role="alert">{error}</div>}
    <Button disabled={busy || !profile.dimensions.length} type="submit">{busy ? "Saving…" : "Save profile"}</Button>
  </form>;
}
