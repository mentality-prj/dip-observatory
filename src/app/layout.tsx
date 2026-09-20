import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://qdip.ai"),
  title: { default: "QDIP — Decision Engine for consistent, explainable decisions", template: "%s · QDIP" },
  description: "QDIP evaluates alternatives, priorities, constraints and uncertainty to provide a recommendation with supporting evidence. The responsible person makes the final decision.",
  openGraph: { siteName: "QDIP", type: "website" },
};
export default function RootLayout({ children }: { children: ReactNode }) {return <html lang="en" suppressHydrationWarning><body><a className="skip-link" href="#main-content">Skip to main content</a>{children}</body></html>}
