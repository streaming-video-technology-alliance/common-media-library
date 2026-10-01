# CMCD session roadmap

> **For agentic workers:** This file is a roadmap. Work one phase at a time, in the order of the status table. A task with full steps can run now. A phase marked "detailed plan at phase start" gets its own plan file, written with superpowers:writing-plans when the phase starts. Run code tasks with superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `createCmcdSession()`, deprecate and then remove `CmcdReporter`, and close the pull requests that the session RFC supersedes.

**Architecture:** [rfc/cmcd-session.md](../../rfc/cmcd-session.md) is the contract. [analysis.md](analysis.md), [option-1.md](option-1.md), and [option-2.md](option-2.md) hold the evidence. The prototype is in [prototype/option-2.md](prototype/option-2.md).

**Tech Stack:** TypeScript, `node:test`, tsdown builds, rolldown bundle checks, the `gh` CLI.

## How to use this plan

1. Find the first phase in the status table that is not done and whose dependencies are done.
2. If the phase says "detailed plan at phase start", write that plan first and link it in the table.
3. Tick each task when its "Done when" line is true.
4. Update the status table and add a line to the log.
5. Stop at every task owned by Casey, and at every decision.

## Global Constraints

- Never commit to `main`. Every change goes on a feature branch and merges through a PR.
- Every commit uses `git commit -s` and has the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- The agent pushes branches. Casey opens every PR with `/create-pr <base>`.
- Before a push to a PR branch, check the PR state with `gh pr view <number> --json state`.
- Every change adds a note under `## [Unreleased]` in the `CHANGELOG.md` of the affected package.
- Version bumps happen only in release-prep PRs, with `npm run ver` and then `npm run prepare-release`.
- The root `npm test` passes before every push.
- All prose follows the writing style of AGENTS.md, including PR comments and changelog entries.
- A public API change needs an accepted RFC first. A bug fix does not.
- Library code never calls `console`.
- No `.ts` files under `plans/`. The root typecheck and lint cover every `.ts` file outside `dist`.

## Status

| Phase | State | Depends on | Detailed plan |
|---|---|---|---|
| 0. RFC review and acceptance | not started | none | this file |
| 1. Superseded pull requests | not started | 0.2 for notices, 0.6 for closing | this file |
| 2. Release 2.8.0 | not started | none | this file, and [the port plan](../cmcd-encode-pipeline-port/steps.md) |
| 3. Session API | blocked | 0.6, 2.4 | detailed plan at phase start |
| 4. Deprecation and release | blocked | 3 | this file |
| 5. Player migrations | blocked | 4 | one plan for each player, at phase start |
| 6. Removal of `CmcdReporter` | blocked | 5, or the date from 0.5 | detailed plan at phase start |

## Phase 0: RFC review and acceptance

Entry: the RFC is committed on the local branch `rfc/cmcd-session` (commits df085bba8 and 22e9b3a44).

- [ ] **0.1 Amend the RFC with three parts of PR 460 (agent).**
  - Configuration checks. `createCmcdSession()` and `configure()` throw in these cases:
    - `sid` is not a non-empty string of at most 64 characters.
    - `cid` has more than 128 characters.
    - `enabledKeys` or `customHeaderMap` names an unknown key.
    - `events` names an unknown event type.
    - A target has no `url`.
    - `interval` is negative or not finite.
    - `batchSize` is not a positive integer.

    The message has the form `createCmcdSession: <parameter> must be <expected>, received <value>`. PR 460 has the checks in `libs/cmcd/src/checkRequestSettings.ts`.
  - Response timing. `ttfb` is set only when `responseStart` is above 0 and not earlier than `startTime`. Resource Timing reports 0 for a cross-origin response without `Timing-Allow-Origin`. `ttlb` comes from `duration` when it is above 0, else from `responseEnd` minus `startTime`. PR 460 has the rules in `libs/cmcd/src/toResponseKeys.ts`.
  - The `h` event. Add `CMCD_EVENT_HOSTNAME` and `CmcdEventType.HOSTNAME` to the new exports. CTA-5004-B defines the event, and `main` has no constant for it. The key table on the port branch already accepts `e=h`.
  - Update the prototype in the session scratchpad, and run the example check from the RFC method again.
  - Done when: the RFC describes the three parts, and the prototype and the RFC examples pass.
- [ ] **0.2 Push the branch and open the RFC PR.** The agent pushes `rfc/cmcd-session` after Casey agrees. Casey opens the PR "[RFC] CMCD session" with `/create-pr main`. Record the PR link here, and use it for `{rfc-pr}` in Phase 1.
  - Done when: the PR is open, and its link is in this file.
