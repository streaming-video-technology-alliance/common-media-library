# Writing style compliance: overview

This plan applies the Writing Style rules in `AGENTS.md` to the prose that already exists in the repository. Casey requested the pass on 2026-09-03. The trigger was a Copilot review of #433, which noted that `AGENTS.md` bans em dashes and contained eight of them. The scope covers every text document in the repository, including tutorial guides and READMEs.

## Terms

- Rules: the twelve bullets under "Writing Style" in `AGENTS.md`.
- Prose: sentences and list items in a markdown file. Code blocks, tables, frontmatter, link targets, and license text are not prose.
- Tranche: a group of files that one PR rewrites and one reviewer can read in one sitting.
- Baseline: the metrics of a file before the rewrite. `inventory.md` records every baseline.
- Check script: `check.sh` in this folder. It compares a rewritten file with its base version.

## Goal

Every document in scope follows the rules. No document loses a fact, a number, a hedge, a link, a heading anchor, or a code block.

## Scope

Six tranches, 49 files, about 25,000 words of prose. One PR per tranche, in this order.

| Tranche | Files | Prose words | Why this order |
|---|---|---|---|
| 1. Repository documents | `AGENTS.md`, `CLAUDE.md`, `README.md`, `CONTRIBUTING.md`, `SCOPING.md`, `SECURITY.md`, the three templates under `.github/` | 2,390 | `AGENTS.md` states the rules and must follow them. `README.md` is the landing page of the documentation site. |
| 2. Package READMEs and short guides | `libs/*/README.md` (19 files), `libs/cmaf-ham/src/README.md`, `libs/cmaf-ham/samples/cmaf-ham-conversion/README.md`, `libs/608/test/fixtures/README.md`, `libs/iso-bmff/docs/*.md` (3 files) | 1,660 | Adopters read these files first. Most are short. |
| 3. CMCD guides | `libs/cmcd/docs/user-guide.md`, `libs/cmcd/docs/report-recorder-guide.md`, `libs/cmcd/docs/validation-guide.md` | 4,287 | The longest adopter-facing guides. In the user guide, 31 percent of sentences exceed 25 words. |
| 4. C2PA guides | `libs/c2pa/docs/*.md` (4 files) | 1,631 | Adopter-facing. The documentation site publishes them. |
| 5. Agent instructions | `.claude/agents/code-reviewer.md`, `.claude/rules/code-quality.md`, `.claude/skills/*/SKILL.md` (3 files) | 2,618 | Internal. Agents read these files, adopters do not. |
| 6. RFC process and merged RFCs | `rfc/README.md`, `rfc/cmcd-reporter-middleware.md`, `rfc/cmcd-session-retention.md` | 12,552 | Open question 1. The two RFC bodies are records of accepted proposals. |

### Out of scope

| Files | Reason |
|---|---|
| `libs/*/config/cml-*.api.md` | API Extractor generates these files on every build. |
| `libs/*/NOTICE.md` | License and attribution text must stay verbatim. |
| `CODE_OF_CONDUCT.md` | The Contributor Covenant 2.0, adopted verbatim. |
| `CONTRIBUTORS.md`, `GOVERNANCE.md` | A list, and one sentence with a link. |
| `CHANGELOG.md` at the root and in every package | Release history is a record. New entries follow the rules. |
| `plans/**/*.md` | Design records of finished or current work. New plans follow the rules. |
| TSDoc comments in `libs/**/*.ts` | The rules name TSDoc, but a TSDoc pass changes source files and regenerates every `api.md`. See open question 2. |

## Method

For each file:

1. Take the base version from git. For tranche 1 the base is commit 8ddcad72c, the merge of #433 into `main`. For later tranches the base is `origin/main`.
2. Rewrite prose only. Keep code blocks, tables, frontmatter, link targets, and heading text. Two guides link to each other's `#custom-keys` heading: `libs/cmcd/docs/user-guide.md` and `libs/cmcd/docs/validation-guide.md`.
3. Keep every fact, number, hedge, and tense. If the original says "will", the rewrite says "will". If a fact looks wrong or stale, do not change it. Record it under "Noticed, not changed" in the PR description.
4. Apply the rules in this order. First split sentences and remove semicolons and em dashes. Then replace idioms and phrasal verbs, and define abbreviations at first use. Last, give each pronoun a noun and use one name per thing.
5. Do a second pass that removes duplication. The file must not grow. If a definition of an abbreviation makes a very short file longer, record the reason in the PR description.
6. Run the check script. Fix every FAIL.
7. Record the after metrics in `inventory.md`.
8. Commit with `git commit -s` and a `docs(<area>):` subject.

