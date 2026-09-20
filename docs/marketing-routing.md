# Public marketing routing

Canonical public marketing URLs are `/{locale}` and `/{locale}/...` for `en`, `uk`, and `pl`.

The `src/app/platform/[locale]` segment is intentionally internal. It isolates marketing routes from the existing Observatory locale/use-case routes in the same Next.js application. `src/proxy.ts` rewrites clean marketing URLs internally; the browser never exposes `/platform`.

Legacy `/platform/{locale}/...` requests on qdip.ai receive one permanent 308 redirect to the equivalent clean URL. Internal navigation, canonical metadata, hreflang and sitemap entries must always use clean URLs directly.
