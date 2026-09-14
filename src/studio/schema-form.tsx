"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { JsonSchema } from "./contracts";

export function schemaDefault(schema: JsonSchema): unknown {
  if (schema.default !== undefined) return structuredClone(schema.default);
  if (schema.enum?.length) return schema.enum[0];
  if (schema.type === "object") return Object.fromEntries((schema.required ?? [])
    .map((key) => [key, schemaDefault(schema.properties?.[key] ?? {})]));
  if (schema.type === "array") return [];
  if (schema.type === "boolean") return false;
  if (schema.type === "number" || schema.type === "integer") return schema.minimum ?? 0;
  if (schema.type === "string") return "";
  return null;
}

export function JsonField({ label, value, onChange }: {
  label: string; value: unknown; onChange: (value: unknown) => void;
}) {
  const id = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [state, setState] = useState({ value, text: JSON.stringify(value, null, 2), error: "" });
  if (value !== state.value) setState({ value, text: JSON.stringify(value, null, 2), error: "" });
  const { text, error } = state;
  useEffect(() => { inputRef.current?.setCustomValidity(error); }, [error]);
  return <label className="studio-field" htmlFor={id}>{label}
    <textarea ref={inputRef} id={id} value={text} rows={5} spellCheck={false} aria-invalid={Boolean(error)}
      onChange={(event) => {
        const text = event.target.value;
        try {
          const parsed = JSON.parse(text);
          event.target.setCustomValidity(""); setState({ value: parsed, text, error: "" }); onChange(parsed);
        } catch {
          const message = "Enter valid JSON before saving.";
          event.target.setCustomValidity(message); setState({ ...state, text, error: message });
        }
      }} />
    {error && <span role="alert" className="studio-error">{error}</span>}
  </label>;
}

export function SchemaField({ schema, value, onChange, label = "Configuration", root, depth = 0 }: {
  schema: JsonSchema; value: unknown; onChange: (value: unknown) => void;
  label?: string; root?: JsonSchema; depth?: number;
}) {
  const id = useId();
  const document = root ?? schema;
  if (depth > 12) return <JsonField label={label} value={value} onChange={onChange} />;
  if (schema.$ref?.startsWith("#/$defs/")) {
    const resolved = document.$defs?.[schema.$ref.slice(8)];
    if (resolved) return <SchemaField schema={resolved} value={value} onChange={onChange} label={label} root={document} depth={depth + 1} />;
  }
  if (schema.enum) return <label className="studio-field" htmlFor={id}>{label}
    <select id={id} value={JSON.stringify(value)} onChange={(event) => onChange(JSON.parse(event.target.value))}>
      {schema.enum.map((option) => <option key={JSON.stringify(option)} value={JSON.stringify(option)}>{String(option)}</option>)}
    </select>
  </label>;
  if (schema.type === "object" && schema.properties && Object.keys(schema.properties).length) {
    const object = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
    return <fieldset className="studio-schema"><legend>{label}</legend>
      {schema.description && <p>{schema.description}</p>}
      {Object.entries(schema.properties).map(([key, child]) => {
        const required = schema.required?.includes(key);
        const present = key in object;
        return <div key={key} className="studio-schema-property">
          {!required && <label className="studio-check"><input type="checkbox" checked={present}
            onChange={(event) => {
              const next = { ...object };
              if (event.target.checked) next[key] = schemaDefault(child); else delete next[key];
              onChange(next);
            }} />{child.title ?? key.replaceAll("_", " ")}</label>}
          {(present || required) && <SchemaField schema={child} root={document} value={object[key]} depth={depth + 1}
            label={child.title ?? key.replaceAll("_", " ")} onChange={(next) => onChange({ ...object, [key]: next })} />}
        </div>;
      })}
    </fieldset>;
  }
  if (schema.type === "array" && schema.items) {
    const items = Array.isArray(value) ? value : [];
    return <fieldset className="studio-schema"><legend>{label}</legend>
      {items.map((item, index) => <div key={index} className="studio-array-item">
        <SchemaField schema={schema.items!} root={document} value={item} label={`${label} ${index + 1}`} depth={depth + 1}
          onChange={(next) => onChange(items.map((entry, i) => i === index ? next : entry))} />
        <button type="button" className="studio-secondary" onClick={() => onChange(items.filter((_, i) => i !== index))}>Remove item {index + 1}</button>
      </div>)}
      <button type="button" className="studio-secondary" onClick={() => onChange([...items, schemaDefault(schema.items!)])}>Add item</button>
    </fieldset>;
  }
  if (schema.type === "boolean") return <label className="studio-check"><input type="checkbox" checked={Boolean(value)}
    onChange={(event) => onChange(event.target.checked)} />{label}</label>;
  if (["string", "number", "integer"].includes(schema.type ?? "")) return <label className="studio-field" htmlFor={id}>{label}
    <input id={id} required minLength={schema.minLength} min={schema.minimum} max={schema.maximum}
      type={schema.type === "string" ? "text" : "number"} step={schema.type === "integer" ? 1 : "any"}
      value={typeof value === "number" || typeof value === "string" ? value : ""}
      onChange={(event) => onChange(schema.type === "string" ? event.target.value :
        event.target.value === "" ? undefined : event.target.valueAsNumber)} />
    {schema.description && <small>{schema.description}</small>}
  </label>;
  return <JsonField label={label} value={value === undefined ? null : value} onChange={onChange} />;
}
