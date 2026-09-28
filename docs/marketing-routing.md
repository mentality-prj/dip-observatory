# Public marketing routing

Canonical public marketing URLs are `/{locale}` and `/{locale}/...` for `en`, `uk`, and `pl`.

The `src/app/platform/[locale]` segment is intentionally internal. It isolates marketing filesystem routes from Observatory routes in the same Next.js application. Host-conditioned rewrites are declared in `next.config.ts` using the built-in Next.js routing pipeline; there is no application Proxy/middleware router.

Legacy `/platform/{locale}/...` requests receive a permanent redirect to the equivalent clean `qdip.ai/{locale}/...` URL. Internal navigation, canonical metadata, hreflang and sitemap entries must always use clean public URLs directly.

Studio follows the same model: public `studio.qdip.ai/{locale}/...` requests are declaratively rewritten to the internal `/studio/...` filesystem routes. Observatory already owns the public `/[locale]/...` filesystem routes and therefore needs no page rewrite.

Host ownership is defined once in `src/routing-config.ts`. `next.config.ts` consumes that configuration for host conditions, while `src/lib/platform-routing.ts` consumes the same origins for canonical cross-surface URLs.