## Checks

Run the check script from the repository root:

```bash
bash plans/writing-style-compliance/check.sh <base-ref> <file>...
```

The script prints one PASS or FAIL line per check per file and exits with status 1 on any FAIL. The checks:

| Check | What it proves |
|---|---|
| chars | No em dash and no semicolon in prose. The rule line in `AGENTS.md` that shows both characters is allowed. |
| length | No sentence over 25 words. |
| abbrev | No "e.g.", "i.e.", or "vs" in prose. Quoted mentions are allowed. |
| numbers | The set of numeric tokens is the same as in the base version. |
| blocks | Code blocks and tables are byte for byte identical to the base version. A table added on purpose shows up as the only difference. |
| links | The set of link targets and bare URLs is the same as in the base version. |
| shorter | The prose word count did not grow. |

The readability metrics in `inventory.md` come from a second script that is not in the repository. See `inventory.md` for what it measures. That script excludes heading text from its prose word count. The check script includes heading text, so its shorter check reports higher counts for the same file.

## Open questions

1. Merged RFCs (tranche 6). Rewrite 12,000 words of accepted proposals, or apply the rules only to `rfc/README.md` and to new RFCs? Recommendation: `rfc/README.md` only.
2. TSDoc. The rules name TSDoc, and the API reference is built from it. A pass would touch most source files and regenerate every `api.md`. Recommendation: a separate plan, one package per PR, after the markdown tranches.
3. Records. This plan leaves `plans/` and changelog history unchanged. Confirm.
4. Enforcement. A lint step could fail when prose in a markdown file contains an em dash, a semicolon, or "e.g.". The check script is a starting point. Should it become `scripts/checkProse.ts` and run in `npm run lint`? A `.ts` file under `plans/` is not an option, because `eslint .` and the root `tsc --noEmit` include it.

## Status

- 2026-09-03: plan written. Tranche 1 rewritten on branch `docs/writing-style-compliance` and rebased onto `main` after #433 merged. PR #434.
- 2026-09-03: tranche 2 rewritten on branch `docs/writing-style-readmes`, stacked on the tranche 1 branch because #434 was still open. PR pending.

## Noticed, not changed (tranche 1)

The rewrite kept these statements as they were. Each one may need a separate fix.

- `README.md` says the monorepo has two workspaces, `libs` and `docs`. The root `package.json` also lists `dev`.
- `SCOPING.md` names the package `@svta/common-media-library`. The published packages are `@svta/cml-*`.
- `SECURITY.md` says versions up to 1.0.x receive security updates. Several packages are past 1.0.x.
- `CONTRIBUTING.md` limits new issues to "a problem with the docs". The sentence comes from the GitHub template.
- `CONTRIBUTING.md` asks readers to keep the community "approachable and respectable". The GitHub template wording may have meant "respectful".
- `GOVERNANCE.md` names the "Streaming Video Alliance", the former name of the organization. The file is out of scope.

## Noticed, not changed (tranche 2)

- `libs/cmaf-ham/src/README.md`: the code examples import from `@svta/common-media-library`, a package name that no longer exists. The first example has no comma after `hamToDash`. The Documentation section names the API documentation without a link.
- `libs/cmaf-ham/README.md`, `libs/drm/README.md`, and `libs/request/README.md` have an empty Usage code block. `libs/mse/README.md` has a Usage example that imports nothing.
- Several README examples are not complete. They use identifiers without importing or defining them: `assert` in most examples, `CMSD_STATIC_OBJ` and `SfToken` in `libs/cmsd/README.md`, `id3Data` in `libs/id3/README.md`, and `view`, `samplePos`, `sampleSize`, and `sampleTimeMs` in `libs/608/README.md`.
