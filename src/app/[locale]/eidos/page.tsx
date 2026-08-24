import { notFound } from "next/navigation";

import { EidosWorkspace } from "@/eidos/components/eidos-workspace";
import { isSupportedLocale } from "@/lib/observatory-i18n";

export default async function EidosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return <EidosWorkspace />;
}
