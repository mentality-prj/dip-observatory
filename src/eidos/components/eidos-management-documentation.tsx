"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEidosCopy } from "@/eidos/lib/eidos-i18n";
import type { Locale } from "@/lib/observatory-i18n";

type Props = {
  locale: Locale;
  id?: string;
};

export function EidosManagementDocumentation({ locale, id }: Props) {
  const copy = getEidosCopy(locale);

  return (
    <Card
      id={id}
      className="border-cyan-300/20 bg-[linear-gradient(180deg,rgba(12,20,34,0.96),rgba(6,10,18,0.98))]"
    >
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="cyan">{copy.header.documentationBadge}</Badge>
        </div>
        <CardTitle>{copy.documentation.title}</CardTitle>
        <CardDescription>{copy.documentation.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        {copy.documentation.sections.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-white/8 bg-white/4 p-4"
          >
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-100">
              {section.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {section.description}
            </p>
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm text-slate-400">
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