- [ ] **0.3 Post the notices on the superseded PRs.** Task 1.1 has the steps.
- [ ] **0.4 Ask the player maintainers for review (Casey).** Ask Daniel Silhavy (dash.js), Rob Walch (hls.js), Qualabs (@cotid-qualabs), Nicolas Levy, and the shaka-player maintainers.
  - Done when: each maintainer has a review request or a mention on the RFC PR.
- [ ] **0.5 Resolve the unresolved questions (Casey and the reviewers).** The questions are the API name, the name of `includeOnce()`, the default for a missing `enabledKeys`, the queue limit, the retry rule, and the removal timing of `CmcdReporter`.
  - Done when: the RFC records an answer for each question.
- [ ] **0.6 Accept the RFC (Casey).** Write the Final Decision section, set `status: accepted`, and squash-merge with the subject `docs(rfc): CMCD session`.
  - Done when: the accepted RFC is on `main`.

## Phase 1: Superseded pull requests

Entry: the RFC PR exists (Task 0.2).

| PR | Branch | What it is | Action |
|---|---|---|---|
| 398 | `claude/cmcdreporter-spawn-clone-4gzey8` | RFC: child reporters for `CmcdReporter` | Close. One shared session covers several players. |
| 422 | `refactor/cmcd-reporter-architecture` | Restructure of `CmcdReporter`, with PR 452 merged into its branch | Close. `CmcdReporter` is deprecated. |
| 455 | `rfc/cmcd-session-api` | Draft RFC: session API for CMCD version 2 | Close as superseded. Decision in Task 1.3. |
| 460 | `feat/cmcd-session-api` | Implementation of RFC 455, based on the branch of PR 455 | Close after the salvage in Task 1.2. |

- [ ] **1.1 Post the notices (agent, after Casey approves the text).** Check the state of each PR first. Replace `{rfc-pr}` with the link from Task 0.2.

  PR 398:

  > The session RFC ({rfc-pr}) replaces this proposal. In the session API, several media players share one session, because the session keeps no state for a player. Each player passes its own `cid`. All players report under one `sid`, with one sequence number for each target. That covers the interstitial and SGAI case of this RFC without child reporters. The session RFC also deprecates `CmcdReporter`.
  >
  > @nicolaslevy @cotid-qualabs @robwalch @dsilhavy, please review the session RFC. This PR closes when that RFC is accepted.

  PR 422:

  > The session RFC ({rfc-pr}) deprecates `CmcdReporter`, and the next major version removes it. This restructure of `CmcdReporter` therefore has no further use. The branch includes #452, which merged into it. This PR closes when the session RFC is accepted. The branch stays until the session API ships.

  PR 455:

  > The session RFC ({rfc-pr}) supersedes this RFC. The new design keeps one session for each `sid`. It drops the derived keys, the reporters for each media player, `rotate()`, and the request origins. The design record in `plans/cmcd-reporting-architecture/` explains the change with data from hls.js, dash.js, and shaka-player. This PR closes when the session RFC is accepted.

  PR 460:

  > This PR implements RFC #455, and the session RFC ({rfc-pr}) supersedes that RFC. The new implementation reuses four parts of this PR. Three are the `h` event constant, the response timing rules in `toResponseKeys.ts`, and the configuration checks in `checkRequestSettings.ts`. The fourth is the test scenarios of the delivery, error, request, and response tests. The key table already moved into the encoder on the port branch. This PR closes when the session RFC is accepted. The branch stays until the new implementation ships.

  - Done when: all four comments are posted.
- [ ] **1.2 Record the salvage list for Phase 3 (agent).** Copy into the Phase 3 plan the source paths of the four parts named in the PR 460 notice. The test files are `libs/cmcd/test/CmcdSession.delivery.test.ts`, `CmcdSession.errors.test.ts`, `CmcdSessionReporter.request.test.ts`, and `CmcdSessionReporter.responses.test.ts` on `feat/cmcd-session-api`.
  - Done when: the Phase 3 plan lists the paths and the scenarios to port.
- [ ] **1.3 Decide how PR 455 ends (Casey).** Option A, recommended: close it unmerged. The new design record already explains the change. Option B: set `status: superseded`, add a Final Decision that links the session RFC, and squash-merge it as a record. Option B also adds about 5900 lines of the old design record to `main`.
  - Done when: the decision is in the log.
