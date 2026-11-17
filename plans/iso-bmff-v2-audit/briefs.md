# Briefs for the sessions that act on the audit

Each section is the first message of one session. The drm fix (issue 683) has its own session and no brief here.

## 1. Documentation fixes (base `main`)

Fix the documentation findings of the iso-bmff audit. Branch from `origin/main`, target `main`, one PR.

Source: the audit on the branch `feat/iso-bmff-v2`. Read the index with `git show origin/feat/iso-bmff-v2:plans/iso-bmff-v2-audit/findings.md`. Read the details with `git show origin/feat/iso-bmff-v2:plans/iso-bmff-v2-audit/details-non-breaking.md`. Each finding has a heading with its ID, the evidence, and a "Proposal after verification".

Findings in scope (36): F31 F34 F57 F58 F60 F110 F184 F187 F262 F292 F330 F334 F335 F336 F338 F340 F341 F342 F343 F359 F360 F366 F368 F369 F370 F371 F392 G461 G510 G518 G520 G525 G526 G527 G528 G529.

Optional, only if the change is small: F316 F346 F365 G452.

Rules:

- Only F340 and F327 have a check by hand. Confirm each finding against the source before the fix. If a finding is wrong, skip it and state the reason.
- Change only TSDoc, READMEs, guides, the changelog, and example regions of tests. Do not change a public type, a name, or a run-time result. If a fix needs such a change, stop and list the finding as not done.
- Do not copy the plan files into the branch.
- Follow AGENTS.md: the Writing Style, a changelog entry under `[Unreleased]`, the root `npm test`, and a commit of the regenerated API report and `skills/` files.

Done: one PR against `main`. The description has a table with the result for each finding ID.

## 2. Code, test, and configuration fixes (base `main`)

Fix the code findings of the iso-bmff audit that break nothing. Branch from `origin/main`, target `main`.

Source: `git show origin/feat/iso-bmff-v2:plans/iso-bmff-v2-audit/findings.md` and `git show origin/feat/iso-bmff-v2:plans/iso-bmff-v2-audit/details-non-breaking.md`.

Findings in scope (23):

- Code and configuration: F126 F196 F236 F258 F265 F286 F287 F289 F310 F317 F327 F387 F417 G456 G503 G505 G506 G508 G519.
- Tests: F294 F384 F389 F390.

Optional, only if the change is small and measured: F16 F29 F111 F121 F291 F311 F313 F388.

Rules:

- Present the plan before any fix. For each finding, state if it holds at HEAD, the planned change, and the cost. Wait for approval. Only F327 has a check by hand.
- No breaking change. A fix must not change a public type, an export name, or the result for valid input. If a finding needs such a change, list it for the 2.0.0 RFC and skip it.
- G503 and G505 are in `@svta/cml-utils`. Put them in a separate PR.
- Measure every performance claim and every bundle claim before and after. Do not accept a claim from the audit text.
- Keep the settled decisions. A writer does not throw for a missing field and does not check the range of a number (PR 669). `readIsoBoxes` stops with no error at a bad box size (PR 662).
- Follow AGENTS.md: a test for each behavior fix, a changelog entry for each change, the root `npm test`.

Done: PRs against `main`, each with a table of finding IDs and results.

## 3. Amendments to the cursor RFC (PR 682)

Amend the cursor RFC (PR 682, branch `rfc/iso-bmff-cursor-api`, base `feat/iso-bmff-v2`) with the audit findings. Text only, no package code.

Check the PR state first. The RFC must describe the package code of `main` as version 1. `feat/iso-bmff-v2` equals `main` plus `plans/iso-bmff-v2-audit/`. If the RFC text still describes the code of version 1.0.7 (a "Baseline" section, 62 readers), correct that first. Then merge `feat/iso-bmff-v2` into the PR branch.

Source: `plans/iso-bmff-v2-audit/findings.md` (group "Corrections to the cursor RFC") and `details-rfc.md`. The findings refer to the first draft at commit 8ce63c212, so the line numbers are old.

Work:

