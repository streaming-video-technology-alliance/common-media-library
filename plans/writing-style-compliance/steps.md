# Writing style compliance: steps

> Execute one task at a time and tick each step when it is done. Agents with the Superpowers plugin can use its subagent-driven-development or executing-plans skill.

**Goal:** Rewrite every in-scope markdown document so it follows the Writing Style rules in `AGENTS.md`, without changing any fact, number, link, or code block.

**Architecture:** One PR per tranche. Each PR rewrites the prose of a fixed file list, runs `check.sh` against the base commit, and records after metrics in `inventory.md`. `overview.md` holds the scope, the method, and the open questions.

**Tech Stack:** Markdown, `git`, `bash`, `perl`, `diff`. No package code changes. No build.

## Global Constraints

- Follow the twelve rules under "Writing Style" in `AGENTS.md`. The plan documents follow them too.
- Do not change code blocks, tables, frontmatter, link targets, or heading text. One exception: a rewrite may add a table to hold numbers.
- Do not change a fact, a number, a hedge, or a tense. Record suspected errors under "Noticed, not changed" in the PR description.
- A rewritten file must not have more prose words than its base version.
- Every commit uses `git commit -s`, a Conventional Commits subject, and the `Co-Authored-By` trailer when an agent wrote it.
- Never push to `main`. Casey creates each PR with `/create-pr`.
- Tranches 2, 3, and 4 touch package directories. Add a note under `## [Unreleased]` in each touched package's `CHANGELOG.md`. Do not bump versions.
- Run the checks from the repository root: `bash plans/writing-style-compliance/check.sh <base-ref> <file>...`. Expected output: one PASS line per check per file. Fix every FAIL before the commit.

---

### Task 1: Tranche 1, repository documents

**Files:**
- Modify: `AGENTS.md`, `CLAUDE.md`, `README.md`, `CONTRIBUTING.md`, `SCOPING.md`, `SECURITY.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md`
- Create: `plans/writing-style-compliance/overview.md`, `plans/writing-style-compliance/inventory.md`, `plans/writing-style-compliance/steps.md`, `plans/writing-style-compliance/check.sh`

**Base:** commit 8ddcad72c on `main`, the merge of #433.

**Known violations at the base:**

| File | Violations |
|---|---|
| `AGENTS.md` | 8 em dashes, 9 semicolons, 6 sentences over 25 words, the idiom "pit of success", the metaphor "pay for what they import", "e.g." three times, "etc." twice, and the undefined abbreviations GC, PR, RFC, and DCO |
| `CLAUDE.md` | One em dash inside a 26-word sentence |
| `README.md` | 5 sentences over 25 words, the idioms "shared in spirit" and "fall out of sync", and a link with the text "here" |
| `CONTRIBUTING.md` | The phrasal verbs "scan through" and "narrow down", the typo "Mare sure", and the undefined abbreviations PR and DCO |
| `SCOPING.md` | 4 sentences over 25 words, the same two idioms as `README.md`, "etc.", and the undefined abbreviations SDK and SVTA |
| `SECURITY.md` | The GitHub template sentence "Use this section to tell people about which versions of your project are currently being supported with security updates." |
| `.github/PULL_REQUEST_TEMPLATE.md` | One sentence over 25 words and two list items nested one level too deep |
| `.github/ISSUE_TEMPLATE/bug_report.md` | "e.g." four times |
| `.github/ISSUE_TEMPLATE/feature_request.md` | Contractions and the abbreviation "Ex." |

- [x] **Step 1: Create the branch from the head of #433**

```bash
git checkout -b docs/writing-style-compliance origin/docs/agents-writing-style
```

- [x] **Step 2: Write `overview.md`, `inventory.md`, `steps.md`, and `check.sh`, then run the controls**

Negative control: `bash plans/writing-style-compliance/check.sh HEAD AGENTS.md` must print `FAIL chars` with the em dash lines. Positive control: `bash plans/writing-style-compliance/check.sh HEAD SECURITY.md` must print seven PASS lines.

```bash
git add plans/writing-style-compliance
git commit -s -m "docs(plans): writing style compliance plan, inventory, and check script"
```

- [x] **Step 3: Rewrite `AGENTS.md` outside the Writing Style section, and `CLAUDE.md`**

