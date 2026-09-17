import { DecisionAuditView } from "@/studio/decision-audit-view";
import "@/studio/studio.css";

export const metadata = { title: "Decision Audit · QDIP Observatory" };

export default async function DecisionsPage({ searchParams }: {
  searchParams: Promise<{ decision?: string }>;
}) {
  const { decision } = await searchParams;
  return <DecisionAuditView initialId={decision} />;
}
