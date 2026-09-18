"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, CardContent, CardDescription, CardHeader, CardTitle } from "@/design-system";
import { observatoryHref } from "@/lib/platform-urls";
import { studioRequest, type Audit, type Profile } from "./contracts";
import { JsonField, SchemaField, schemaDefault } from "./schema-form";

export function ProfileRunner({ profile }: { profile: Profile }) {
  const [context, setContext] = useState(schemaDefault(profile.context_schema));
  const [input, setInput] = useState<unknown>({});
  const [result, setResult] = useState<Audit | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="rounded-2xl border border-white/10 bg-white/[0.03]"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        setResult(null);
        try {
          setResult(
            await studioRequest<Audit>(
              `decision-profiles/${encodeURIComponent(profile.id)}/execute`,
              {
                method: "POST",
                body: JSON.stringify({ context, plugin_input: input }),
              },
            ),
          );
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : String(reason));
        } finally {
          setBusy(false);
        }
      }}
    >
      <CardHeader>
        <CardTitle>Evaluate {profile.name}</CardTitle>
        <CardDescription>
          Supply context for this execution. The result will be recorded in Observatory.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SchemaField
          schema={profile.context_schema}
          value={context}
          onChange={setContext}
          label="Runtime decision context"
        />
        <JsonField label="Plugin capability input" value={input} onChange={setInput} />
        <Button disabled={busy} type="submit">
          {busy ? "Evaluating…" : "Evaluate alternatives"}
        </Button>
        {error && (
          <div role="alert" className="studio-error">
            {error}
          </div>
        )}
        {result && (
          <div className="studio-success" role="status">
            {result.status}: {result.selected_alternative ?? "No feasible alternative"}.{" "}
            <Link
              href={observatoryHref(
                `decisions?decision=${encodeURIComponent(result.decision_id)}`,
              )}
            >
              Inspect decision and audit ↗
            </Link>
          </div>
        )}
      </CardContent>
    </form>
  );
}
