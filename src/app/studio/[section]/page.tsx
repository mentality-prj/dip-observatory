import { notFound } from "next/navigation";
import { DecisionStudio } from "@/studio/decision-studio";

export default async function StudioPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!["profiles", "plugins", "dimensions", "bindings", "constraints", "policies", "compliance"].includes(section)) notFound();
  return <DecisionStudio section={section} />;
}
