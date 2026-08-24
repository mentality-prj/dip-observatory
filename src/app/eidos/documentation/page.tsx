import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  buildLocalePath,
  detectLocaleFromHeader,
  type Locale,
} from "@/lib/observatory-i18n";

const EIDOS_FALLBACK_LOCALE: Locale = "en";

export default async function EidosDocumentationRedirect() {
  const headersList = await headers();
  const locale = detectLocaleFromHeader(headersList.get("accept-language"));

  redirect(
    buildLocalePath(
      "/eidos/documentation",
      locale === "pl" ? "pl" : EIDOS_FALLBACK_LOCALE,
    ),
  );
}
