# Public SEO and conversion release checklist

After deploying the conversion funnel:

- Verify `/en`, `/uk`, `/pl` and each public marketing route returns 200 at its clean URL.
- Verify generated canonical URLs never contain `/platform`.
- Verify EN/UA/PL `hreflang` alternates resolve to the equivalent clean route.
- Verify sitemap contains clean public marketing routes and excludes internal `/platform` routes.
- Verify robots directives allow intended public pages and do not expose internal routing namespaces as canonical pages.
- Verify title and description for home, use cases, decision intake and Core pages in rendered HTML.
- Verify Open Graph URL uses the clean canonical URL.
- Submit/recheck sitemap and representative URLs in Google Search Console after deployment.
- Track the funnel separately: homepage → use cases/demo → decision intake → successful form submission.
- Do not claim demo performance or business value without measured evidence.
