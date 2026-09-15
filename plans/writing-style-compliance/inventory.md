# Writing style compliance: inventory

Baseline metrics for every file in scope, measured on 2026-09-03 at commit 26fd67982, the head of #433. The same file content merged into `main` as 8ddcad72c.

## How the numbers were measured

A script outside the repository produced the numbers: `prose-metrics.ts` from the #431 plain-language pass, in Casey's Claude project folder. The script removes code fences, tables, headings, frontmatter, and link targets. Each inline code span counts as one word. A sentence ends at a period, an exclamation mark, a question mark, or a colon followed by a capital letter. "FK grade" is the Flesch-Kincaid grade level. "Flagged" lists hits from a fixed list of idioms and figurative verbs collected during the #431 pass. Some hits are false positives, so the column is a signal, not a gate. Until 2026-09-03 the script matched each flag as a prefix, so "vs" counted VSI, "sat" counted satisfy, and "bar" counted bare. The Flagged column of every table was regenerated on that date with the fixed script, from the file versions that each table measured. The sentence splitter joins list items that have no final period into one sentence. The "Over 25 words" column overstates for files with such lists.

Targets from the #431 pass: average under 15 words per sentence, and under 10 percent of sentences over 25 words. Technical vocabulary raises the grade, so the grade is a signal, not a gate.

## Baseline

