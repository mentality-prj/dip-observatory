import { findUseCaseByPlugin } from "@/use-cases/registry";
import type { Audit } from "./contracts";
import { GasForecastPanel } from "./gas-forecast-panel";

function GenericDecisionPanel({ audit }: { audit: Audit }) {
  return <section className="studio-card">
    <div className="studio-table-wrap"><table className="studio-table"><thead><tr><th>Alternative</th><th>Feasible</th><th>Score</th><th>Rank</th><th>Required actions</th></tr></thead>
      <tbody>{audit.dimension_results.map((alternative) => <tr key={alternative.alternative_id}>
        <td>{alternative.alternative_id}</td><td>{alternative.feasible ? "Yes" : "No"}</td><td>{alternative.score?.toFixed(4) ?? "—"}</td><td>{alternative.rank ?? "—"}</td>
        <td>{alternative.dimensions.flatMap((dimension) => dimension.required_actions).join(", ") || "—"}</td>
      </tr>)}</tbody></table></div>
  </section>;
}

/**
 * Studio extension point for application-specific decision presentation.
 * A new plugin works immediately with GenericDecisionPanel. Specialized UX is
 * opt-in through `studioRenderer` in src/use-cases/registry.ts.
 */
export function StudioUseCasePanel({ audit }: { audit: Audit }) {
  const useCase = findUseCaseByPlugin(audit.profile.plugin_id, audit.profile.capability_id);
  switch (useCase?.plugin?.studioRenderer) {
    case "gas-forecast":
      return <GasForecastPanel audit={audit} />;
    default:
      return <GenericDecisionPanel audit={audit} />;
  }
}
