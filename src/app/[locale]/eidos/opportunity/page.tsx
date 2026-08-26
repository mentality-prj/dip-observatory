import { FuturesOpportunityView } from "@/eidos/components/futures-opportunity-view";

export function generateStaticParams() {
  return ["en", "pl"].map((locale) => ({ locale }));
}

export default function EidosOpportunityPage() {
  return <FuturesOpportunityView />;
}