| Tranche | File | Prose words | Sentences | Avg words per sentence | Over 25 words | FK grade | Flagged |
|---|---|---|---|---|---|---|---|
| 1 | `AGENTS.md` | 1001 | 78 | 12.8 | 6 (8%) | 7.2 | carries(1), pay for(1), e.g.(3), i.e.(1), vs(1) |
| 1 | `CLAUDE.md` | 106 | 4 | 26.5 | 1 (25%) | 15.9 | none |
| 1 | `README.md` | 322 | 18 | 17.9 | 5 (28%) | 9.9 | none |
| 1 | `CONTRIBUTING.md` | 257 | 23 | 11.2 | 0 (0%) | 6.2 | none |
| 1 | `SCOPING.md` | 414 | 24 | 17.3 | 4 (17%) | 11.5 | none |
| 1 | `SECURITY.md` | 28 | 2 | 14.0 | 0 (0%) | 11.8 | none |
| 1 | `.github/PULL_REQUEST_TEMPLATE.md` | 106 | 7 | 15.1 | 1 (14%) | 6.6 | none |
| 1 | `.github/ISSUE_TEMPLATE/bug_report.md` | 85 | 6 | 14.2 | 0 (0%) | 7.8 | e.g.(4) |
| 1 | `.github/ISSUE_TEMPLATE/feature_request.md` | 71 | 6 | 11.8 | 0 (0%) | 8.1 | none |
| 2 | `libs/608/README.md` | 154 | 8 | 19.3 | 2 (25%) | 9.2 | carries(1), come from(1) |
| 2 | `libs/c2pa/README.md` | 205 | 12 | 17.1 | 1 (8%) | 10.2 | carries(3) |
| 2 | `libs/cmaf-ham/README.md` | 16 | 1 | 16.0 | 0 (0%) | 15.0 | none |
| 2 | `libs/cmcd/README.md` | 42 | 3 | 14.0 | 0 (0%) | 8.1 | none |
| 2 | `libs/cmsd/README.md` | 8 | 1 | 8.0 | 0 (0%) | 11.1 | none |
| 2 | `libs/content-steering/README.md` | 3 | 1 | 3.0 | 0 (0%) | 21.0 | none |
| 2 | `libs/cta/README.md` | 38 | 4 | 9.5 | 0 (0%) | 6.1 | none |
| 2 | `libs/dash/README.md` | 4 | 1 | 4.0 | 0 (0%) | 18.4 | none |
| 2 | `libs/drm/README.md` | 5 | 1 | 5.0 | 0 (0%) | 19.4 | none |
| 2 | `libs/id3/README.md` | 4 | 1 | 4.0 | 0 (0%) | 12.5 | none |
| 2 | `libs/iso-8601/README.md` | 5 | 1 | 5.0 | 0 (0%) | 12.3 | none |
| 2 | `libs/iso-bmff/README.md` | 35 | 2 | 17.5 | 1 (50%) | 8.1 | none |
| 2 | `libs/mse/README.md` | 10 | 1 | 10.0 | 0 (0%) | 11.9 | none |
| 2 | `libs/request/README.md` | 6 | 1 | 6.0 | 0 (0%) | 6.4 | none |
| 2 | `libs/structured-field-values/README.md` | 5 | 1 | 5.0 | 0 (0%) | 12.3 | none |
| 2 | `libs/throughput/README.md` | 3 | 1 | 3.0 | 0 (0%) | 28.8 | none |
| 2 | `libs/utils/README.md` | 6 | 1 | 6.0 | 0 (0%) | 14.3 | none |
| 2 | `libs/webvtt/README.md` | 5 | 1 | 5.0 | 0 (0%) | 14.7 | none |
| 2 | `libs/xml/README.md` | 3 | 1 | 3.0 | 0 (0%) | 13.1 | none |
| 2 | `libs/cmaf-ham/src/README.md` | 237 | 15 | 15.8 | 0 (0%) | 13.5 | none |
| 2 | `libs/cmaf-ham/samples/cmaf-ham-conversion/README.md` | 293 | 24 | 12.2 | 2 (8%) | 5.6 | none |
| 2 | `libs/608/test/fixtures/README.md` | 149 | 9 | 16.6 | 1 (11%) | 6.4 | none |
| 2 | `libs/iso-bmff/docs/reading-boxes.md` | 96 | 6 | 16.0 | 1 (17%) | 8.0 | none |
| 2 | `libs/iso-bmff/docs/utilities.md` | 120 | 9 | 13.3 | 0 (0%) | 6.1 | none |
| 2 | `libs/iso-bmff/docs/writing-boxes.md` | 208 | 16 | 13.0 | 1 (6%) | 7.2 | e.g.(1) |
| 3 | `libs/cmcd/docs/report-recorder-guide.md` | 894 | 56 | 16.0 | 8 (14%) | 8.2 | straight into(2), carries(1), carry(1), shape(3) |
| 3 | `libs/cmcd/docs/user-guide.md` | 2860 | 144 | 19.9 | 45 (31%) | 10.0 | frozen(2), holds(1), carries(5), carry(3), shape(4), stay(2), stays(2), e.g.(3) |
| 3 | `libs/cmcd/docs/validation-guide.md` | 533 | 32 | 16.7 | 6 (19%) | 9.1 | e.g.(2) |
| 4 | `libs/c2pa/docs/manifest-box-validation.md` | 545 | 29 | 18.8 | 6 (21%) | 10.5 | holds(1), carries(2), e.g.(2) |
| 4 | `libs/c2pa/docs/merkle-validation.md` | 409 | 18 | 22.7 | 6 (33%) | 10.3 | carries(2), carry(1) |
| 4 | `libs/c2pa/docs/results-and-error-codes.md` | 262 | 20 | 13.1 | 2 (10%) | 8.5 | none |
| 4 | `libs/c2pa/docs/vsi-validation.md` | 415 | 25 | 16.6 | 4 (16%) | 9.1 | carries(3), stays(1) |
| 5 | `.claude/agents/code-reviewer.md` | 822 | 98 | 8.4 | 4 (4%) | 6.2 | e.g.(4), vs(1) |
| 5 | `.claude/rules/code-quality.md` | 220 | 24 | 9.2 | 0 (0%) | 6.4 | e.g.(1) |
| 5 | `.claude/skills/code-review/SKILL.md` | 100 | 12 | 8.3 | 0 (0%) | 6.1 | none |
| 5 | `.claude/skills/create-pr/SKILL.md` | 686 | 62 | 11.1 | 4 (6%) | 5.7 | e.g.(2), vs(2) |
| 5 | `.claude/skills/pr-feedback/SKILL.md` | 790 | 75 | 10.5 | 2 (3%) | 6.4 | vs(1) |
| 6 | `rfc/README.md` | 317 | 24 | 13.2 | 3 (13%) | 9.9 | settle(1), shape(1) |
| 6 | `rfc/cmcd-reporter-middleware.md` | 6195 | 303 | 20.4 | 90 (30%) | 11.2 | sits in(1), hot path(1), plausible(1), therefore(2), whereas(2), fan-out(5), holds(1), carries(3), carry(1), pays(1), deliberate(1), shape(7), sits(1), stay(3), stays(2), e.g.(3) |
| 6 | `rfc/cmcd-session-retention.md` | 6040 | 259 | 23.3 | 103 (40%) | 12.0 | the price(1), hot path(1), turn out(1), shows up(1), frozen(13), holds(4), carries(4), carry(5), pays(1), deliberate(2), shape(10), shaped(3), sits(1), stays(2) |

## After tranche 1

Recorded after the rewrite. Same script, same settings.