1. For each of the 30 rows, and for the merged duplicates G495 and G469, decide against the current text: still open, already fixed, or obsolete. Present that table before any edit.
2. The rows with the highest value:
   - G480: the cursor type is invariant in `V`, so the accepted `int64` rule does not compile. Build a tsc model to confirm.
   - F240: the container rule reverses issue 651 and PR 673.
   - G462: the raw box needs the header size. c2pa reads the box body at four places.
   - G482: `readonly` cursor fields and a rule for buffer growth.
   - G497 and G498: a wrong claim in the Summary and wrong counts.
   - G499 and G502: conflicts with the two accepted RFCs, and no migration guide.
3. Add two audit themes to this RFC, because they define its types. The findings are in `details-breaking.md`.
   - Theme 3: the result type of `readIsoBoxes`, the child types, and `isIsoBoxType` must match the run-time value (F188, F189, F270, F53, F173, F194, F85, G468, G522).
   - Theme 4: `writeIsoBoxes` copies a box with a `bytes` field before it uses the writers map (F237).
4. Three issues ask for RFC text: 693 (the cursor position after a truncated box), 694 (the contract of a `uuid` reader and writer), and 696 (a step over sibling boxes).

Rules:

- An edit that changes the proposed API is a decision for the maintainer. Present it as a question with a recommendation, one question for each open rule.
- Follow the Writing Style of AGENTS.md and `rfc/README.md`.
- Do not delete the plan files.

Done: commits on the PR branch, an updated PR description, and a table with the result for each finding ID.

## 4. Second RFC: the other breaking changes of 2.0.0

Draft a second RFC for `@svta/cml-iso-bmff` 2.0.0. It covers the breaking changes that are not part of the cursor API. Branch from `origin/feat/iso-bmff-v2`, save the file as `rfc/<name>.md` per `rfc/README.md`, and open a draft PR against `feat/iso-bmff-v2`.

Source: `plans/iso-bmff-v2-audit/findings.md` (section "Decisions for the maintainer" and group "Breaking changes for 2.0.0") and `details-breaking.md`. Read `rfc/iso-bmff-cursor-api.md` of PR 682 first. This RFC builds on its types and must not contradict it.

Ten themes, one decision each:

1. One field name for child boxes: `entries` becomes `boxes` in `stsd` and `dref` (F152).
2. Count fields that repeat a list length (F190, issue 625). `stsz`, `saiz`, and `ctts` of version 2 or above keep the count.
3. Byte fields: `Uint8Array`, one entry for each key ID, a string for `compressorName` (F199, G473, F418, F4, F72).
4. Four-character codes: one type, and a writer that always writes 4 bytes (F400, F20).
5. Names (F171, F88, F178, F280, F332, F405, F406, F411, F174, G513, G517, F180).
6. Types with no reader and no writer (F204, F94, F415, issue 652).
7. Errors: one type for a short box, found by type and not by message text (F229, F222, G457).
8. Strings: one size rule, the writers of terminated strings, the `mdhd` language (F224, G447, G449, F246, F409).
9. Reserved fields (F200).
10. Rules for an optional configuration (F279).

Then place each other row of the breaking group under a theme, or list it as "not in this RFC" with a reason.

Rules:

- Confirm each finding at HEAD before it enters the RFC. Only F152, F237, F94, F20, and F270 have a check by hand.
- Do not reopen the range check for a number (G446, PR 669) or the other rows of the group "Rows that conflict with a recorded decision".
- The rule for names is the specification first, then the community at large, and never parity with codem-isoboxer. Survey hls.js, dash.js, and shaka-player before a recommendation on names or shapes.
- For each theme, give the current state, one example, the proposed rule, the migration for adopters, the cost, and the alternatives. Measure the bytes where a theme changes code. Open points go in "Unresolved questions", one question for each rule.
- Issue 698 lists the code in drm and c2pa that these themes change.
- Text only. No package code. Follow the Writing Style of AGENTS.md.

Done: a draft RFC PR against `feat/iso-bmff-v2`, and a table that maps every breaking finding ID to a theme or to "not in this RFC".
