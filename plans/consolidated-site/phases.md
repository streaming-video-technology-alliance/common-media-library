# Consolidated site: phases

Four phases. Each phase ends in something that merges or ships on its own.

## Phase 1: spike

Build VitePress with the TypeDoc markdown plugins for two packages, `cmcd` and `iso-bmff`, the two largest. The spike confirms:

- The output folder names that the packages entry point strategy produces.
- How `typedoc-sidebar.json` slices per package.
- Build time and local search index size, extrapolated to all 20 packages.

Throwaway branch, no pull request. About half a day.

## Phase 2: site shell

The `site/` workspace, `prepare.ts` with its tests, and all 20 packages with guides, API reference, and changelogs. Also the releases feed, the redirect stubs, the three workflow edits, and the pull request check. Default VitePress theme, no custom branding yet.

This phase removes `docs/` and updates the project structure section of the root `README.md` and the documentation section of `AGENTS.md`. It ships to github.io, so the result is reviewable at the current URL before any DNS work.

## Phase 3: design pass

Wordmark, palette, the three landing components, `adopters.json`, and the Lighthouse check. Separate pull request so the design review does not block the structural one.

## Phase 4: cutover

SVTA DNS change, custom domain in the repository settings, `SITE_BASE` set to `/`, and the svta.org page updated to link to the new site. A small pull request plus coordination outside the repository.

## Dependencies

- Pull request #557 (branch `claude/agents-duplicating-cml-features-c9de36`) adds `scripts/agentDocs.ts` and writes `llms.txt` into `docs/dist` through `docs/package.json`. It is open and mergeable. Whichever lands second updates the output path to `site/dist`. The cheaper order is #557 first, because the change there is one path.
- Phase 2 removes `docs/`, so any open branch that touches `docs/typedoc.json` conflicts. Today only #557 touches `docs/`.

## Risks

- The spike may fail on build time or index size. The fallback is TypeDoc HTML under `/packages/<pkg>/api/` with matched CSS. Landing, guides, and releases stay in VitePress either way.
- The markdown renderer drops some TypeDoc features, such as hierarchy pages. The spike lists what is lost, and the decision to accept the loss happens before phase 2.