- [ ] **1.4 Close the four PRs after Task 0.6 (Casey, or the agent at Casey's request).** Use this comment:

  > Closed. The session RFC ({rfc-pr}) was accepted, and it supersedes this PR.

  - Done when: PRs 398, 422, 455, and 460 are closed, or PR 455 is merged as a record (Option B).
- [ ] **1.5 Delete the branches after Phase 3 merges (Casey).** The branches are the four in the table and `refactor/cmcd-reporter-structural-followups`, the branch of the merged PR 452. A deletion is permanent, so confirm the list first.
  - Done when: the five remote branches are gone.

## Phase 2: Release 2.8.0

Entry: none. This phase does not depend on the RFC.

- [ ] **2.1 Decide the scope of the port optimizations (Casey).** Recommendation: optimization 3 only, which drops the token checks, as [analysis.md](analysis.md) explains in "Effect on the port branch". Skip optimizations 1 and 2. Replace the speed gate with the bundle gate. The prepare step costs about 1 µs of a report that takes 10 to 20 µs.
  - Done when: the decision is in the log.
- [ ] **2.2 Finish the port branch (agent).** The branch is `refactor/cmcd-encode-pipeline-port`, with 6 local commits on 501281b70.
  1. Add the decided optimizations as Task 7 to [the port plan](../cmcd-encode-pipeline-port/steps.md), with full steps, and run it.
  2. Run the final whole-branch review. The deferred minor findings are in `.superpowers/sdd/steps/progress.md`.
  3. Run the root `npm test`, the differential run, the bundle measurement, and the bare-import probe.
  4. Push the branch. Casey opens the PR with `/create-pr refactor/cmcd-encode`.
  - Done when: the port PR is merged into `refactor/cmcd-encode`.
- [ ] **2.3 Fix `recordResponseReceived()` for requests without a provenance record (agent).** The full steps are in [Task 2.3 in detail](#task-23-in-detail).
  - Done when: the fix PR is merged into `refactor/cmcd-encode`.
- [ ] **2.4 Merge `refactor/cmcd-encode` into `main` (Casey).** Casey opens the PR with `/create-pr main` from `refactor/cmcd-encode`. The perf fix of `urlToRelativePath` is a separate utils PR to `main`, from `perf/utils-relative-url-no-throw`. It can ship in the same release.
  - Done when: `main` contains the integration branch, and the root `npm test` passes on `main`.
- [ ] **2.5 Prepare and publish release 2.8.0 (agent prepares, Casey merges).** Create `release/cmcd-2.8.0` from `main`. Run `npm run ver cmcd 2.8.0`. Fix the `????-??-??` date and remove the empty section that the script leaves. Run `npm run prepare-release` for the cascade. After the merge, the Publish workflow publishes the packages. Create the GitHub release with the changelog section as the notes.
  - Done when: `@svta/cml-cmcd@2.8.0` is on npm.

## Phase 3: Session API

Detailed plan at phase start. Entry: Tasks 0.6 and 2.4 are done.

- [ ] **3.1 Write the detailed plan (agent).** Use superpowers:writing-plans, and save the result as `plans/cmcd-reporting-architecture/session-steps.md`. The inputs are:
    - the accepted RFC and the prototype listing
    - the salvage list from Task 1.2
    - the eight scenarios of the prototype test
    - the spec-rule tests of the current `CmcdReporter` suite: `msd` checks, the `bg` exit, 410 by URL, batching, and response timing
  - The plan covers these deliverables, each with its own test cycle:
    - the types and the exports, including `CMCD_EVENT_HOSTNAME`
    - `createRequestReport()`
    - `recordEvent()` and `filter`
    - `recordResponseReceived()` with the timing rules of Task 0.1
    - `recordError()` and `includeOnce()`, with their value checks
    - delivery: batches, response statuses, and the queue limit
    - the timers, `start()`, and `stop()`
    - `configure()` and the configuration checks
    - the README quick start, the user guide section, and the migration guide
    - TSDoc with `@example` regions in the tests, and the changelog entries
    - the API report review, the bundle measurement, the bare-import probe, and a speed check against `CmcdReporter`
  - Done when: the plan file exists and is linked in the status table.
- [ ] **3.2 Run the detailed plan (agent).** Create `feat/cmcd-session` from `main`, and run the plan with superpowers:subagent-driven-development.
  - Done when: every task of the plan is complete, and the final review is clean.
- [ ] **3.3 Push and open the PR.** The agent pushes. Casey opens the PR with `/create-pr main`.
  - Done when: the session API is merged into `main`.

## Phase 4: Deprecation and release

Entry: Phase 3 is merged. The RFC requires the deprecation and the session API in the same release.

- [ ] **4.1 Deprecate `CmcdReporter` (agent).** Add `@deprecated` to the TSDoc of the 11 exports in the deprecation table of the RFC. Each notice says "Use `createCmcdSession()`" and links the migration guide. Add a `### Deprecated` changelog entry and a note in the user guide.
  - Done when: the API report shows the 11 deprecation notices and no other change, and the root `npm test` passes.
- [ ] **4.2 Prepare and publish release 2.9.0 (agent prepares, Casey merges).** Follow the steps of Task 2.5 with version 2.9.0.
  - Done when: `@svta/cml-cmcd@2.9.0` is on npm with `createCmcdSession()` and the deprecation notices.

## Phase 5: Player migrations

One plan for each player, at phase start. Entry: release 2.9.0. Each upstream PR belongs to the player project, so Casey decides how to propose it.

- [ ] **5.1 hls.js.** Replace `CmcdReporter` in `src/controller/cmcd-controller.ts`. The controller keeps a state object and checks state changes in `setPlayerState()`. It passes `snapshot` for `t` reports and records responses with `recordResponseReceived()`. Interstitial asset players can share the session of the primary player.
  - Done when: hls.js releases on the session API.
- [ ] **5.2 dash.js.** Coordinate with Daniel Silhavy and Qualabs. Replace `CmcdReporter` in `src/streaming/controllers/CmcdController.js`. Apply `eventTargets[].includeInRequests` to `rr` reports with `filter`. Use `configure()` instead of a new reporter for manifest settings, and send `msd` with `includeOnce()`.
  - Done when: dash.js releases on the session API.
- [ ] **5.3 shaka-player.** Coordinate with the shaka-player maintainers. The vendored Closure port in `third_party/cml-cmcd` needs a new port, unless the TypeScript migration of shaka-player comes first.
  - Done when: shaka-player releases on the session API, or its maintainers choose to wait.

## Phase 6: Removal of `CmcdReporter`

Detailed plan at phase start. Entry: Phase 5 is done, or the removal date from Task 0.5 has come.

- [ ] **6.1 Confirm the removal version (Casey).** Compare the state of Phase 5 with the answer from Task 0.5.
  - Done when: the version is in the log.
- [ ] **6.2 Remove the deprecated exports (agent).** Remove the 11 exports, their tests, and their documentation. Add a `### Removed` changelog entry with the migration guidance. Prepare the major release with the steps of Task 2.5.
  - Done when: the major version is on npm without `CmcdReporter`.

## Task 2.3 in detail

**Files:**
- Modify: `libs/cmcd/src/CmcdReporter.ts`, in `recordResponseReceived()`, its TSDoc, and the TSDoc of `resolveSession()`
- Modify: `libs/cmcd/test/CmcdReporter.test.ts`, the three tests named in Step 2
- Modify: `libs/cmcd/docs/user-guide.md`, the section "Session Changes and Late Responses"
- Modify: `libs/cmcd/CHANGELOG.md`

**Behavior:** A request without a provenance record reports under the current session. The request-time data then comes from `customData.cmcd`, as in version 2.4.0. A record that names no retained session still drops the response.

- [ ] **Step 1: Create the branch**

```bash
git fetch origin refactor/cmcd-encode
git switch -c fix/cmcd-rr-without-provenance origin/refactor/cmcd-encode
```

- [ ] **Step 2: Change the three tests that expect a dropped response**

Replace the test `drops a response whose per-call sid names no retained session` with:

```ts
		it('reports a response without a provenance record under the current session, ignoring a per-call sid', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.RESPONSE_RECEIVED],
					enabledKeys: [...RR_KEYS],
					batchSize: 1,
				}],
			}), requester)

			reporter.recordResponseReceived({
				status: 200,
				request: { url: 'https://cdn.example.com/segment.mp4' },
			}, { sid: 'INJECTED' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('sid="test-session"'))
			ok(!(requests[0].body as string).includes('INJECTED'))
		})
```

Replace the test `drops a response whose request carries no provenance` with:

```ts
		it('reports a response without a provenance record under the current session', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['cid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			reporter.recordResponseReceived({
				status: 200,
				request: { url: 'https://cdn.example.com/seg1.mp4', customData: { cmcd: { bl: [5000] } } },
			})

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('e=rr'))
			ok((requests[0].body as string).includes('sid="s1"'))
			ok((requests[0].body as string).includes('bl=(5000)'))
		})
```

Replace the test `drops an unbridged serialized response` with:

```ts
		it('reports an unbridged serialized response under the current session', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			const stale = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })
			const lossy = JSON.parse(JSON.stringify(stale))
			reporter.recordResponseReceived({ status: 200, request: lossy })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('sid="s1"'))
		})
```

- [ ] **Step 3: Run the tests and confirm that the three tests fail**

```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Expected: the three tests fail with `equal(requests.length, 1)`, because the reporter drops the responses.

- [ ] **Step 4: Change `recordResponseReceived()`**

Replace these lines and the comment above them:

```ts
		const provenance = request.customData?.[CMCD_REQUEST_PROVENANCE]
		const session = this.resolveSession(provenance)
```

with:

```ts
		const provenance = request.customData?.[CMCD_REQUEST_PROVENANCE]
		const session = provenance === undefined ? this.session : this.resolveSession(provenance)
```

Replace `const cmcd = decodeSnapshot(provenance)` with:

```ts
		const cmcd = provenance === undefined ? { ...request.customData?.cmcd } : decodeSnapshot(provenance)
```

Replace `const { cid } = provenance as { cid?: unknown; }` with:

```ts
		const { cid } = (provenance ?? {}) as { cid?: unknown; }
```

Remove the comments that say a response without a record drops. Add no new comment.

- [ ] **Step 5: Run the tests and confirm that they pass**

```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Expected: every test passes. The tests for records that name an unknown or removed session still expect a dropped response.

- [ ] **Step 6: Update the documentation and the changelog**

In the TSDoc of `recordResponseReceived()`, replace this text:

```text
Without a match, the reporter discards the response rather than
attributing it elsewhere. There is no other key. The reporter discards the
response when a serialization boundary lost the record and nothing
restored it (see {@link CMCD_REQUEST_PROVENANCE}).
```

with this text:

```text
A request without a record reports under the current session, as in
version 2.4.0. The request-time data then comes from `customData.cmcd`.
A record that names no retained session drops the response.
```

In the TSDoc of `resolveSession()`, replace this text:

```text
A lost record, or one that names a removed or unknown `sid`, resolves nothing.
```

with this text:

```text
A record that names a removed or unknown `sid` resolves nothing.
```

In the section "Session Changes and Late Responses" of `libs/cmcd/docs/user-guide.md`, replace this text:

```text
The record is the only attribution key. A response whose request has no record is dropped, and a per-call `data.sid` is no substitute.
```

with this text:

```text
The record is the only key that selects an ended session. A response whose request has no record reports under the current session, as in version 2.4.0. The request-time data then comes from `customData.cmcd`. A per-call `data.sid` is no substitute.
```

Under `## [Unreleased]`, `### Fixed`, in `libs/cmcd/CHANGELOG.md`, add:

```markdown
- `CmcdReporter.recordResponseReceived()` again reports a response whose request has no provenance record, under the current session, as in version 2.4.0. Since version 2.6.0, the reporter dropped these responses. hls.js and dash.js therefore lost every `rr` event after an upgrade.
```

- [ ] **Step 7: Run the root test**

```bash
npm test
```

Expected: lint, build, typecheck, and every package test pass.

- [ ] **Step 8: Commit and push**

```bash
git add libs/cmcd/src/CmcdReporter.ts libs/cmcd/test/CmcdReporter.test.ts libs/cmcd/docs/user-guide.md libs/cmcd/CHANGELOG.md
git commit -s -m "fix(cmcd): report responses without a provenance record under the current session" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin fix/cmcd-rr-without-provenance
```

Casey opens the PR with `/create-pr refactor/cmcd-encode`.

## Log

| Date | Entry |
|---|---|
| 2026-10-01 | Roadmap written. RFC drafted on `rfc/cmcd-session` (df085bba8, 22e9b3a44), not pushed. |
| 2026-10-01 | Dry run of Task 2.3 on `refactor/cmcd-encode` (501281b70): the three changed tests fail before the patch, all 228 reporter tests pass after it, and a strict typecheck is clean. |

## Links

| Reference | URL |
|---|---|
| PR 398 | https://github.com/streaming-video-technology-alliance/common-media-library/pull/398 |
| PR 422 | https://github.com/streaming-video-technology-alliance/common-media-library/pull/422 |
| PR 452 | https://github.com/streaming-video-technology-alliance/common-media-library/pull/452 |
| PR 455 | https://github.com/streaming-video-technology-alliance/common-media-library/pull/455 |
| PR 460 | https://github.com/streaming-video-technology-alliance/common-media-library/pull/460 |