| File | Prose words | Sentences | Avg words per sentence | Over 25 words | FK grade | Flagged |
|---|---|---|---|---|---|---|
| `AGENTS.md` | 997 | 107 | 9.3 | 1 (1%) | 5.9 | carries(1), e.g.(1), i.e.(1), vs(1) |
| `CLAUDE.md` | 105 | 5 | 21.0 | 1 (20%) | 14.0 | none |
| `README.md` | 281 | 23 | 12.2 | 0 (0%) | 8.1 | none |
| `CONTRIBUTING.md` | 219 | 23 | 9.5 | 0 (0%) | 6.4 | none |
| `SCOPING.md` | 390 | 27 | 14.4 | 2 (7%) | 10.4 | none |
| `SECURITY.md` | 16 | 2 | 8.0 | 0 (0%) | 12.6 | none |
| `.github/PULL_REQUEST_TEMPLATE.md` | 101 | 7 | 14.4 | 1 (14%) | 5.7 | none |
| `.github/ISSUE_TEMPLATE/bug_report.md` | 82 | 6 | 13.7 | 1 (17%) | 8.7 | none |
| `.github/ISSUE_TEMPLATE/feature_request.md` | 71 | 6 | 11.8 | 0 (0%) | 8.1 | none |

## After tranche 2

Twelve files changed. The other 13 files, all package READMEs of one or two sentences, already followed the rules and keep their baseline rows. The metrics script merges list items that have no final period into one sentence. So the "Over 25 words" column overstates the count for files with bullet lists. The check script counts 0 sentences over 25 words in every file.

| File | Prose words | Sentences | Avg words per sentence | Over 25 words | FK grade | Flagged |
|---|---|---|---|---|---|---|
| `libs/608/README.md` | 149 | 13 | 11.5 | 0 (0%) | 7.6 | none |
| `libs/608/test/fixtures/README.md` | 149 | 13 | 11.5 | 1 (8%) | 5.1 | none |
| `libs/c2pa/README.md` | 197 | 10 | 19.7 | 3 (30%) | 10.2 | none |
| `libs/cmaf-ham/samples/cmaf-ham-conversion/README.md` | 250 | 27 | 9.3 | 0 (0%) | 4.5 | none |
| `libs/cmaf-ham/src/README.md` | 205 | 17 | 12.1 | 0 (0%) | 9.0 | none |
| `libs/cmcd/README.md` | 41 | 3 | 13.7 | 0 (0%) | 5.3 | none |
| `libs/cta/README.md` | 36 | 5 | 7.2 | 0 (0%) | 6.9 | none |
| `libs/dash/README.md` | 9 | 1 | 9.0 | 0 (0%) | 16.8 | none |
| `libs/iso-bmff/README.md` | 35 | 2 | 17.5 | 1 (50%) | 6.1 | none |
| `libs/iso-bmff/docs/reading-boxes.md` | 93 | 7 | 13.3 | 1 (14%) | 7.0 | none |
| `libs/iso-bmff/docs/utilities.md` | 95 | 8 | 11.9 | 0 (0%) | 6.6 | none |
| `libs/iso-bmff/docs/writing-boxes.md` | 192 | 17 | 11.3 | 1 (6%) | 6.1 | none |

## After tranche 3

All three guides changed. The Terms table in the User Guide does not count as prose.

| File | Prose words | Sentences | Avg words per sentence | Over 25 words | FK grade | Flagged |
|---|---|---|---|---|---|---|
| `libs/cmcd/docs/user-guide.md` | 2827 | 207 | 13.7 | 8 (4%) | 7.1 | frozen(2) |
| `libs/cmcd/docs/report-recorder-guide.md` | 885 | 65 | 13.6 | 2 (3%) | 6.6 | none |
| `libs/cmcd/docs/validation-guide.md` | 509 | 38 | 13.4 | 2 (5%) | 7.7 | none |

## After tranche 4

All four guides changed.

| File | Prose words | Sentences | Avg words per sentence | Over 25 words | FK grade | Flagged |
|---|---|---|---|---|---|---|
| `libs/c2pa/docs/manifest-box-validation.md` | 540 | 34 | 15.9 | 3 (9%) | 8.7 | none |
| `libs/c2pa/docs/merkle-validation.md` | 406 | 29 | 14.0 | 1 (3%) | 5.8 | none |
| `libs/c2pa/docs/results-and-error-codes.md` | 258 | 20 | 12.9 | 1 (5%) | 7.9 | none |
| `libs/c2pa/docs/vsi-validation.md` | 410 | 31 | 13.2 | 3 (10%) | 7.2 | none |

## After tranche 5

All five files changed. Frontmatter and the shell injection lines are byte-identical to the base.

