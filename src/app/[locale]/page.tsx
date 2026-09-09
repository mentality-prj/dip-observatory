import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";

import { DecisionCanvas } from "@/components/observatory/decision-canvas";
import { getObservatoryBootstrapPayload } from "@/lib/dip-api";
import {
  buildLocalePath,
  isSupportedLocale,
  type Locale,
} from "@/lib/observatory-i18n";

export default async function LocalizedHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  await connection();
  const initialPayload = await getObservatoryBootstrapPayload();

  return (
    <>
      <div className="mx-auto w-full max-w-[1700px] px-4 pt-4 md:px-6 xl:px-10">
        <Link
          href={buildLocalePath("/gas-forecast", locale as Locale)}
          className="group flex items-center justify-between gap-4 rounded-[20px] border border-cyan-300/15 bg-cyan-300/6 px-5 py-4 outline-none transition hover:border-cyan-300/30 hover:bg-cyan-300/10 focus-visible:ring-2 focus-visible:ring-cyan-300/60"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Demonstrator
            </p>
            <p className="mt-1 text-base font-semibold text-white">
              European Gas Forecasting
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Providers, market inputs and the forecasting engine in one workspace.
            </p>
          </div>
          <span className="shrink-0 text-sm font-medium text-cyan-300 transition group-hover:translate-x-0.5">
            Open →
          </span>
        </Link>
      </div>
      <DecisionCanvas
        initialPayload={initialPayload}
        initialLocale={locale as Locale}
      />
    </>
  );
}
