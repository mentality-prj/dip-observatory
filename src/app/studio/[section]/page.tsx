import { notFound, redirect } from "next/navigation";
import { DecisionStudio } from "@/features/studio";
import { studioHref } from "@/lib/platform-urls";

export default async function StudioPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (["constraints", "policies", "compliance"].includes(section)) redirect(studioHref("profiles"));
  if (!["profiles", "plugins", "dimensions", "bindings"].includes(section)) notFound();
  return <DecisionStudio section={section} />;
}