In the priority list, replace the em dash after each bold term with a colon. Split every sentence with a semicolon into two sentences. Define GC, PR, RFC, and DCO at first use. Replace "fall into the pit of success" and "pay for what they import" with literal sentences. Replace every "e.g." and "etc." with a list or "such as". Then remove duplication until the file is not longer than the base version.

- [x] **Step 4: Check**

```bash
bash plans/writing-style-compliance/check.sh 8ddcad72c AGENTS.md CLAUDE.md
```

Expected: every line PASS.

- [x] **Step 5: Commit**

```bash
git add AGENTS.md CLAUDE.md
git commit -s -m "docs(agents): apply the writing style rules to AGENTS.md and CLAUDE.md"
```

- [x] **Step 6: Rewrite `README.md`, `CONTRIBUTING.md`, `SCOPING.md`, and `SECURITY.md`**

Split the long paragraphs in `README.md` and `SCOPING.md`. Replace "shared in spirit" with "share the intent of these features but not the code". Replace "fall out of sync" with "a bug fixed in one player can remain in the others". Define SVTA and SDK at first use. Keep the future tense in `SCOPING.md`. Keep the code block and every link target in `README.md`.

- [x] **Step 7: Check**

```bash
bash plans/writing-style-compliance/check.sh 8ddcad72c README.md CONTRIBUTING.md SCOPING.md SECURITY.md
```

Expected: every line PASS.

- [x] **Step 8: Commit**

```bash
git add README.md CONTRIBUTING.md SCOPING.md SECURITY.md
git commit -s -m "docs: apply the writing style rules to the repository documents"
```

- [x] **Step 9: Rewrite the three templates under `.github/`**

Remove "please". Replace each "e.g." with "for example". Fix the nesting of the two attribution items in the PR template. Keep the frontmatter of the issue templates.

- [x] **Step 10: Check**

```bash
bash plans/writing-style-compliance/check.sh 8ddcad72c .github/PULL_REQUEST_TEMPLATE.md .github/ISSUE_TEMPLATE/bug_report.md .github/ISSUE_TEMPLATE/feature_request.md
```

Expected: every line PASS.

- [x] **Step 11: Commit**

```bash
git add .github
git commit -s -m "docs(github): apply the writing style rules to the issue and PR templates"
```

- [x] **Step 12: Record the after metrics**

Run the metrics script on the nine files. Add the rows under "After tranche 1" in `inventory.md`.

```bash
git add plans/writing-style-compliance/inventory.md
git commit -s -m "docs(plans): record the tranche 1 metrics"
```

- [ ] **Step 13: Push and hand over**

```bash
git push -u origin docs/writing-style-compliance
```

Casey creates the PR with `/create-pr`. #433 merged on 2026-09-03 while tranche 1 was in progress, so the branch was rebased onto `main` first:

```bash
git rebase --onto origin/main 26fd67982 docs/writing-style-compliance
```

---

### Task 2: Tranche 2, package READMEs and short guides

**Files:**
- Modify: `libs/608/README.md`, `libs/c2pa/README.md`, `libs/cmaf-ham/README.md`, `libs/cmcd/README.md`, `libs/cmsd/README.md`, `libs/content-steering/README.md`, `libs/cta/README.md`, `libs/dash/README.md`, `libs/drm/README.md`, `libs/id3/README.md`, `libs/iso-8601/README.md`, `libs/iso-bmff/README.md`, `libs/mse/README.md`, `libs/request/README.md`, `libs/structured-field-values/README.md`, `libs/throughput/README.md`, `libs/utils/README.md`, `libs/webvtt/README.md`, `libs/xml/README.md`
- Modify: `libs/cmaf-ham/src/README.md`, `libs/cmaf-ham/samples/cmaf-ham-conversion/README.md`, `libs/608/test/fixtures/README.md`
- Modify: `libs/iso-bmff/docs/reading-boxes.md`, `libs/iso-bmff/docs/utilities.md`, `libs/iso-bmff/docs/writing-boxes.md`
- Modify: `libs/<package>/CHANGELOG.md` for each of the 19 packages, one line under `## [Unreleased]`

**Base:** `origin/main` after Task 1 merges.

