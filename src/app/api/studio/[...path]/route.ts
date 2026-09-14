import { NextRequest, NextResponse } from "next/server";
import { normalizeDipBaseUrl } from "@/lib/dip-url";

const resource = /^[a-zA-Z0-9_.-]+$/;
function allowed(path: string[], method: string) {
  if (!path.every((part) => resource.test(part))) return false;
  if (path[0] === "dimensions") return method === "GET" && path.length <= 2;
  if (path.join("/") === "decision-studio/plugins") return method === "GET";
  if (path[0] === "decision-profiles") {
    if (path.length === 1) return ["GET", "POST"].includes(method);
    if (path.length === 2) return ["GET", "PATCH", "DELETE"].includes(method);
    if (path.length === 3 && path[2] === "dimensions") return ["GET", "PUT"].includes(method);
    return path.length === 3 && path[2] === "execute" && method === "POST";
  }
  if (path[0] === "plugins") return path.length === 3 && path[2] === "dimension-bindings" && ["GET", "PUT"].includes(method);
  if (path[0] === "dimension-decisions") return (path.length <= 2 && method === "GET") ||
    (path.length === 3 && path[2] === "replay" && method === "POST");
  return false;
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (!allowed(path, request.method)) return NextResponse.json({ error: "Unsupported Studio resource" }, { status: 404 });
  if (request.method !== "GET" && request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "A same-origin request is required" }, { status: 403 });
  }
  const base = normalizeDipBaseUrl(process.env.DIP_API_BASE_URL ?? process.env.DIP_URL ?? process.env.NEXT_PUBLIC_DIP_API_BASE_URL);
  const apiKey = (process.env.DIP_API_KEY ?? process.env.DIP_ADMIN_API_KEY ?? "").trim();
  if (!base || !apiKey) return NextResponse.json({ error: "Set DIP_API_BASE_URL and DIP_API_KEY to connect Decision Studio." }, { status: 503 });
  try {
    const upstream = await fetch(`${base}/api/v1/${path.join("/")}${request.nextUrl.search}`, {
      method: request.method,
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: request.method === "GET" ? undefined : await request.text(),
      cache: "no-store", signal: AbortSignal.timeout(120000),
    });
    if (upstream.status === 204) return new NextResponse(null, { status: 204 });
    return new NextResponse(await upstream.text(), { status: upstream.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "DIP is unavailable. Check the connection and retry." }, { status: 502 });
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