| File | Prose words | Sentences | Avg words per sentence | Over 25 words | FK grade | Flagged |
|---|---|---|---|---|---|---|
| `.claude/agents/code-reviewer.md` | 821 | 105 | 7.8 | 1 (1%) | 5.9 | none |
| `.claude/rules/code-quality.md` | 220 | 25 | 8.8 | 0 (0%) | 6.3 | none |
| `.claude/skills/code-review/SKILL.md` | 100 | 12 | 8.3 | 0 (0%) | 6.2 | none |
| `.claude/skills/create-pr/SKILL.md` | 683 | 65 | 10.5 | 3 (5%) | 5.3 | none |
| `.claude/skills/pr-feedback/SKILL.md` | 788 | 82 | 9.6 | 2 (2%) | 5.8 | none |

## After tranche 6

Only `rfc/README.md` changed. Casey decided on 2026-09-03 that the two merged RFC bodies stay as records.

| File | Prose words | Sentences | Avg words per sentence | Over 25 words | FK grade | Flagged |
|---|---|---|---|---|---|---|
| `rfc/README.md` | 316 | 27 | 11.7 | 2 (7%) | 9.4 | none |

The two sentences over 25 words in this row are not sentences. The metrics script joins list items that have no final period, and `rfc/README.md` has two such lists. The baseline row counts the same two joins plus one real sentence, which the rewrite split. The check script finds no sentence over 25 words in the rewritten file.

## After tranche 8

The sweep removed the abbreviation definitions that tranches 1 to 7 added, and the Terms table of the CMCD user guide. The table lists every in-scope file that the sweep changed.

| File | Prose words | Sentences | Avg words per sentence | Over 25 words | FK grade | Flagged |
|---|---|---|---|---|---|---|
| `.claude/agents/code-reviewer.md` | 819 | 105 | 7.8 | 1 (1%) | 5.9 | none |
| `.claude/skills/create-pr/SKILL.md` | 682 | 65 | 10.5 | 3 (5%) | 5.2 | none |
| `.claude/skills/pr-feedback/SKILL.md` | 782 | 82 | 9.5 | 2 (2%) | 5.7 | none |
| `AGENTS.md` | 956 | 104 | 9.2 | 1 (1%) | 5.8 | carries(1), e.g.(1), i.e.(1), vs(1) |
| `CONTRIBUTING.md` | 210 | 23 | 9.1 | 0 (0%) | 6.0 | none |
| `README.md` | 291 | 24 | 12.1 | 0 (0%) | 7.8 | none |
| `SCOPING.md` | 386 | 26 | 14.8 | 2 (8%) | 10.4 | none |
| `libs/608/README.md` | 140 | 13 | 10.8 | 0 (0%) | 6.4 | none |
| `libs/608/test/fixtures/README.md` | 140 | 13 | 10.8 | 0 (0%) | 3.9 | none |
| `libs/c2pa/README.md` | 182 | 10 | 18.2 | 3 (30%) | 9.5 | none |
| `libs/c2pa/docs/manifest-box-validation.md` | 530 | 34 | 15.6 | 3 (9%) | 8.6 | none |
| `libs/c2pa/docs/merkle-validation.md` | 403 | 29 | 13.9 | 1 (3%) | 5.8 | none |
| `libs/c2pa/docs/results-and-error-codes.md` | 255 | 20 | 12.8 | 1 (5%) | 7.8 | none |
| `libs/c2pa/docs/vsi-validation.md` | 396 | 30 | 13.2 | 3 (10%) | 7.2 | none |
| `libs/cmaf-ham/samples/cmaf-ham-conversion/README.md` | 238 | 25 | 9.5 | 1 (4%) | 4.6 | none |
| `libs/cmaf-ham/src/README.md` | 190 | 17 | 11.2 | 0 (0%) | 8.6 | none |
| `libs/cmcd/docs/user-guide.md` | 2820 | 207 | 13.6 | 7 (3%) | 7.1 | frozen(2) |
| `libs/cmcd/docs/validation-guide.md` | 506 | 38 | 13.3 | 2 (5%) | 7.6 | none |
| `libs/cta/README.md` | 33 | 5 | 6.6 | 0 (0%) | 4.5 | none |
| `libs/dash/README.md` | 4 | 1 | 4.0 | 0 (0%) | 18.4 | none |
| `libs/iso-bmff/docs/writing-boxes.md` | 190 | 17 | 11.2 | 1 (6%) | 6.0 | none |
| `rfc/README.md` | 307 | 26 | 11.8 | 2 (8%) | 9.2 | none |
