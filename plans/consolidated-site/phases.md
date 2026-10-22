# Consolidated site: phases

Four phases. Each phase ends in something that merges or ships on its own.

## Phase 1: spike (done 2026-10-22)

Run in a scratch folder with cmcd, iso-bmff, and utils. Results are recorded in `steps.md` under "Spike results". Summary: the module rename works on `Application.EVENT_VALIDATE_PROJECT`, and the markdown output keeps relative links intact. Three packages build in 14 s for TypeDoc and 15 s for VitePress. A title-only search index stays far under 2 MB.

## Phase 2: site shell

The `site/` workspace, the generator scripts with their tests, and all 20 packages with guides, API reference, and changelogs. Also the releases feed, the redirect stubs, the three workflow edits, and the pull request check. Default VitePress theme, no custom branding yet. The implementation plan is `steps.md`.

This phase removes `docs/` and updates the project structure section of the root `README.md` and the documentation section of `AGENTS.md`. It ships to github.io, so the result is reviewable at the current URL before any DNS work.

## Phase 3: design pass

Wordmark, palette, the three landing components, `adopters.json`, the custom 404 page, and the Lighthouse check. Separate pull request so the design review does not block the structural one.

## Phase 4: cutover

SVTA DNS change, custom domain in the repository settings, `SITE_BASE` set to `/`, and the svta.org page updated to link to the new site. A small pull request plus coordination outside the repository.

## Dependencies

- Pull request #557 (branch `claude/agents-duplicating-cml-features-c9de36`) adds `scripts/agentDocs.ts` and writes `llms.txt` into `docs/dist` through `docs/package.json`. It is open and mergeable. Whichever lands second updates the output path to `site/dist`. The cheaper order is #557 first, because the change there is one path.
- Phase 2 removes `docs/`, so any open branch that touches `docs/` conflicts. Today only #557 touches `docs/`.

## Risks

- The full build of all 20 packages takes 106 s. TypeDoc takes 81 s and VitePress takes 22 s. The search index is 603 KB. The `site/dist` folder is 292 MB and holds 1,128 HTML pages.
- Each HTML page embeds its sidebar. VitePress inlines the hash map and the API sidebar data into every page. A package page is about 200 KB before compression and 33 KB after gzip. The largest page is 387 KB before compression. GitHub Pages serves compressed HTML, so this is acceptable for now.
- The markdown renderer has no hierarchy pages. The old `hierarchy.html` redirects to the API index.
