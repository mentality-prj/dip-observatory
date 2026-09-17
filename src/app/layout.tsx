import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://qdip.ai"),
  title: {
    default: "QDIP — Quality-driven Decision Intelligence Platform",
    template: "%s · QDIP",
  },
  description:
    "QDIP connects decision authoring, governed execution and observable outcomes across Studio, Engine and Observatory.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
