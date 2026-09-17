import assert from "node:assert/strict";
import test from "node:test";
import { getRewrittenUrl, isRewrite } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

function request(host: string, pathname = "/") {
  return new NextRequest(`https://${host}${pathname}`, {
    headers: { host },
  });
}

test("routes clean Studio URLs to the Studio app", () => {
  const home = proxy(request("studio.qdip.ai"));
  const profiles = proxy(request("studio.qdip.ai", "/profiles"));

  assert.equal(isRewrite(home), true);
  assert.equal(new URL(getRewrittenUrl(home)!).pathname, "/studio");
  assert.equal(new URL(getRewrittenUrl(profiles)!).pathname, "/studio/profiles");
});

test("routes clean Observatory URLs to the localized app", () => {
  const home = proxy(request("observatory.qdip.ai"));
  const decisions = proxy(request("observatory.qdip.ai", "/decisions"));

  assert.equal(new URL(getRewrittenUrl(home)!).pathname, "/en");
  assert.equal(
    new URL(getRewrittenUrl(decisions)!).pathname,
    "/observatory/decisions",
  );
});

test("leaves the QDIP marketing site unchanged", () => {
  const response = proxy(request("qdip.ai"));

  assert.equal(isRewrite(response), false);
});

test("routes localized marketing URLs without affecting Observatory locales", () => {
  const ukrainianSite = proxy(request("qdip.ai", "/uk"));
  const polishObservatory = proxy(request("observatory.qdip.ai", "/pl"));

  assert.equal(
    new URL(getRewrittenUrl(ukrainianSite)!).pathname,
    "/platform/uk",
  );
  assert.equal(isRewrite(polishObservatory), false);
});
