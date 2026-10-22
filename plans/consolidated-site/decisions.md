# Consolidated site: decisions

Decisions from the design session on 2026-10-22. The other files in this folder build on them.

| Topic | Decision |
| --- | --- |
| Goal | One site replaces the GitHub Pages API docs and the abandoned public site. |
| Host and domain | GitHub Pages, custom domain `cml.svta.org`. SVTA repoints the DNS record. |
| Framework | VitePress 1.6 with `typedoc-plugin-markdown` and `typedoc-vitepress-theme`. |
| API reference | Rendered as markdown inside the site, one folder per package. |
| Launch content | Landing page, guides, API reference, adopters section, release notes feed. |
| Not at launch | RFC browser, blog, per-package doc versions, analytics, PR preview deploys. |
| Branding | Own CML identity. SVTA credited in the footer and in an about section. |
| Previews | Local only for now. See the preview note in `architecture.md`. |

## Alternatives considered

- **VitePress with the TypeDoc HTML kept under a sub path.** Fastest to ship. Rejected because the reader gets two visual systems, two searches, and two navigations. Kept as the fallback for the API reference only, if the spike in `phases.md` fails.
- **Astro with Starlight.** The videojs.org stack. Rejected because it adds a framework layer and the TypeDoc path still goes through the same markdown plugin.
- **Cloudflare Pages as host.** Gives server-side redirects and preview deploys. Rejected for now because it needs an SVTA Cloudflare project and a new token.

## Reference sites

- https://mediabunny.dev and https://vite.dev are VitePress sites.
- https://videojs.org is an Astro site.
- https://cml.svta.org is a 301 to a WordPress page on svta.org. That page links into the old TypeDoc URLs.
