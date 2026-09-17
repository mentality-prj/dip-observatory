import { notFound } from "next/navigation";
import { PrototypeShell } from "@/components/observatory/prototype-shell";
import { isSupportedLocale } from "@/lib/observatory-i18n";
import { ApplicationFrontend, hasApplicationFrontend } from "@/use-cases/application-runtime";
import { findUseCaseByRoute } from "@/use-cases/registry";

export default async function UseCasePage({ params }: { params: Promise<{ locale: string; useCase: string }> }) {
  const { locale, useCase: routeSegment } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const application = findUseCaseByRoute(`/${routeSegment}`);
  if (!application || !hasApplicationFrontend(application.id)) notFound();

  return (
    <PrototypeShell locale={locale} theme={application.presentation.theme}>
      <ApplicationFrontend id={application.id} locale={locale} />
    </PrototypeShell>
  );
}
