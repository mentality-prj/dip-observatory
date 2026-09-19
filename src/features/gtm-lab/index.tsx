import type { Locale } from "@/lib/observatory-i18n";

export function GtmLabWorkspace({ locale: _locale }: { locale: Locale }) {
  return (
    <main className="px-4 pb-12 md:px-6 xl:px-10">
      <section className="rounded-[28px] border border-violet-300/15 bg-slate-950/55 p-8 shadow-2xl shadow-black/20">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">QDIP · GTM LAB</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">GTM Lab</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Frontend workspace is being implemented against the GTM Lab backend contract.</p>
      </section>
    </main>
  );
}
