import assert from "node:assert/strict";
import test from "node:test";
import { getRewrittenUrl, isRewrite } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";
function request(host:string,pathname="/"){return new NextRequest(`https://${host}${pathname}`,{headers:{host}})}
test("routes clean Studio URLs to the Studio app",()=>{const home=proxy(request("studio.qdip.ai"));const profiles=proxy(request("studio.qdip.ai","/profiles"));assert.equal(isRewrite(home),true);assert.equal(new URL(getRewrittenUrl(home)!).pathname,"/studio");assert.equal(new URL(getRewrittenUrl(profiles)!).pathname,"/studio/profiles")});
test("routes clean Observatory URLs to the localized app",()=>{const home=proxy(request("observatory.qdip.ai"));const decisions=proxy(request("observatory.qdip.ai","/decisions"));assert.equal(new URL(getRewrittenUrl(home)!).pathname,"/en");assert.equal(new URL(getRewrittenUrl(decisions)!).pathname,"/observatory/decisions")});
test("leaves the QDIP marketing root unchanged",()=>{assert.equal(isRewrite(proxy(request("qdip.ai"))),false)});
test("routes localized marketing URLs and nested public pages",()=>{const home=proxy(request("qdip.ai","/uk"));const core=proxy(request("qdip.ai","/en/core/architecture"));const canonical=proxy(request("qdip.ai","/platform/pl/use-cases"));const preview=proxy(request("feature-qdip.vercel.app","/platform/uk"));const observatory=proxy(request("observatory.qdip.ai","/pl"));assert.equal(new URL(getRewrittenUrl(home)!).pathname,"/platform/uk");assert.equal(new URL(getRewrittenUrl(core)!).pathname,"/platform/en/core/architecture");assert.equal(canonical.status,307);assert.equal(new URL(canonical.headers.get("location")!).pathname,"/pl/use-cases");assert.equal(isRewrite(preview),false);assert.equal(isRewrite(observatory),false)});
