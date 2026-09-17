import type { Metadata } from "next";

import { QdipSite } from "@/components/marketing/qdip-site";

export const metadata: Metadata = {
  title: "QDIP — Quality-driven Decision Intelligence Platform",
  description:
    "Model alternatives, quantify uncertainty and preserve the evidence behind every decision with QDIP Engine, Studio and Observatory.",
  alternates: { canonical: "https://qdip.ai" },
  openGraph: {
    title: "QDIP — Decisions you can defend",
    description:
      "A quality-driven Decision Intelligence Platform for explainable, auditable outcomes.",
    url: "https://qdip.ai",
    siteName: "QDIP",
    type: "website",
  },
};

export default function Home() {
  return <QdipSite />;
}
