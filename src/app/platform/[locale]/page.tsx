import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  marketingLocales,
  type MarketingLocale,
} from "@/components/marketing/qdip-copy";
import { QdipSite } from "@/components/marketing/qdip-site";

const metadataByLocale: Record<MarketingLocale, { title: string; description: string }> = {
  en: {
    title: "QDIP — Quality-driven Decision Intelligence Platform",
    description: "Model alternatives, quantify uncertainty and preserve the evidence behind every decision.",
  },
  uk: {
    title: "QDIP — платформа інтелектуального прийняття рішень",
    description: "Моделюйте альтернативи, оцінюйте невизначеність і зберігайте докази для кожного рішення.",
  },
  pl: {
    title: "QDIP — platforma Decision Intelligence",
    description: "Modeluj alternatywy, szacuj niepewność i zachowuj dowody stojące za każdą decyzją.",
  },
};

function isMarketingLocale(locale: string): locale is MarketingLocale {
  return marketingLocales.includes(locale as MarketingLocale);
}

export function generateStaticParams() {
  return marketingLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isMarketingLocale(locale)) return {};
  const value = metadataByLocale[locale];
  return {
    title: { absolute: value.title },
    description: value.description,
    alternates: {
      canonical: `https://qdip.ai/${locale}`,
      languages: {
        en: "https://qdip.ai/en",
        uk: "https://qdip.ai/uk",
        pl: "https://qdip.ai/pl",
      },
    },
  };
}

export default async function LocalizedPlatformPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isMarketingLocale(locale)) notFound();
  return <QdipSite locale={locale} />;
}
