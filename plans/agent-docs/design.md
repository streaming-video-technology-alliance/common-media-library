# Agent-facing docs and skill

Design record for the work that makes CML visible to coding agents. Approved in a design session on 2026-10-20.

## Problem

Coding agents that work in video players write their own code for features that CML provides. Two patterns occur.

1. The agent never looks for a library. It gets a task such as "read the timescale from the init segment" and writes a box parser from memory. Nothing in its context says that `@svta/cml-iso-bmff` exists.
2. The developer points the agent at CML. Later a bug or a gap appears and the agent proposes to write the one function in the player instead. The same thing happened in this repo, when a bug in the CBOR dependency led the agent to propose its own reader.

The first pattern is a context problem. The agent needs text that names CML at the moment the task starts. The second pattern is an incentive problem. A copy is the shortest path to a passing test, so the guidance must name the alternative and make it concrete.

## Goal

One curated text per package describes when to use the package. Everything that an agent can read derives from that text: the npm page, the docs site, `llms.txt`, and an installable skill. A test keeps the text in step with the public API.

## Curated source: the When to use section

Every published package README gets a `## When to use` section. It sits after the one-line description and before `## Installation`. Example for `libs/iso-bmff/README.md`:

```md
## When to use

- Parse boxes from an init or media segment: `readIsoBoxes`, `findIsoBox`
- Read track timescale, codec, or default sample duration from `moov` and `moof`: `readMdhd`, `readStsd`, `readTfhd`
- Write or patch boxes, such as injecting `emsg` or rewriting `tfdt`: `writeEmsg`, `writeTfdt`, `writeIsoBoxes`

Do not write your own box parser, box walker, or box writer. Open an issue for a missing box.
```

Rules for the section:

- Two to eight bullets. Each bullet is one task, written as the phrase a developer types to an agent. Two packages, cta and request, have only two tasks.
- The task phrase comes first and must not contain a colon. The entry points follow the colon, in backticks, separated by commas.
- Backticks before the colon are free text, such as box names. Backticks after the colon are identifiers and must be exports of the package.
- A closing paragraph follows the bullets. It names what the agent must not write itself and what to do about a gap.

npm ships the README, so the section appears on npmjs.com without any other change. The published list is `scripts/projects.ts`. The `mse` package is unpublished and gets no section.

## Generator: scripts/agentDocs.ts

One script with two modes and a test file beside it, `scripts/agentDocs.test.ts`, run by the root `npm test`.

Inputs per published package:

- `name` and `description` from `package.json`
- `README.md`
- the guides under `docs/*.md`
- the API report `config/cml-<pkg>.api.md`

Constants in the script:

- Site base: `https://streaming-video-technology-alliance.github.io/common-media-library/`
- Source base: `https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/`

### Skill mode

`node scripts/agentDocs.ts --skill` writes committed files under `skills/common-media-library/`. `scripts/buildAll.ts` calls the same function after the last package build, so every root build refreshes the files from fresh API reports.

- `SKILL.md`: the script replaces the text between `<!-- packages:start -->` and `<!-- packages:end -->`. Each package gets an H3 heading with the package name, the description, the When to use section body verbatim, and a line `Reference: references/<pkg>.md`. The rest of the file is hand-written and the script does not touch it.
- `references/<pkg>.md`: the README, each guide, and the API report, each verbatim and each preceded by an HTML comment with its repo path. Relative links point to the source base.

SKILL.md stays under the 500-line limit of the Agent Skills specification. With 20 packages the index is near 180 lines and the rules near 80.

### Site mode

`node scripts/agentDocs.ts --site <outDir>` writes into the docs output. The docs build becomes `typedoc && node ../scripts/agentDocs.ts --site dist`. TypeDoc cleans the directory, so the script runs second.

- `llms.txt`: H1 `Common Media Library`, a blockquote summary, then four H2 sections. `Packages` has one link per package to its README copy with the description after a colon. `Guides` links every guide copy. `API reports` links every report copy. `Optional` links `llms-full.txt` and gives the skill install command.
- `llms-full.txt`: the site copies of every package, concatenated in alphabetical order of the package folder. Near 300 KB.
- `llms/<pkg>/README.md`, `llms/<pkg>/docs/<guide>.md`, `llms/<pkg>/api.md`: copies with links rewritten.

