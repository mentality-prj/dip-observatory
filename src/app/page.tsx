import { connection } from "next/server";

import { DecisionCanvas } from "@/components/observatory/decision-canvas";
import { getObservatoryBootstrapPayload } from "@/lib/dip-api";

export default async function Home() {
  await connection();
  const initialPayload = await getObservatoryBootstrapPayload();

  return <DecisionCanvas initialPayload={initialPayload} />;
}
