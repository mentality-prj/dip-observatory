import { notFound } from "next/navigation";
import { ProfileDetail } from "@/studio/profile-detail";
import { profileSections, type ProfileSection } from "@/studio/presentation";

export default async function ProfilePage({ params }: { params: Promise<{ id: string; section?: string[] }> }) {
  const { id, section } = await params;
  const active = section?.[0] ?? "overview";
  if ((section?.length ?? 0) > 1 || !profileSections.includes(active as ProfileSection)) notFound();
  return <ProfileDetail key={`${id}-${active}`} id={id} section={active as ProfileSection} />;
}
