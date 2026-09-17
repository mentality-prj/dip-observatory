import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const EIDOS_SUPPORTED_LOCALES = new Set(["en", "pl"]);
const MARKETING_LOCALES = new Set(["en", "uk", "pl"]);
const EIDOS_PATH_PATTERN = /^\/([^/]+)(\/eidos(?:\/.*)?)$/;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function requestHost(request: NextRequest) {
  return (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(":")[0]
    .toLowerCase();
}

function isSurfaceHost(host: string, surface: "studio" | "observatory") {
  if (!host || LOCAL_HOSTS.has(host)) return false;
  return host === `${surface}.qdip.ai` || host.startsWith(`${surface}.`);
}

function isMarketingHost(host: string) {
  return host === "qdip.ai" || host === "www.qdip.ai";
}

export function proxy(request: NextRequest) {
  const host = requestHost(request);
  const pathname = request.nextUrl.pathname;

  if (isSurfaceHost(host, "studio") && !pathname.startsWith("/api/")) {
    if (!pathname.startsWith("/studio")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? "/studio" : `/studio${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  if (isSurfaceHost(host, "observatory") && !pathname.startsWith("/api/")) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/en";
      return NextResponse.rewrite(url);
    }

    if (pathname === "/decisions") {
      const url = request.nextUrl.clone();
      url.pathname = "/observatory/decisions";
      return NextResponse.rewrite(url);
    }
  }

  const explicitMarketingLocale = pathname.match(/^\/platform\/(en|uk|pl)\/?$/)?.[1];
  if (
    isMarketingHost(host) &&
    explicitMarketingLocale &&
    MARKETING_LOCALES.has(explicitMarketingLocale)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${explicitMarketingLocale}`;
    return NextResponse.redirect(url);
  }

  const marketingLocale = pathname.match(/^\/(en|uk|pl)\/?$/)?.[1];
  if (isMarketingHost(host) && marketingLocale && MARKETING_LOCALES.has(marketingLocale)) {
    const url = request.nextUrl.clone();
    url.pathname = `/platform/${marketingLocale}`;
    return NextResponse.rewrite(url);
  }

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
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