**Known violations at the base:** `libs/608/README.md` has 2 sentences over 25 words and the verbs "carries" and "come from". `libs/c2pa/README.md` has "carries" three times and "vs" twice. `libs/iso-bmff/README.md` has one sentence over 25 words. `libs/608/test/fixtures/README.md` has "carry" twice. `libs/cmaf-ham/samples/cmaf-ham-conversion/README.md` has 2 sentences over 25 words. `libs/iso-bmff/docs/writing-boxes.md` has one "e.g." and one sentence over 25 words. `libs/iso-bmff/docs/reading-boxes.md` has one sentence over 25 words. The other READMEs are one to four sentences and mostly pass already.

- [x] **Step 1: Create the branch**

```bash
git fetch origin
git checkout -b docs/writing-style-readmes origin/main
```

Done differently on 2026-09-03: #434 (Task 1) was still open, so the branch was created from the #434 head f848ca616 instead. The checks use `origin/main` as the base, because the `libs/` trees of both commits are identical. Rebase onto `main` after #434 merges.

- [x] **Step 2: Rewrite the 19 package READMEs by the method in `overview.md`**

Code examples do not change. If a code block must change, build first and run the block from the repository root:

```bash
npm run build
sed -n '/^```typescript/,/^```/p' libs/<package>/README.md | sed '1d;$d' | node --input-type=module
```

- [x] **Step 3: Check**

```bash
bash plans/writing-style-compliance/check.sh origin/main libs/*/README.md
```

Expected: every line PASS.

- [x] **Step 4: Add the changelog notes**

Under `## [Unreleased]` in each of the 19 `libs/<package>/CHANGELOG.md` files, add: `- docs: rewrote the README for readers who do not read English as a first language`. If a package has no `## [Unreleased]` heading, add one above the newest version heading.

- [x] **Step 5: Commit**

```bash
git add libs/*/README.md libs/*/CHANGELOG.md
git commit -s -m "docs: apply the writing style rules to the package READMEs"
```

- [x] **Step 6: Rewrite the three other READMEs and the three iso-bmff guides**

- [x] **Step 7: Check**

```bash
bash plans/writing-style-compliance/check.sh origin/main libs/cmaf-ham/src/README.md libs/cmaf-ham/samples/cmaf-ham-conversion/README.md libs/608/test/fixtures/README.md libs/iso-bmff/docs/reading-boxes.md libs/iso-bmff/docs/utilities.md libs/iso-bmff/docs/writing-boxes.md
```

Expected: every line PASS.

- [x] **Step 8: Commit**

```bash
git add libs/cmaf-ham libs/608 libs/iso-bmff
git commit -s -m "docs: apply the writing style rules to the sample, fixture, and iso-bmff guides"
```

- [x] **Step 9: Record the after metrics in `inventory.md` under a new "After tranche 2" heading, commit, and push**

```bash
git add plans/writing-style-compliance/inventory.md
git commit -s -m "docs(plans): record the tranche 2 metrics"
git push -u origin docs/writing-style-readmes
```

Casey creates the PR with `/create-pr`.

**Outcome (2026-09-03):** twelve files changed. The other 13 files are package READMEs of one or two sentences. They already followed the rules and are unchanged, so their packages have no changelog note. The fixture, sample, and `src/` READMEs are not shipped with a package, so they have no changelog note either. `libs/dash/README.md` grew from 4 to 9 prose words because it now defines DASH. That growth is the one failed check. Every other check passed for every file.

---

### Task 3: Tranche 3, CMCD guides

**Files:**
- Modify: `libs/cmcd/docs/user-guide.md`, `libs/cmcd/docs/report-recorder-guide.md`, `libs/cmcd/docs/validation-guide.md`
- Modify: `libs/cmcd/CHANGELOG.md`, one line under `## [Unreleased]`

**Base:** `origin/main` after Task 2 merges.

**Known violations at the base:** the user guide has 45 sentences over 25 words (31 percent). It also has "e.g." three times and the verbs "carries", "carry", "holds", "stay", and "shape". The report recorder guide has 8 sentences over 25 words and the phrase "straight into" twice. The validation guide has 6 sentences over 25 words and "e.g." twice. The user guide has 2,860 prose words, so rule 3 requires a short Terms list near the top.

**Anchors to keep:** the `## Custom keys` headings in `user-guide.md` and `validation-guide.md`. The two guides link to each other with `#custom-keys`.

- [x] **Step 1: Create the branch**

```bash
git fetch origin
git checkout -b docs/writing-style-cmcd-guides origin/main
```

