import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { GET } from "../app/api/studio/[...path]/route";

test("Studio proxy isolates its credentials and diagnoses deployment failures", async () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;
  try {
    process.env.DIP_API_BASE_URL = "https://backend.example/api/v1";
    process.env.DIP_API_KEY = "platform-key";
    process.env.DIP_STUDIO_API_KEY = "organization-key";
    delete process.env.DIP_STUDIO_API_BASE_URL;
    let status = 200;
    let body = "[]";
    globalThis.fetch = async (url, init) => {
      assert.equal(url, "https://backend.example/api/v1/decision-profiles");
      assert.equal(new Headers(init?.headers).get("x-api-key"), "organization-key");
      return new Response(body, { status });
    };
    const request = () => GET(new NextRequest("https://frontend.example/api/studio/decision-profiles"),
      { params: Promise.resolve({ path: ["decision-profiles"] }) });
    assert.equal((await request()).status, 200);
    status = 403;
    body = JSON.stringify({ error: { message: "This endpoint requires an org-scoped API key" } });
    let response = await request();
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /DIP_STUDIO_API_KEY/);
    status = 404;
    response = await request();
    assert.equal(response.status, 502);
    assert.match((await response.json()).error, /deploy the backend/);
    status = 502;
    body = "<html>Application failed to respond</html>";
    response = await request();
    assert.match((await response.json()).error, /deployment health/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
    Object.assign(process.env, originalEnv);
  }
});
