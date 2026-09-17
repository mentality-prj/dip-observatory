"use client";

import Link from "next/link";
import { studioHref } from "@/lib/platform-urls";
import { Breadcrumbs, outputLabel } from "./presentation";
import { useEffect, useState } from "react";
import { BindingEditor } from "./binding-editor";
import { emptyProfile, studioRequest, type Dimension, type Plugin, type Profile, type ProfileView } from "./contracts";
import { ProfileEditor } from "./profile-editor";
import { ProfileRunner } from "./profile-runner";

const titles: Record<string, string> = {
  profiles: "Decision Profiles", plugins: "Plugins & Capabilities", dimensions: "Dimension Registry",
  bindings: "Output Bindings",
};

export function DecisionStudio({ section }: { section: string }) {
  const [data, setData] = useState<{ dimensions: Dimension[]; plugins: Plugin[]; profiles: ProfileView[] } | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editor, setEditor] = useState<{ profile: Profile; existing: boolean; key: number } | null>(null);
  const [pluginId, setPluginId] = useState("");
  const [deleting, setDeleting] = useState("");
  const [retry, setRetry] = useState(0);
  const [runningProfile, setRunningProfile] = useState<Profile | null>(null);
  useEffect(() => {
    let disposed = false;
    Promise.all([studioRequest<Dimension[]>("dimensions"), studioRequest<Plugin[]>("decision-studio/plugins"),
      (section === "profiles" ? studioRequest<ProfileView[]>("decision-profiles") : Promise.resolve([]))]).then(([dimensions, plugins, profiles]) => {
      if (!disposed) { setData({ dimensions, plugins, profiles }); setError(""); }
    }).catch((reason) => { if (!disposed) setError(String(reason)); });
    return () => { disposed = true; };
  }, [retry, section]);
  async function refreshProfiles() {
    const profiles = await studioRequest<ProfileView[]>("decision-profiles");
    setData((previous) => previous && { ...previous, profiles });
  }
  function openProfile(profile: Profile, existing: boolean) {
    // API validation belongs to the view, not the persisted configuration contract.
    const clean = Object.fromEntries(Object.entries(profile).filter(([key]) => key !== "validation")) as Profile;
    setEditor({ profile: clean, existing, key: Date.now() }); setMessage("");
  }
  return <>
    <Breadcrumbs items={[...(["plugins", "bindings"].includes(section) ? [{ label: "Plugin Registry", href: studioHref("plugins") }] : []), { label: titles[section] }]} />
    <h1>{titles[section]}</h1>
    <p>Domain intelligence, reusable dimensions, and business configuration.</p>
    {error && <div role="alert" className="studio-error">{error} <button type="button" className="studio-secondary" onClick={() => setRetry(retry + 1)}>Retry</button></div>}
    {message && <div role="status" className="studio-success">{message}</div>}
    {!data && !error && <p role="status">Loading Decision Studio…</p>}
    {data && <>
      {section === "plugins" && <div className="studio-grid">{data.plugins.map((plugin) => <article className="studio-card" key={plugin.name}>
        <header><h2>{plugin.ui?.label ?? plugin.name}</h2><span className="studio-tag">{plugin.enabled ? "Enabled" : "Disabled"}</span></header>
        <p>{plugin.description}</p><dl><dt>Plugin version</dt><dd>{plugin.version}</dd><dt>Category</dt><dd>{plugin.ui?.category ?? "General"}</dd></dl>
        <h3>Capabilities</h3><ul>{plugin.capabilities.map((c) => <li key={c}>{c} <span className="studio-muted">@{plugin.capability_versions[c] ?? "unversioned"}</span></li>)}</ul>
        <h3>Available outputs</h3>{plugin.dimension_outputs.length ? <ul>{plugin.dimension_outputs.map((o) => <li key={`${o.capability_id}-${o.dimension_id}-${o.source_path}`}>{outputLabel(o.capability_id, o.source_path)} → {data.dimensions.find((d) => d.id === o.dimension_id)?.name ?? o.dimension_id}</li>)}</ul> : <p>No dimension outputs declared.</p>}
      </article>)}</div>}
      {section === "dimensions" && <div className="studio-grid">{data.dimensions.map((dimension) => <article className="studio-card" key={`${dimension.id}-${dimension.version}`}>
        <header><h2>{dimension.name}</h2><span className="studio-tag">{dimension.version}</span></header>
        <dl><dt>ID</dt><dd>{dimension.id}</dd><dt>Type</dt><dd>{dimension.type}</dd><dt>Phase</dt><dd>{dimension.phase ?? "Unavailable"}</dd><dt>Source</dt><dd>{dimension.source}</dd><dt>Evaluator</dt><dd>{dimension.evaluator_id}@{dimension.evaluator_version}</dd><dt>Blocking</dt><dd>{dimension.blocking ? "Yes" : "No"}</dd></dl>
        <details><summary>Configuration schema</summary><pre>{JSON.stringify(dimension.configuration_schema, null, 2)}</pre></details>
        <details><summary>Value schema</summary><pre>{JSON.stringify(dimension.value_schema, null, 2)}</pre></details>
      </article>)}</div>}
      {section === "bindings" && <>
        <label className="studio-field">Plugin<select value={pluginId} onChange={(e) => setPluginId(e.target.value)}><option value="">Select a plugin</option>{data.plugins.map((p) => <option key={p.name} value={p.name}>{p.ui?.label ?? p.name}</option>)}</select></label>
        {data.plugins.find((p) => p.name === pluginId) && <BindingEditor key={pluginId} plugin={data.plugins.find((p) => p.name === pluginId)!} dimensions={data.dimensions} />}
      </>}
      {section === "profiles" && <>
        <div className="studio-toolbar">
          <button type="button" onClick={() => openProfile(emptyProfile(data.plugins.find((p) => p.enabled)), false)}>Create profile</button>
          <label className="studio-field">Import profile JSON<input type="file" accept="application/json,.json" onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            try {
              const parsed = JSON.parse(await file.text());
              if (!parsed.id || !Array.isArray(parsed.dimensions) || !Array.isArray(parsed.alternatives)) throw new Error("Select a DecisionProfile JSON file.");
              openProfile(parsed, false); setError("");
            } catch (reason) { setError(String(reason)); }
            e.target.value = "";
          }} /></label>
        </div>
        {!data.profiles.length && <div className="studio-card"><h2>No profiles yet</h2><p>Create a profile or import an example to configure alternatives, dimensions, and rules.</p></div>}
        <div className="studio-grid">{data.profiles.map((profile) => <article key={profile.id} className="studio-card">
          <header><h2><Link href={studioHref(`profiles/${encodeURIComponent(profile.id)}`)}>{profile.name}</Link></h2><span className="studio-tag">{profile.validation.status}</span></header>
          <p>{profile.plugin_id} · {profile.capability_id}<br />Version {profile.version} · {profile.active ? "Active" : "Draft"}</p>
          <p>{profile.dimensions.map((d) => d.dimension_id).join(" · ")}</p>
          {profile.validation.errors.map((error) => <div key={error} className="studio-error">{error}</div>)}
          {profile.validation.warnings.map((warning) => <p key={warning}>{warning}</p>)}
          <div className="studio-toolbar"><Link className="studio-secondary" href={studioHref(`profiles/${encodeURIComponent(profile.id)}`)}>Open profile</Link>
            <button type="button" className="studio-secondary" disabled={!profile.active || profile.validation.status !== "VALID"}
              onClick={() => setRunningProfile(profile)}>Evaluate</button>
            {deleting !== profile.id ? <button type="button" className="studio-secondary" onClick={() => setDeleting(profile.id)}>Delete</button> : <>
              <button type="button" className="studio-danger" onClick={async () => {
                try { await studioRequest(`decision-profiles/${encodeURIComponent(profile.id)}`, { method: "DELETE" });
                  if (editor?.profile.id === profile.id) setEditor(null);
                  setDeleting(""); await refreshProfiles(); setMessage("Profile deleted. Historical decisions are retained.");
                } catch (reason) { setError(String(reason)); }
              }}>Confirm delete</button><button type="button" className="studio-secondary" onClick={() => setDeleting("")}>Cancel</button>
            </>}
          </div>
        </article>)}</div>
        {editor && <ProfileEditor key={editor.key} initial={editor.profile} existing={editor.existing}
          plugins={data.plugins} dimensions={data.dimensions}
          onSave={async (profile) => {
            await studioRequest(editor.existing ? `decision-profiles/${encodeURIComponent(profile.id)}` : "decision-profiles",
              { method: editor.existing ? "PATCH" : "POST", body: JSON.stringify(profile) });
            setEditor(null); await refreshProfiles(); setMessage(`Profile ${profile.name} saved at version ${profile.version}.`);
          }} />}
        {runningProfile && <ProfileRunner key={`${runningProfile.id}-${runningProfile.version}`} profile={runningProfile} />}
      </>}
    </>}
  </>;
}
