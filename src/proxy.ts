import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
const MARKETING_LOCALES=new Set(["en","uk","pl"]);const LOCAL_HOSTS=new Set(["localhost","127.0.0.1"]);
function requestHost(r:NextRequest){return(r.headers.get("x-forwarded-host")??r.headers.get("host")??"").split(":")[0].toLowerCase()}
function isSurfaceHost(h:string,s:"studio"|"observatory"){return !!h&&!LOCAL_HOSTS.has(h)&&(h===`${s}.qdip.ai`||h.startsWith(`${s}.`))}
function isMarketingHost(h:string){return h==="qdip.ai"||h==="www.qdip.ai"}
export function proxy(request:NextRequest){const host=requestHost(request),pathname=request.nextUrl.pathname;
 if(isSurfaceHost(host,"studio")&&!pathname.startsWith("/api/")&&!pathname.startsWith("/studio")){const u=request.nextUrl.clone();u.pathname=pathname==="/"?"/studio":`/studio${pathname}`;return NextResponse.rewrite(u)}
 if(isSurfaceHost(host,"observatory")&&!pathname.startsWith("/api/")){if(pathname==="/"){const u=request.nextUrl.clone();u.pathname="/en";return NextResponse.rewrite(u)}if(pathname==="/decisions"){const u=request.nextUrl.clone();u.pathname="/observatory/decisions";return NextResponse.rewrite(u)}}
 const explicit=pathname.match(/^\/platform\/(en|uk|pl)(\/.*)?$/);if(isMarketingHost(host)&&explicit&&MARKETING_LOCALES.has(explicit[1])){const u=request.nextUrl.clone();u.pathname=`/${explicit[1]}${explicit[2]??""}`;return NextResponse.redirect(u,308)}
 const marketing=pathname.match(/^\/(en|uk|pl)(\/.*)?$/);if(isMarketingHost(host)&&marketing&&MARKETING_LOCALES.has(marketing[1])){const u=request.nextUrl.clone();u.pathname=`/platform/${marketing[1]}${marketing[2]??""}`;return NextResponse.rewrite(u)}
 return NextResponse.next()}
export const config={matcher:["/((?!_next/static|_next/image|.*\\..*).*)"]};
