"use client";

import dynamic from "next/dynamic";
import { Card, CardContent } from "@/design-system";
import { findUseCaseByPlugin, type StudioRendererId } from "@/use-cases/registry";
import type { Audit } from "./contracts";

const studioRenderers: Record<StudioRendererId, React.ComponentType<{ audit: Audit }>> = {
  "gas-forecast": dynamic(() => import("@/use-cases/gas-forecast/studio-panel"), {
    loading: () => <Card><CardContent><p role="status">Loading application view…</p></CardContent></Card>,
  }),
};

function GenericDecisionPanel({ audit }: { audit: Audit }) {
  return <Card><CardContent>
    <div className="studio-table-wrap"><table className="studio-table"><thead><tr><th>Alternative</th><th>Feasible</th><th>Score</th><th>Rank</th><th>Required actions</th></tr></thead>
      <tbody>{audit.dimension_results.map((alternative) => <tr key={alternative.alternative_id}>
        <td>{alternative.alternative_id}</td><td>{alternative.feasible ? "Yes" : "No"}</td><td>{alternative.score?.toFixed(4) ?? "—"}</td><td>{alternative.rank ?? "—"}</td>
        <td>{alternative.dimensions.flatMap((dimension) => dimension.required_actions).join(", ") || "—"}</td>
      </tr>)}</tbody></table></div>
  </CardContent></Card>;
}

export function StudioUseCasePanel({ audit }: { audit: Audit }) {
  const useCase = findUseCaseByPlugin(audit.profile.plugin_id, audit.profile.capability_id);
  const rendererId = useCase?.presentation.studioRenderer;
  if (!rendererId) return <GenericDecisionPanel audit={audit} />;
  const Renderer = studioRenderers[rendererId];
  return <Renderer audit={audit} />;
}
