import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const EIDOS_SUPPORTED_LOCALES = new Set(["en", "pl"]);
const EIDOS_PATH_PATTERN = /^\/([^/]+)(\/eidos(?:\/.*)?)$/;

export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(EIDOS_PATH_PATTERN);

  if (!match) {
    return NextResponse.next();
  }

  const [, locale, eidosPath] = match;

  if (EIDOS_SUPPORTED_LOCALES.has(locale)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/en${eidosPath}`;

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/:locale/eidos/:path*"],
};
