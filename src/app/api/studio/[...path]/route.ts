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
  const base = normalizeDipBaseUrl(process.env.DIP_STUDIO_API_BASE_URL ?? process.env.DIP_API_BASE_URL ?? process.env.DIP_URL ?? process.env.NEXT_PUBLIC_DIP_API_BASE_URL).replace(/\/api(?:\/v1)?$/, "");
  const apiKey = (process.env.DIP_STUDIO_API_KEY ?? process.env.DIP_API_KEY ?? process.env.DIP_ADMIN_API_KEY ?? "").trim();
  if (!base || !apiKey) return NextResponse.json({ error: "Configure the Studio backend URL and an organization-scoped DIP_STUDIO_API_KEY on the frontend server." }, { status: 503 });
  try {
    const upstream = await fetch(`${base}/api/v1/${path.join("/")}${request.nextUrl.search}`, {
      method: request.method,
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: request.method === "GET" ? undefined : await request.text(),
      cache: "no-store", signal: AbortSignal.timeout(120000),
    });
    if (upstream.status === 204) return new NextResponse(null, { status: 204 });
    const body = await upstream.text();
    if (upstream.status === 403 && body.includes("This endpoint requires an org-scoped API key")) {
      return NextResponse.json({ error: "Studio is using a platform key. Configure DIP_STUDIO_API_KEY with an organization-scoped key on the frontend server and redeploy." }, { status: 503 });
    }
    if (upstream.status === 404 && (path.length === 1 || path.join("/") === "decision-studio/plugins")) {
      return NextResponse.json({ error: "The configured backend does not expose the Decision Studio API. Check DIP_STUDIO_API_BASE_URL and deploy the backend version that includes decision profiles." }, { status: 502 });
    }
    if (upstream.status >= 500) {
      return NextResponse.json({ error: "The Studio backend is unavailable. Check its deployment health and logs, then retry." }, { status: 502 });
    }
    return new NextResponse(body, { status: upstream.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "DIP is unavailable. Check the connection and retry." }, { status: 502 });
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