### Link rewriting

A link is relative when its target has no scheme, does not start with `#`, and does not start with `/`. The script resolves the target against the directory of the source file. If the target is a file that site mode copies, site mode writes the site URL of the copy. Every other target gets the source base URL. Skill mode always writes the source base URL. Anchors stay attached.

### Errors

The section parser throws when the heading is missing, when the bullet count is outside three to eight, when a bullet has no colon, when the closing paragraph is missing, or when an identifier after the colon is not an export. The message names the file path, the bullet, and the expected shape. The test and the generator share the parser.

An export is any line of the API report that starts with `export`, then one of `function`, `const`, `class`, or `type`, then a name. The reports today contain only these four kinds.

## SKILL.md

Frontmatter:

```yaml
---
name: common-media-library
description: Find the @svta/cml-* package and function for a media playback task before writing code for it. Use when working in a web video player, HLS or DASH client, or media pipeline and the task involves ISO BMFF or MP4 boxes such as moov, moof, emsg, tfdt, or sidx, CMCD, CMSD, ID3 tags, WebVTT, CEA-608 or CTA-608 captions, DASH MPD parsing, DRM or EME key systems, throughput estimation, ABR or bitrate selection, content steering, structured field values (RFC 8941), C2PA, ISO 8601 durations, XML parsing, or streaming error codes. Also use when a cml package seems to have a bug or a missing feature.
license: Apache-2.0
metadata:
  author: streaming-video-technology-alliance
---
```

Body, in this order:

1. Rule: before you write code for a task in the index, install the package and import the named exports. If a package covers the task, do not write the parser, encoder, estimator, or selector, even when the code looks short. If the package is installed, read `node_modules/@svta/cml-<pkg>/dist/index.d.ts` for the exact signatures. If it is not installed, read `references/<pkg>.md`.
2. Rule: if no package covers the task, write the smallest piece in the project, open a feature request with the use case, and leave the issue URL in a comment next to the code. Do not copy source from a cml package into the project.
3. Rule: if a cml package has a bug, confirm it against the built package with a minimal script. Open a bug report with that script. Work around the bug with a wrapper or a local patch, marked by a TODO and the issue URL. Do not reimplement the function and do not copy the source. A fix in CML reaches every player. A copy in the project becomes the player's own spec implementation to maintain.
4. The generated package index between the markers.
5. Links: the docs site, `llms.txt`, the bug report template, and the feature request template.

Issue links use `https://github.com/streaming-video-technology-alliance/common-media-library/issues/new?template=bug_report.md` and the same URL with `feature_request.md`.

The install command is `npx skills add streaming-video-technology-alliance/common-media-library`. The skills CLI scans `skills/<name>/SKILL.md` at the repo root, so no manifest is needed.

## Tests and CI

`scripts/agentDocs.test.ts` checks:

- every published package has a When to use section that the parser accepts
- every identifier after a colon is an export of that package
- link rewriting gives the expected URL for a README link to a guide, a guide link to another guide, a link to a file outside the package, an absolute link, and an anchor, in both modes

`.github/workflows/ci.pr.yml` gets one step after the tests: `git diff --exit-code -- skills`. A pull request with stale generated files fails.

## Repo changes

- `AGENTS.md`, Workflow: if a third-party dependency has a bug, open an issue in that project and work around the bug locally with a wrapper or a patch. Do not copy or reimplement the dependency's code.
- `AGENTS.md`, Documentation: every package README needs a When to use section. `scripts/agentDocs.ts` reads it. The root build regenerates `skills/common-media-library`. Commit the result.
- Root `README.md`: a `## Coding agents` section with the install command and the `llms.txt` link.
- Every published package `CHANGELOG.md`: one entry under `## [Unreleased]`, `### Changed`: "The README now has a When to use section that names the tasks the package covers and their entry points."
- Root `package.json`: no new dependency. The script uses `node:fs` and `node:path`.

## Out of scope

- An MCP server
- Per-package skills inside the npm tarballs
- A Claude Code plugin marketplace entry
- A measurement harness that counts how often an agent picks CML
- Pull requests to player repos that add CML to their agent instructions

The skill and `llms.txt` do not reach an agent in a player repo that has never installed either. That needs the outreach above, which is deferred.