Done differently on 2026-09-03: tranche 2 had no PR yet, so the branch was created from the tranche 2 head cbb326950 instead. The checks use `origin/main` as the base, because the `libs/cmcd/docs` trees are identical. Rebase onto `main` after tranche 2 merges.

- [x] **Step 2: Rewrite `user-guide.md`**

Add a Terms list after the introduction. Define each abbreviation the guide uses at first use, including CMCD, CTA, and any key names it explains. Keep every code block and table.

- [x] **Step 3: Check**

```bash
bash plans/writing-style-compliance/check.sh origin/main libs/cmcd/docs/user-guide.md
```

Expected: every line PASS. If the Terms list makes the blocks check show one new table, that difference is the only allowed one.

- [x] **Step 4: Commit**

```bash
git add libs/cmcd/docs/user-guide.md
git commit -s -m "docs(cmcd): apply the writing style rules to the user guide"
```

- [x] **Step 5: Rewrite `report-recorder-guide.md` and `validation-guide.md`**

- [x] **Step 6: Check**

```bash
bash plans/writing-style-compliance/check.sh origin/main libs/cmcd/docs/report-recorder-guide.md libs/cmcd/docs/validation-guide.md
```

Expected: every line PASS.

- [x] **Step 7: Add the changelog note and commit**

Under `## [Unreleased]` in `libs/cmcd/CHANGELOG.md`: `- docs: rewrote the user, report recorder, and validation guides for readers who do not read English as a first language`.

```bash
git add libs/cmcd
git commit -s -m "docs(cmcd): apply the writing style rules to the report recorder and validation guides"
```

- [x] **Step 8: Record the after metrics under "After tranche 3" in `inventory.md`, commit, and push**

```bash
git push -u origin docs/writing-style-cmcd-guides
```

Casey creates the PR with `/create-pr`.

**Outcome (2026-09-03):** all three guides changed. The User Guide has a new Terms table after the introduction. That table is the one difference the blocks check reports. The Validation Guide heading that compared errors with warnings now reads "Errors and Warnings". The rules ban the abbreviation it used, and no link points at that heading. Every other check passed for every file. See "Noticed, not changed (tranche 3)" in `overview.md` for the frozen text that still breaks a rule.

---

### Task 4: Tranche 4, C2PA guides

**Files:**
- Modify: `libs/c2pa/docs/manifest-box-validation.md`, `libs/c2pa/docs/merkle-validation.md`, `libs/c2pa/docs/results-and-error-codes.md`, `libs/c2pa/docs/vsi-validation.md`
- Modify: `libs/c2pa/CHANGELOG.md`, one line under `## [Unreleased]`

**Base:** `origin/main` after Task 3 merges.

**Known violations at the base:** 18 sentences over 25 words across the four files. "vs" appears 10 times and "carries" or "carry" 8 times. `merkle-validation.md` averages 22.7 words per sentence. The section references in the form "§19.4" are facts and stay.

- [x] **Step 1: Create the branch**

```bash
git fetch origin
git checkout -b docs/writing-style-c2pa-guides origin/main
```

Done differently on 2026-09-03: tranches 2 and 3 had no PR yet, so the branch was created from the tranche 3 head 56ff94ea9 instead. The checks use `origin/main` as the base, because the `libs/c2pa/docs` trees are identical. Rebase onto `main` after tranche 3 merges.

- [x] **Step 2: Rewrite the four guides by the method in `overview.md`**

Replace each use of "vs" with "compared with" or with a two-column table. Define VSI, EMSG, BMFF, COSE, and Merkle tree at first use in each file.

- [x] **Step 3: Check**

```bash
bash plans/writing-style-compliance/check.sh origin/main libs/c2pa/docs/*.md
```

Expected: every line PASS.

- [x] **Step 4: Add the changelog note and commit**

Under `## [Unreleased]` in `libs/c2pa/CHANGELOG.md`: `- docs: rewrote the validation guides for readers who do not read English as a first language`.

```bash
git add libs/c2pa
git commit -s -m "docs(c2pa): apply the writing style rules to the validation guides"
```

- [x] **Step 5: Record the after metrics under "After tranche 4" in `inventory.md`, commit, and push**

```bash
git push -u origin docs/writing-style-c2pa-guides
```

Casey creates the PR with `/create-pr`.

