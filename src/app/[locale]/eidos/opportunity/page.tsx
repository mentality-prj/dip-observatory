import { headers } from "next/headers";

import {
  EIDOS_DECISION_DATE,
  EIDOS_MARKET_SNAPSHOT,
  EIDOS_Q1_2027_HISTORY,
  EIDOS_Q1_2027_OUTCOME,
  EIDOS_TARGET_CONTRACT,
} from "@/eidos/data/synthetic-futures-data";
import { FuturesOpportunityView } from "@/eidos/components/futures-opportunity-view";

export function generateStaticParams() {
  return ["en", "pl"].map((locale) => ({ locale }));
}

async function fetchDecision() {
  // Build an absolute URL from request headers (Next.js server component).
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  // Build an absolute URL. Prefer x-forwarded-proto for proxied environments;
  // fall back to http in development mode and https elsewhere.
  const forwardedProto = headersList.get("x-forwarded-proto");
  const isDev = process.env.NODE_ENV === "development";
  const loopbackHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
  const isLoopback = loopbackHosts.some((h) => host.split(":")[0] === h);
  const protocol =
    forwardedProto ?? (isDev || isLoopback ? "http" : "https");
  const url = `${protocol}://${host}/api/dip/futures-mispricing`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      decisionDate: EIDOS_DECISION_DATE,
      targetContract: EIDOS_TARGET_CONTRACT,
      marketSnapshot: EIDOS_MARKET_SNAPSHOT,
      historicalObservations: EIDOS_Q1_2027_HISTORY,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(
      `DIP futures mispricing API error: ${err.error ?? response.statusText}`,
    );
  }

  return response.json();
}

export default async function EidosOpportunityPage() {
  let decision = null;
  let error = null;

  try {
    const result = await fetchDecision();
    decision = result.decision;
  } catch (err) {
    error = err instanceof Error ? err.message : "DIP service unavailable";
  }

  if (error || !decision) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-bold text-red-400">
            DIP Service Unavailable
          </h1>
          <p className="text-zinc-400 text-sm">{error}</p>
          <p className="text-zinc-600 text-xs">
            The Observatory requires DIP Core to compute decisions. No local
            fallback is available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FuturesOpportunityView
      decision={decision}
      decisionDate={EIDOS_DECISION_DATE}
      marketSnapshot={EIDOS_MARKET_SNAPSHOT}
      outcome={EIDOS_Q1_2027_OUTCOME}
      targetContract={EIDOS_TARGET_CONTRACT}
    />
  );
}
