import type { Metadata } from "next";

import { QdipSite } from "@/components/marketing/qdip-site";

export const metadata: Metadata = {
  title: { absolute: "qdip — Quality-driven Decision Intelligence Platform" },
  description:
    "Model alternatives, quantify uncertainty and preserve the evidence behind every decision with qdip Engine, Studio and Observatory.",
  alternates: {
    canonical: "https://qdip.ai/en",
    languages: {
      en: "https://qdip.ai/en",
      uk: "https://qdip.ai/uk",
      pl: "https://qdip.ai/pl",
    },
  },
  openGraph: {
    title: "qdip — Decisions you can defend",
    description:
      "A quality-driven Decision Intelligence Platform for explainable, auditable outcomes.",
    url: "https://qdip.ai",
    siteName: "qdip",
    type: "website",
  },
};

export default function Home() {
  return <QdipSite locale="en" />;
}
