import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EidosLocaleSwitcher } from "@/eidos/components/eidos-locale-switcher";
import { EidosManagementDocumentation } from "@/eidos/components/eidos-management-documentation";
import { Badge } from "@/components/ui/badge";
import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";
import { getEidosCopy } from "@/eidos/lib/eidos-i18n";

const EIDOS_ACTIVE_LOCALES = new Set(["en", "pl"]);
const EIDOS_FALLBACK_LOCALE: Locale = "en";

export function generateStaticParams() {
  return ["en", "pl"].map((locale) => ({ locale }));
}

export default async function EidosDocumentationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!EIDOS_ACTIVE_LOCALES.has(locale)) {
    redirect(buildLocalePath("/eidos/documentation", EIDOS_FALLBACK_LOCALE));
  }

  const resolvedLocale = locale as Locale;
  const copy = getEidosCopy(resolvedLocale);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 md:px-6 xl:px-10">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
                {copy.header.eyebrow}
              </span>
              <Badge variant="cyan" className="gap-1.5">
                <BookOpen className="h-3 w-3" aria-hidden="true" />
                {copy.header.documentationBadge}
              </Badge>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              {copy.documentation.title}
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              {copy.documentation.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <EidosLocaleSwitcher locale={resolvedLocale} />
            <Link
              href={buildLocalePath("/eidos", resolvedLocale)}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3.5 py-2 text-sm text-cyan-100 outline-none transition hover:border-cyan-200/60 hover:bg-cyan-300/16 focus-visible:ring-2 focus-visible:ring-cyan-300/60"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {copy.header.backToDashboard}
            </Link>
          </div>
        </header>

        <EidosManagementDocumentation locale={resolvedLocale} />

        <p className="text-center text-xs text-slate-600">
          {copy.footerDisclaimer}
        </p>
      </div>
    </main>
  );
}
