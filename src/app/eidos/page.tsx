import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  buildLocalePath,
  detectLocaleFromHeader,
} from "@/lib/observatory-i18n";

export default async function EidosRedirect() {
  const headersList = await headers();
  const locale = detectLocaleFromHeader(headersList.get("accept-language"));

  redirect(buildLocalePath("/eidos", locale));
}