**Outcome (2026-09-03):** all four guides changed, and every check passed for every file. No heading changed. HLS and DASH stay as names in the VOD Merkle guide, where they are examples. Their expansion pushed one sentence over 25 words and the file over its base length. VSI/EMSG stays undefined in the VOD Merkle guide, where it appears only as a link name. See "Noticed, not changed (tranche 4)" in `overview.md` for the frozen text that still breaks a rule.

---

### Task 5: Tranche 5, agent instructions

**Files:**
- Modify: `.claude/agents/code-reviewer.md`, `.claude/rules/code-quality.md`, `.claude/skills/code-review/SKILL.md`, `.claude/skills/create-pr/SKILL.md`, `.claude/skills/pr-feedback/SKILL.md`

**Base:** `origin/main` after Task 4 merges.

**Known violations at the base:** 10 sentences over 25 words across the five files. "e.g." appears 7 times and "vs" 4 times. `code-reviewer.md` uses "hot path". The frontmatter of every file (`name`, `description`, and the other keys) is configuration and must stay byte for byte.

- [x] **Step 1: Create the branch**

```bash
git fetch origin
git checkout -b docs/writing-style-agent-instructions origin/main
```

Done differently on 2026-09-03: tranches 2 to 4 had no PR yet, so the branch was created from the tranche 4 head 85c76ceb6 instead. The checks use `origin/main` as the base, because the `.claude` trees are identical. Rebase onto `main` after tranche 4 merges.

- [x] **Step 2: Rewrite the five files by the method in `overview.md`**

- [x] **Step 3: Check, including the frontmatter**

```bash
bash plans/writing-style-compliance/check.sh origin/main .claude/agents/code-reviewer.md .claude/rules/code-quality.md .claude/skills/*/SKILL.md
for f in .claude/agents/code-reviewer.md .claude/rules/code-quality.md .claude/skills/*/SKILL.md; do diff <(git show origin/main:$f | sed -n '1,/^---$/p' | sed -n '2,$p') <(sed -n '1,/^---$/p' $f | sed -n '2,$p') && echo "PASS frontmatter $f"; done
```

Expected: every line PASS.

- [x] **Step 4: Commit, record the after metrics under "After tranche 5", and push**

```bash
git add .claude plans/writing-style-compliance/inventory.md
git commit -s -m "docs(claude): apply the writing style rules to the agent instructions"
git push -u origin docs/writing-style-agent-instructions
```

Casey creates the PR with `/create-pr`.

**Outcome (2026-09-03):** all five files changed, and every check passed for every file. The frontmatter of each file and every shell injection line are byte-identical to the base. Every directive kept its wording and emphasis. Double hyphens that stood for dashes became periods or commas. DCO, PR, and ESM are defined at first use. See "Noticed, not changed (tranche 5)" in `overview.md`.

---

### Task 6: Tranche 6, RFC process and merged RFCs

**Depends on:** open question 1 in `overview.md`.

**Files:**
- Modify: `rfc/README.md`
- Modify, only if Casey approves: `rfc/cmcd-reporter-middleware.md`, `rfc/cmcd-session-retention.md`

**Base:** `origin/main` after Task 5 merges.

**Known violations at the base:** `rfc/README.md` has 3 sentences over 25 words and the verbs "settle" and "shape". The two RFC bodies average 20.4 and 23.3 words per sentence, with 30 and 40 percent of sentences over 25 words. Both exceed 1,500 words and need a Terms list.

- [ ] **Step 1: Create the branch**

```bash
git fetch origin
git checkout -b docs/writing-style-rfc origin/main
```

- [ ] **Step 2: Rewrite `rfc/README.md`**

- [x] **Step 3: Check**

```bash
bash plans/writing-style-compliance/check.sh origin/main rfc/README.md
```

Expected: every line PASS.

- [x] **Step 4: Commit**

```bash
git add rfc/README.md
git commit -s -m "docs(rfc): apply the writing style rules to the RFC process document"
```

- [x] **Step 5: If approved, rewrite one RFC body per commit with a Terms list, check each, and commit each**

```bash
bash plans/writing-style-compliance/check.sh origin/main rfc/cmcd-reporter-middleware.md
bash plans/writing-style-compliance/check.sh origin/main rfc/cmcd-session-retention.md
```

Expected: every line PASS for each file.

- [x] **Step 6: Record the after metrics under "After tranche 6" in `inventory.md`, commit, and push**

```bash
git push -u origin docs/writing-style-rfc
```

Casey creates the PR with `/create-pr`.
