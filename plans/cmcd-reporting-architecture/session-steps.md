# CMCD Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `createCmcdSession()` to `@svta/cml-cmcd`, as [the session RFC](../../rfc/cmcd-session.md) defines it.

**Architecture:** One factory function returns a session object. The session keeps one destination for request mode and one destination for each event target URL. Each call builds and encodes all of its reports first, and then it commits the sequence numbers and the waiting values. Each event target has a queue, at most one POST in flight, and a back-off timer. The encoder and `replaceCmcdParam()` of version 2.8.1 write every report. The configuration types are the types of `CmcdReporter`: `CmcdRequestReportConfig` and `CmcdEventReportConfig`.

**Tech Stack:** TypeScript, `node:test` with mock timers, tsdown, API Extractor, TypeDoc, and rolldown for the bundle measurement.

This plan is Task 3.1 of [the roadmap](steps.md). It is a draft, last checked on 2026-10-02, while the RFC is in review in PR 486. If the review changes the RFC, update the affected tasks before Task 3.2 starts.

## Global Constraints

- Work on the branch `feat/cmcd-session`, created from `main` after Task 0.6. Never commit to `main`.
- Every commit uses `git commit -s` and has the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Run every command from the root of the worktree.
- The tests of exported members import `@svta/cml-cmcd`, which resolves to the built package. Run `npm run build -w libs/cmcd` before each test run. The tests of internal members import `../src/`.
- Each test file of an exported member has a `// #region example` block.
- The build regenerates `libs/cmcd/config/cml-cmcd.api.md`. Commit the regenerated report in the task that changes it.
- Library code never calls `console`, has no side effects at module scope, and uses no `enum`.
- All prose follows the writing style of AGENTS.md. This rule covers TSDoc, the guides, the changelog, and commit messages.
- No `.ts` files under `plans/`. The scripts of Tasks 10 and 11 go to the session scratchpad. In the commands, `<scratchpad>` stands for the path of that directory.
- The agent pushes the branch. Casey opens the PR with `/create-pr main`.

## How This Plan Was Checked

The code of each task ran before this plan was written, on a copy of `main` at 0e45a1db5 (release 2.8.1):

- The tests of each task fail before its code and pass after it.
- After each task, every `libs/cmcd` test passes. `tsc` and ESLint report nothing with the root configuration.
- The root `npm test` passes on the final code. API Extractor reports the same 10 warnings as `main`. The docs build reports the same 18 warnings as `main`.
- Each code block of the new documents runs and passes a strict typecheck.

| Measurement, final code | Session | `CmcdReporter` |
|---|---:|---:|
| Minified with gzip, with its dependencies | 6910 B | 8696 B |
| One version 2 request report, Node 24 | 7.98 µs | 14.52 µs |

Both APIs in one bundle measure 10541 B. For the same data, the session writes the same request URL as `CmcdReporter`. A bare import of the package bundles to nothing.

The configuration types follow the decision of Casey of 2026-10-02. The session uses `CmcdRequestReportConfig` and `CmcdEventReportConfig`, and version 3.0.0 removes their members for `CmcdReporter`. Until then, `enabledKeys` accepts a read-only array, and `CmcdEventReportConfig` gains `filter`.

## Decisions in This Plan

The RFC does not settle these points. The plan applies the choice in the second column. Casey can change any of them before Task 3.2.

| Point | Choice | Task |
|---|---|---|
| Two targets with one URL select the same call | The reports take sequence numbers in the order of the targets. Only the first report takes the waiting values and `msd`. | 3, 4 |
| A request with CMCD headers, in header mode | The session removes the four CMCD headers of the request, and then it adds the new ones. In query mode, the first `CMCD` parameter takes the new value in place, and the session removes the other `CMCD` parameters, as `CmcdReporter` does. | 2 |
| A waiting `bsd` or `ec` list with parameters on the list | The copy keeps the items and their parameters. It does not keep the parameters of the list itself, because two lists cannot merge them. | 4 |
| A requester that resolves with status 0 | The session drops the batch, as the RFC table says for any other status. See the open question. | 6 |
| A call to `flush()` during a POST that fails | The target sends again at once after the response. The RFC says that `flush()` sends after the response of a POST in flight. | 6 |
| Documents | The session guide and the migration guide are new files in `libs/cmcd/docs/`. The user guide describes `CmcdReporter`, which Phase 4 deprecates. | 10 |
| Spec examples | A conformance task reproduces 15 examples of CTA-5004-B section 8, with the data file of PR 460. | 9 |

**Open question for Casey: status 0.** After a network error, a requester on `XMLHttpRequest` resolves with status 0, but `fetch` rejects. The RFC retries a rejection and drops status 0, so one failure gets two outcomes. PR 460 retried status 0. Recommendation: treat status 0 as a rejected request. The change is one condition in Task 6 and one row in the delivery table of the RFC.

## Salvage List from PR 460

This section completes Task 1.2 of the roadmap. The sources are on the branch `feat/cmcd-session-api`.

| Part | Source | Use |
|---|---|---|
| The `h` event | `libs/cmcd/src/CmcdEventType.ts`: `CMCD_EVENT_HOSTNAME` and `HOSTNAME` | Task 3 |
| The response timing | `libs/cmcd/src/toResponseKeys.ts` | Task 5, with the `ttfb` and `ttlb` rules of the RFC |
| The `sid` and `cid` checks | `libs/cmcd/src/checkRequestSettings.ts`: `checkSid()` and `checkCid()` | Task 8, in `checkSessionConfig.ts` |
| The CTA-5004-B examples | `libs/cmcd/test/data/CTA_5004_B_EXAMPLES.ts` | Task 9, without the PR 460 variant of example 8.2.5 |
| The test scenarios | The four test files in the next table | Tasks 2 to 9 |

The scenarios of the four test files of PR 460:

| PR 460 test | Action | Task |
|---|---|---|
| **`CmcdSession.delivery.test.ts`** | | |
| reproduces 8.2.1: a minimal t report after one interval | Port | 7, 9 |
| emits one t line per live reporter, in creation order, with the same ts and consecutive sn | Drop. The session has no reporters. | |
| emits a session-only line when the session has no reporter | Drop. The session has no reporters. | |
| honors interval, batchSize, headers, and flush() | Port | 3, 7 |
| drains on dispose() and stops the timers | Port as `flush()` and `stop()` | 7 |
| disables t with interval 0 | Port | 7 |
| silences a target for the rest of the sid after a 410 | Port. A 410 stops every target with the URL. | 6 |
| backs off after a 429 and aggregates the lines queued during the wait | Port | 6 |
| retries a 5xx and a rejection, and drops the batch on another 4xx | Port | 6 |
| forgets the drain request when another 4xx drops the batch | Drop. A `flush()` during a POST sends after every response. | |
| keeps the newest maxQueueSize lines when a failed batch is unshifted back | Drop. The session has no queue limit. Task 6 tests that the queue keeps every line. | 6 |
| keeps the newest maxQueueSize lines when a push exceeds the cap during a send | Drop. The session has no queue limit. | |
| honors a drain requested while a send is in flight | Port | 3, 6 |
| flush() fires an armed retry at once | Port | 6 |
| stops retrying an ended sid state after the 60 second step and reports it | Drop. The session has no ended states and no `onError`. | |
| gives the requester error as the cause of the give-up error | Drop. The session never gives up. | |
| retries a status 0 response | Drop. The RFC drops status 0. See the open question. | |
| accepts a thenable and a plain object from the requester | Port the requester that throws. The type of the requester requires a promise. | 6 |
| posts through fetch with keepalive by default | Port. The default requester has no `keepalive`. | 3 |
| **`CmcdSession.errors.test.ts`** | | |
| gives a tick error to onError with the stage and the target in the message | Port. The error goes to the timer callback. | 7 |
| leaves no unhandled rejection when onError throws at the back-off cap | Drop. The session has no `onError`. The back-off tests run without an unhandled rejection. | 6 |
| throws an encoder failure to the caller and commits nothing | Port | 2, 3, 4 |
| makes every call a no-op after dispose, except createReporter which throws | Drop. The session has no `dispose()`. | |
| removes a disposed reporter from interval reports and target state | Drop. The session has no reporters. | |
| **`CmcdSessionReporter.request.test.ts`** | | |
| reproduces 8.1.1 in query mode | Port | 9 |
| reproduces 8.1.1 in header mode | Port | 9 |
| reproduces 8.1.2 and 8.1.3 | Port | 9 |
| reproduces 8.1.5 with buffered error codes | Port | 9 |
| reproduces 8.1.6 with supplied bs | Port | 9 |
| reproduces 8.1.7 with two reporters in one session | Port, with `cid` in the data of each call | 9 |
| reproduces 8.1.8 with every request-mode key | Port | 9 |
| numbers request-mode reports from zero and replaces an existing CMCD parameter | Port | 1, 2 |
| replaces every stale CMCD header when it decorates a request again | Port | 2 |
| encodes version 1 request mode | Port | 2 |
| encodes version 1 nor with astral-plane characters | Drop. The `nor` tests of the encoder cover the case. | |
| **`CmcdSessionReporter.responses.test.ts`** | | |
| reproduces 8.2.3 from the decorated request, the headers, and the timing | Port. The session does not read response headers. | 9 |
| derives url, rc, ts, and ttlb without timing, and reads a Headers object | Port the case without timing. The session does not read response headers. | 5 |
| omits unavailable timing values | Port | 5 |
| reports a URL-only response under the calling reporter, without the CMCD parameter | Port | 5 |
| attributes a spread copy, uses the cid at decoration, and falls back after a JSON round trip | Drop. The request-time data comes from `customData.cmcd`. | |
| accepts the response overrides and reports after the reporter is disposed | Port the overrides | 5 |
| does not change a late report when the player mutates its per-request data object | Drop. The session encodes each report during the call. | |
| lets per-request data win over the cid at decoration | Port | 5 |
| ignores a per-request member set to undefined and keeps the cid at decoration | Port. A `cid` of `undefined` uses the configured `cid`. | 3 |
| reports a late response through the ended sid state, even after an earlier drain already cleared | Drop. The player keeps the old session. | |

The other inputs of Task 3.1 map to these tasks:

| Input | Task |
|---|---|
| Prototype scenario: a `b` event with `bg: false` is the exit, without `bg` | 3 |
| Prototype scenarios: `msd` once for each destination, values that cannot be encoded, waiting `bs` and `ec`, `bsd` lists, the request-time data of a response | 4, 5 |
| Prototype scenarios: a 410 for each URL, the back-off, `flush()` during a wait | 6 |
| Prototype scenarios: `start()` and `start(false)`, `configure()` keeps the sequence number | 2, 7 |
| Prototype scenario: the configuration checks | 8 |
| `CmcdReporter` spec rules: the `msd` checks | 4 |
| `CmcdReporter` spec rules: the `bg` exit, batching | 3 |
| `CmcdReporter` spec rules: 410 for each URL | 6 |
| `CmcdReporter` spec rules: response timing | 5 |

## RFC Coverage

| RFC section | Task |
|---|---|
| New exports and types | 2, 3, 4, 5, 7 |
| Reports | 2, 3 |
| Requests | 1, 2 |
| Events | 3, 5 |
| Keys with a destination scope | 4 |
| Settings and timers | 2, 7 |
| Delivery | 3, 6 |
| Errors | 2, 3, 4, 7, 8 |
| Migration table | 10 |
| Bundle and performance | 11 |

## File Structure

| File | Content | Task |
|---|---|---|
| `libs/cmcd/src/replaceCmcdParam.ts` | Internal, on `main` with its test. Replaces the `CMCD` query parameter. | 1 |
| `libs/cmcd/src/CmcdReportConfig.ts` | Existing type. `enabledKeys` accepts a read-only array, and its TSDoc names the default of each API. | 2 |
| `libs/cmcd/src/CmcdSessionConfig.ts` | Public type of the configuration, based on `CmcdRequestReportConfig` | 2, 3, 4, 7 |
| `libs/cmcd/src/CmcdSession.ts` | Public type of the session | 2 to 7 |
| `libs/cmcd/src/createCmcdSession.ts` | Public function. The destinations, the reports, the queues, and the timers. | 2 to 8 |
| `libs/cmcd/src/CmcdReportFilter.ts` | Public type of the filter of an event target | 3 |
| `libs/cmcd/src/CmcdEventReportConfig.ts` | Existing type of an event target. Gains `filter`. | 3 |
| `libs/cmcd/src/CmcdEventType.ts` | Gains `CMCD_EVENT_HOSTNAME` and `HOSTNAME` | 3 |
| `libs/cmcd/src/readScopedValues.ts` | Internal. Reads and checks the `msd`, `bs`, `bsd`, and `ec` values of a call. | 4 |
| `libs/cmcd/src/toResponseKeys.ts` | Internal. Derives the keys of an `rr` report. | 5 |
| `libs/cmcd/src/checkSessionConfig.ts` | Internal. The configuration checks. | 8 |
| `libs/cmcd/src/index.ts` | Exports the public files | 2, 3 |
| `libs/cmcd/test/createCmcdSession.test.ts` and seven files `createCmcdSession.<area>.test.ts` | One test file for each task from 2 to 9 | 2 to 9 |
| `libs/cmcd/test/toResponseKeys.test.ts` | Test of an internal helper | 5 |
| `libs/cmcd/test/data/CTA_5004_B_EXAMPLES.ts` | The examples of CTA-5004-B section 8 | 9 |
| `libs/cmcd/docs/session-guide.md`, `libs/cmcd/docs/migration-guide.md` | The guides | 10 |
| `libs/cmcd/README.md`, `libs/cmcd/CHANGELOG.md` | The quick start and the changelog entry | 10 |

The files `createCmcdSession.ts`, `CmcdSession.ts`, and `CmcdSessionConfig.ts` grow from task to task. Each task that changes them gives their complete content, so the step replaces the whole file.

## Setup

- [ ] **Step 1: Create the branch and build every package**

```bash
git fetch origin
git switch -c feat/cmcd-session origin/main
git submodule update --init
npm ci
npm run build
```

Expected: the build of every package passes.

---

### Task 1: Replace the CMCD Query Parameter

The fix PR of the branch `fix/cmcd-query-strict-encoding` adds this helper and its test to `main`. `CmcdReporter` and `appendCmcdQuery` use the helper too, so the session writes the same request URL as `CmcdReporter`. This task only confirms the helper.

**Files:**
- On `main`: `libs/cmcd/src/replaceCmcdParam.ts`, `libs/cmcd/src/percentEncode.ts`, and `libs/cmcd/test/replaceCmcdParam.test.ts`

**Interfaces:**
- Produces: `replaceCmcdParam(url: string, value?: string): string`. The first `CMCD` parameter takes the new value in place. The function removes the other `CMCD` parameters. If the URL has no `CMCD` parameter, the new parameter goes at the end of the query, before the fragment. An empty `value` only removes the parameters. The function does not change the rest of the URL. The URL can be relative.
- The function encodes `value` as the query examples of CTA-5004-B do. Only letters, digits, `-`, `.`, `_`, and `~` stay unencoded. A space becomes `%20`.

- [ ] **Step 1: Confirm the helper on `main`**

```bash
git log --oneline -1 -- libs/cmcd/src/replaceCmcdParam.ts
node --no-warnings --test libs/cmcd/test/replaceCmcdParam.test.ts
```

Expected: the log shows the commit of the fix PR, and the tests pass. If the file is not on `main`, stop and report: the fix PR must merge before Task 2.

### Task 2: Request Reports

**Files:**
- Create: `libs/cmcd/src/CmcdSessionConfig.ts`, `libs/cmcd/src/CmcdSession.ts`, `libs/cmcd/src/createCmcdSession.ts`
- Modify: `libs/cmcd/src/CmcdReportConfig.ts`, `libs/cmcd/src/index.ts`, and the regenerated `libs/cmcd/config/cml-cmcd.api.md`
- Test: `libs/cmcd/test/createCmcdSession.test.ts`

**Interfaces:**
- Consumes: `replaceCmcdParam()` from Task 1, and the existing type `CmcdRequestReportConfig`.
- Produces: `createCmcdSession(config?: CmcdSessionConfig): CmcdSession`, with `sid`, `createRequestReport()`, and `configure(settings: CmcdRequestReportConfig)`. `CmcdSessionConfig` is `CmcdRequestReportConfig & { sid?, cid? }`. `CmcdReportConfig.enabledKeys` becomes `readonly CmcdKey[]`. Task 3 adds the `requester` argument and the event methods.

- [ ] **Step 1: Write the failing test**

Create `libs/cmcd/test/createCmcdSession.test.ts`:

```ts
import { CmcdHeaderField, CmcdObjectType, CmcdTransmissionMode, createCmcdSession } from '@svta/cml-cmcd'
import { deepEqual, equal, notEqual, ok, throws } from 'node:assert'
import { describe, it } from 'node:test'

const SEGMENT = 'https://cdn.test/v/1.m4s'

describe('createCmcdSession', () => {
	it('provides a valid example', () => {
		// #region example
		const session = createCmcdSession({ sid: 'session-1', cid: 'movie-42' })

		const report = session.createRequestReport(
			{ url: 'https://cdn.example.com/movie/seg-1.m4s' },
			{ ot: CmcdObjectType.VIDEO, d: 4000, br: [3000] },
		)

		equal(decodeURIComponent(report.url), 'https://cdn.example.com/movie/seg-1.m4s?CMCD=br=(3000),cid="movie-42",d=4000,ot=v,sid="session-1",sn=0,v=2')
		// #endregion example
	})

	describe('createRequestReport', () => {
		it('numbers the reports from 0 and adds sid, the configured cid, and v', () => {
			const session = createCmcdSession({ sid: 's1', cid: 'c1' })

			const first = session.createRequestReport({ url: SEGMENT })
			const second = session.createRequestReport({ url: SEGMENT }, { cid: 'ad-7' })

			equal(decodeURIComponent(first.url), `${SEGMENT}?CMCD=cid="c1",sid="s1",sn=0,v=2`)
			equal(decodeURIComponent(second.url), `${SEGMENT}?CMCD=cid="ad-7",sid="s1",sn=1,v=2`)
		})

		it('ignores sid and sn in the data', () => {
			const session = createCmcdSession({ sid: 's1' })

			const report = session.createRequestReport({ url: SEGMENT }, { sid: 'other', sn: 99 })

			equal(decodeURIComponent(report.url), `${SEGMENT}?CMCD=sid="s1",sn=0,v=2`)
		})

		it('generates a sid when the configuration has none', () => {
			const session = createCmcdSession()

			ok(/^[0-9a-f-]{36}$/.test(session.sid))
			ok(decodeURIComponent(session.createRequestReport({ url: SEGMENT }).url).includes(`sid="${session.sid}"`))
		})

		it('replaces the first CMCD parameter in place and keeps the fragment', () => {
			const session = createCmcdSession({ sid: 's1' })

			const report = session.createRequestReport({ url: `${SEGMENT}?CMCD=sn%3D9&a=1&CMCD=x#t=5` })

			equal(decodeURIComponent(report.url), `${SEGMENT}?CMCD=sid="s1",sn=0,v=2&a=1#t=5`)
		})

		it('writes nor as a path relative to the request URL', () => {
			const session = createCmcdSession({ sid: 's1' })

			const report = session.createRequestReport({ url: SEGMENT }, { nor: ['https://cdn.test/v/2.m4s'] })

			equal(decodeURIComponent(report.url), `${SEGMENT}?CMCD=nor=("2.m4s"),sid="s1",sn=0,v=2`)
		})

		it('returns a copy of the request, with the report data in customData.cmcd', () => {
			const session = createCmcdSession({ sid: 's1' })
			const request = { url: SEGMENT, headers: { Range: 'bytes=0-99' }, customData: { requestType: 'segment' } }

			const report = session.createRequestReport(request, { ot: CmcdObjectType.VIDEO })

			equal(request.url, SEGMENT)
			deepEqual(request.customData, { requestType: 'segment' })
			notEqual(report.headers, request.headers)
			deepEqual(report.headers, { Range: 'bytes=0-99' })
			equal(report.customData.requestType, 'segment')
			equal(report.customData.cmcd.sid, 's1')
			equal(report.customData.cmcd.sn, 0)
		})

		it('sends CMCD headers in header mode and replaces the existing ones', () => {
			const session = createCmcdSession({ sid: 's1', transmissionMode: CmcdTransmissionMode.HEADERS })
			const request = { url: SEGMENT, headers: { 'cmcd-status': 'bs', [CmcdHeaderField.REQUEST]: 'bl=(100)', Accept: '*/*' } }

			const report = session.createRequestReport(request, { ot: CmcdObjectType.VIDEO, bl: [5000] })

			equal(report.url, SEGMENT)
			deepEqual(report.headers, {
				'Accept': '*/*',
				'CMCD-Object': 'ot=v',
				'CMCD-Request': 'bl=(5000),sn=0',
				'CMCD-Session': 'sid="s1",v=2',
			})
		})

		it('places custom keys with customHeaderMap', () => {
			const session = createCmcdSession({
				sid: 's1',
				transmissionMode: CmcdTransmissionMode.HEADERS,
				customHeaderMap: { [CmcdHeaderField.OBJECT]: ['com.example-a'] },
			})

			const report = session.createRequestReport({ url: SEGMENT }, { 'com.example-a': 'x' })

			equal(report.headers[CmcdHeaderField.OBJECT], 'com.example-a="x"')
		})

		it('encodes version 1 without sn and without the version 2 keys', () => {
			const session = createCmcdSession({ sid: 's1', version: 1 })

			const report = session.createRequestReport({ url: SEGMENT }, { ot: CmcdObjectType.VIDEO, bl: [5000], msd: 300, sta: 'p' })

			equal(decodeURIComponent(report.url), `${SEGMENT}?CMCD=bl=5000,ot=v,sid="s1"`)
		})

		it('keeps only the enabled keys, and v', () => {
			const session = createCmcdSession({ sid: 's1', enabledKeys: ['sid', 'br'] as const })

			const report = session.createRequestReport({ url: SEGMENT }, { br: [3000], d: 4000 })

			equal(decodeURIComponent(report.url), `${SEGMENT}?CMCD=br=(3000),sid="s1",v=2`)
		})

		it('throws for a value that cannot be encoded, and keeps the sequence number', () => {
			const session = createCmcdSession({ sid: 's1' })

			throws(() => session.createRequestReport({ url: SEGMENT }, { 'com.example-key': 'a\nb' }))

			equal(decodeURIComponent(session.createRequestReport({ url: SEGMENT }).url), `${SEGMENT}?CMCD=sid="s1",sn=0,v=2`)
		})
	})

	describe('configure', () => {
		it('replaces the request settings and keeps the sequence number', () => {
			const session = createCmcdSession({ sid: 's1' })

			const first = session.createRequestReport({ url: SEGMENT })
			session.configure({ version: 1, enabledKeys: ['sid'] })
			const second = session.createRequestReport({ url: SEGMENT })
			session.configure({ version: 2, enabledKeys: undefined, transmissionMode: CmcdTransmissionMode.HEADERS })
			const third = session.createRequestReport({ url: SEGMENT })

			equal(decodeURIComponent(first.url), `${SEGMENT}?CMCD=sid="s1",sn=0,v=2`)
			equal(decodeURIComponent(second.url), `${SEGMENT}?CMCD=sid="s1"`)
			equal(third.url, SEGMENT)
			equal(third.headers[CmcdHeaderField.REQUEST], 'sn=2')
		})
	})
})
```

- [ ] **Step 2: Build, run the test, and confirm that it fails**

```bash
npm run build -w libs/cmcd
node --no-warnings --test libs/cmcd/test/createCmcdSession.test.ts
```

Expected: FAIL with `SyntaxError: The requested module '@svta/cml-cmcd' does not provide an export named 'createCmcdSession'`.

- [ ] **Step 3: Write the types**

Replace the content of `libs/cmcd/src/CmcdReportConfig.ts` with:

```ts
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdVersion } from './CmcdVersion.ts'

/**
 * Configuration for a CMCD report.
 *
 * @public
 */
export type CmcdReportConfig = {
	/**
	 * The version of the CMCD specification to use.
	 *
	 * @defaultValue `CMCD_V2`
	 */
	version?: CmcdVersion;

	/**
	 * The list of CMCD keys to include in the report. Without the list,
	 * `CmcdReporter` reports no keys, and `createCmcdSession()` reports every
	 * key. In event mode, this list cannot remove `e`, `ts`, or the
	 * required key of the event type. Examples of required keys: `sta` for a
	 * play state change, `ec` for an error, `url` for a response received.
	 *
	 * @defaultValue `undefined`
	 */
	enabledKeys?: readonly CmcdKey[];
}
```

Create `libs/cmcd/src/CmcdSessionConfig.ts`:

```ts
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'

/**
 * The configuration of a CMCD session.
 *
 * The members of {@link CmcdRequestReportConfig} are the request mode settings. `configure()` replaces them.
 *
 * @public
 */
export type CmcdSessionConfig = CmcdRequestReportConfig & {
	/**
	 * The session ID, a string of 1 to 64 characters.
	 *
	 * @defaultValue A new UUID
	 */
	sid?: string;

	/**
	 * The content ID of each report whose data has no `cid`. It has at most 128 characters.
	 */
	cid?: string;
}
```

Create `libs/cmcd/src/CmcdSession.ts`:

```ts
import type { HttpRequest } from '@svta/cml-utils'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'

/**
 * A CMCD session. One session reports one `sid`.
 *
 * The session keeps only the state that CTA-5004-B scopes to a session or to a destination.
 * The player passes its CMCD data with each call.
 *
 * @public
 */
export type CmcdSession = {
	/**
	 * The session ID of every report.
	 */
	readonly sid: string;

	/**
	 * Returns a copy of the request with a CMCD request report.
	 *
	 * In query mode, the session removes every `CMCD` parameter of the URL and adds one.
	 * In header mode, the session replaces the CMCD headers.
	 * `customData.cmcd` holds the report data before encoding.
	 * Each call advances the sequence number of request mode.
	 *
	 * @param request - The request to report.
	 * @param data - The CMCD data of the request.
	 * @returns A copy of the request with the report.
	 *
	 * @throws If a value cannot be encoded. The call then changes no state.
	 */
	createRequestReport<R extends HttpRequest>(request: R, data?: Cmcd): R & CmcdRequestReport<R['customData']>;

	/**
	 * Replaces the request mode settings: `version`, `transmissionMode`, `enabledKeys`, and `customHeaderMap`.
	 * The `sid` and every sequence number stay.
	 *
	 * @param settings - The new settings.
	 */
	configure(settings: CmcdRequestReportConfig): void;
}
```

- [ ] **Step 4: Write the implementation**

Create `libs/cmcd/src/createCmcdSession.ts`:

```ts
import type { HttpRequest } from '@svta/cml-utils'
import { uuid } from '@svta/cml-utils'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdKey } from './CmcdKey.ts'
import { CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'
import type { CmcdSession } from './CmcdSession.ts'
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { CMCD_HEADERS } from './CmcdTransmissionMode.ts'
import { encodePreparedCmcd } from './encodePreparedCmcd.ts'
import { prepareCmcdData } from './prepareCmcdData.ts'
import { replaceCmcdParam } from './replaceCmcdParam.ts'
import { toPreparedCmcdHeaders } from './toPreparedCmcdHeaders.ts'

type KeyFilter = CmcdEncodeOptions['filter']

const CMCD_HEADER = /^cmcd-(object|request|session|status)$/i

function toKeyFilter(keys: readonly CmcdKey[] | undefined): KeyFilter {
	if (!keys) {
		return undefined
	}

	const set = new Set<string>(keys)

	return (key) => set.has(key)
}

/**
 * Creates a CMCD session. One session reports one `sid`.
 *
 * Request mode has its own sequence number.
 * The player passes its CMCD data with each call.
 *
 * @param config - The configuration of the session.
 * @returns The session.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/createCmcdSession.test.ts#example}
 */
export function createCmcdSession(config: CmcdSessionConfig = {}): CmcdSession {
	const sid = config.sid ?? uuid()
	const settings: CmcdRequestReportConfig = {
		version: config.version,
		transmissionMode: config.transmissionMode,
		enabledKeys: config.enabledKeys,
		customHeaderMap: config.customHeaderMap,
	}
	let requestKeys = toKeyFilter(settings.enabledKeys)
	let sn = 0

	return {
		sid,

		createRequestReport<R extends HttpRequest>(request: R, data: Cmcd = {}): R & CmcdRequestReport<R['customData']> {
			const cmcd = prepareCmcdData({ ...data, cid: data.cid ?? config.cid, sid, sn }, {
				version: settings.version ?? CMCD_V2,
				reportingMode: CMCD_REQUEST_MODE,
				filter: requestKeys,
				baseUrl: request.url,
			})
			const source = request.headers ?? {}
			const replace = settings.transmissionMode === CMCD_HEADERS
			const headers: Record<string, string> = {}
			let url = request.url

			for (const name in source) {
				if (!replace || !CMCD_HEADER.test(name)) {
					headers[name] = source[name]
				}
			}

			if (replace) {
				Object.assign(headers, toPreparedCmcdHeaders(cmcd, settings.customHeaderMap))
			}
			else {
				url = replaceCmcdParam(url, encodePreparedCmcd(cmcd))
			}

			sn++

			return { ...request, url, headers, customData: { ...request.customData, cmcd } } as R & CmcdRequestReport<R['customData']>
		},

		configure(next) {
			Object.assign(settings, next)
			requestKeys = toKeyFilter(settings.enabledKeys)
		},
	}
}
```

In `libs/cmcd/src/index.ts`, after the line `export type * from './CmcdResponse.ts'`, add:

```ts
export type * from './CmcdSession.ts'
export type * from './CmcdSessionConfig.ts'
```

In the same file, before the line `export * from './createFetchTransport.ts'`, add:

```ts
export * from './createCmcdSession.ts'
```

- [ ] **Step 5: Build, run the checks, and confirm that they pass**

```bash
npm run build -w libs/cmcd
node --no-warnings --test libs/cmcd/test/createCmcdSession.test.ts
npm test -w libs/cmcd
npm run typecheck
npx eslint libs/cmcd
```

Expected: the 13 tests of the file pass, and every package test passes. The typecheck and ESLint report nothing. The API report gains `CmcdSession`, `CmcdSessionConfig`, and `createCmcdSession`, and `enabledKeys` of `CmcdReportConfig` becomes `readonly CmcdKey[]`.

- [ ] **Step 6: Commit**

```bash
git add libs/cmcd/src/CmcdReportConfig.ts libs/cmcd/src/CmcdSessionConfig.ts libs/cmcd/src/CmcdSession.ts libs/cmcd/src/createCmcdSession.ts libs/cmcd/src/index.ts libs/cmcd/config/cml-cmcd.api.md libs/cmcd/test/createCmcdSession.test.ts
git commit -s -m "feat(cmcd): add createCmcdSession with request reports" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: Event Reports

**Files:**
- Create: `libs/cmcd/src/CmcdReportFilter.ts`
- Modify: `libs/cmcd/src/CmcdEventType.ts`, `libs/cmcd/src/CmcdEventReportConfig.ts`, `libs/cmcd/src/CmcdSessionConfig.ts`, `libs/cmcd/src/CmcdSession.ts`, `libs/cmcd/src/createCmcdSession.ts`, `libs/cmcd/src/index.ts`, and the regenerated `libs/cmcd/config/cml-cmcd.api.md`
- Test: `libs/cmcd/test/createCmcdSession.events.test.ts`

**Interfaces:**
- Consumes: `createCmcdSession()` from Task 2, and the existing type `CmcdEventReportConfig`.
- Produces: `createCmcdSession(config?, requester?: (request: HttpRequest) => Promise<{ status: number; }>)`, `recordEvent()`, `flush()`, `CmcdReportFilter`, `CmcdEventReportConfig.filter`, `CmcdSessionConfig.eventTargets` (`readonly CmcdEventReportConfig[]`), and `CMCD_EVENT_HOSTNAME`. Inside `createCmcdSession.ts`: `draftOf()`, `build()`, `commit()`, `send()`, and `emit()`, which Tasks 4 to 8 extend.

- [ ] **Step 1: Write the failing test**

Create `libs/cmcd/test/createCmcdSession.events.test.ts`:

```ts
import type { CmcdReportFilter, CmcdSessionConfig } from '@svta/cml-cmcd'
import { CMCD_EVENT_HOSTNAME, CmcdEventType, CmcdPlayerState, createCmcdSession } from '@svta/cml-cmcd'
import { SfItem } from '@svta/cml-structured-field-values'
import type { HttpRequest } from '@svta/cml-utils'
import { deepEqual, equal, ok, throws } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

const SEGMENT = 'https://cdn.test/v/1.m4s'
const A = 'https://a.test/cmcd'
const B = 'https://b.test/cmcd'
const ts = 1000

function settle(): Promise<void> {
	return new Promise((resolve) => setImmediate(resolve))
}

function setup(config: CmcdSessionConfig) {
	const posts: HttpRequest[] = []
	const session = createCmcdSession({ sid: 's1', ...config }, async (request) => {
		posts.push(request)
		return { status: 200 }
	})
	const lines = (url?: string): string[] => posts.filter((post) => !url || post.url === url).flatMap((post) => String(post.body).split('\n'))

	return { session, posts, lines }
}

describe('createCmcdSession events', () => {
	beforeEach(() => mock.timers.enable({ apis: ['Date'], now: ts }))
	afterEach(() => mock.timers.reset())

	it('provides a valid example', () => {
		// #region example
		const bodies: string[] = []
		const session = createCmcdSession({
			sid: 'session-1',
			cid: 'movie-42',
			eventTargets: [{
				url: 'https://collector.example.com/cmcd',
				events: [CmcdEventType.PLAY_STATE],
				filter: (report) => report.sta !== CmcdPlayerState.SEEKING,
			}],
		}, async (request) => {
			bodies.push(String(request.body))
			return { status: 200 }
		})

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.SEEKING })
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.PLAYING, ts: 1767225600000 })

		equal(bodies[0], 'cid="movie-42",e=ps,sid="session-1",sn=0,sta=p,ts=1767225600000,v=2')
		// #endregion example
	})

	describe('recordEvent', () => {
		it('sends a report to each target that lists the event, with a sequence number for each URL', async () => {
			const { session, lines } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }, { url: B, events: [CmcdEventType.PLAY_STATE] }] })

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
			session.recordEvent(CmcdEventType.MUTE)
			await settle()

			for (const url of [A, B]) {
				deepEqual(lines(url), [`e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`, `e=ps,sid="s1",sn=1,sta=a,ts=${ts},v=2`])
			}
		})

		it('gives the targets that share a URL one sequence', async () => {
			const { session, lines } = setup({
				eventTargets: [
					{ url: A, events: [CmcdEventType.PLAY_STATE] },
					{ url: A, events: [CmcdEventType.PLAY_STATE], filter: (report) => report.sta === 'p' },
				],
			})

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
			await settle()
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

			deepEqual(lines(), [
				`e=ps,sid="s1",sn=0,sta=a,ts=${ts},v=2`,
				`e=ps,sid="s1",sn=1,sta=p,ts=${ts},v=2`,
				`e=ps,sid="s1",sn=2,sta=p,ts=${ts},v=2`,
			])
		})

		it('calls the filter with e, ts, and the request, before it uses a sequence number', () => {
			const calls: Parameters<CmcdReportFilter>[] = []
			const { session, lines } = setup({
				eventTargets: [{
					url: A,
					events: [CmcdEventType.PLAY_STATE],
					filter: (report, request) => {
						calls.push([report, request])
						return report.sta !== 'a'
					},
				}],
			})

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' }, { url: SEGMENT })
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

			deepEqual(calls[0], [{ sta: 'a', e: 'ps', ts }, { url: SEGMENT }])
			deepEqual(lines(), [`e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`])
		})

		it('gives the error of a filter to the caller, and no target receives the report', () => {
			let fail = true
			const { session, lines } = setup({
				eventTargets: [
					{ url: A, events: [CmcdEventType.PLAY_STATE] },
					{
						url: B,
						events: [CmcdEventType.PLAY_STATE],
						filter: () => {
							if (fail) {
								throw new Error('filter failed')
							}
							return true
						},
					},
				],
			})

			throws(() => session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' }), /filter failed/)
			fail = false
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })

			deepEqual(lines(), [`e=ps,sid="s1",sn=0,sta=a,ts=${ts},v=2`, `e=ps,sid="s1",sn=0,sta=a,ts=${ts},v=2`])
		})

		it('types the arguments of a filter as deeply read-only', () => {
			const filter: CmcdReportFilter = (report, request) => {
				// @ts-expect-error A filter cannot change a nested value of the report.
				report.bl?.push(1)
				// @ts-expect-error A filter cannot change the request.
				request.url = 'x'
				return true
			}

			ok(filter)
		})

		it('ignores sid, sn, and e in the data, and uses the configured cid when the data has none', async () => {
			const { session, lines } = setup({ cid: 'c1', eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }] })

			session.recordEvent(CmcdEventType.PLAY_STATE, { sid: 'x', sn: 7, e: 'rr', cid: undefined, sta: 'p' })
			session.recordEvent(CmcdEventType.PLAY_STATE, { cid: 'ad-7', sta: 'a' })
			await settle()

			deepEqual(lines(), [
				`cid="c1",e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`,
				`cid="ad-7",e=ps,sid="s1",sn=1,sta=a,ts=${ts},v=2`,
			])
		})

		it('writes the exit from backgrounded mode without bg', async () => {
			const { session, lines } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.BACKGROUNDED_MODE] }] })

			session.recordEvent(CmcdEventType.BACKGROUNDED_MODE, { bg: true })
			session.recordEvent(CmcdEventType.BACKGROUNDED_MODE, { bg: false })
			session.recordEvent(CmcdEventType.BACKGROUNDED_MODE, { bg: new SfItem(false, { x: 1 }) as unknown as boolean })
			await settle()

			deepEqual(lines(), [
				`bg,e=b,sid="s1",sn=0,ts=${ts},v=2`,
				`e=b,sid="s1",sn=1,ts=${ts},v=2`,
				`e=b,sid="s1",sn=2,ts=${ts},v=2`,
			])
		})

		it('keeps only the enabled keys and the keys that the event requires', () => {
			const { session, lines } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE], enabledKeys: ['sid', 'sn'] }] })

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p', bl: [100] })

			deepEqual(lines(), [`e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`])
		})

		it('records the h event with the new host', () => {
			const { session, lines } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.HOSTNAME] }] })

			session.recordEvent(CMCD_EVENT_HOSTNAME, { h: 'cdn2.example.com' })

			equal(CmcdEventType.HOSTNAME, 'h')
			deepEqual(lines(), [`e=h,h="cdn2.example.com",sid="s1",sn=0,ts=${ts},v=2`])
		})

		it('throws for a value that cannot be encoded, and keeps the sequence number', () => {
			const { session, lines } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }] })

			throws(() => session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p', 'com.example-name': 'a\nb' }))
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

			deepEqual(lines(), [`e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`])
		})
	})

	describe('batches', () => {
		it('posts a batch of batchSize lines, and flush() posts the rest after the response', async () => {
			const { session, posts } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE], batchSize: 2 }] })

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
			session.flush()
			equal(posts.length, 1)
			await settle()

			deepEqual(posts, [
				{ url: A, method: 'POST', headers: { 'Content-Type': 'application/cmcd' }, body: `e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2\ne=ps,sid="s1",sn=1,sta=a,ts=${ts},v=2` },
				{ url: A, method: 'POST', headers: { 'Content-Type': 'application/cmcd' }, body: `e=ps,sid="s1",sn=2,sta=p,ts=${ts},v=2` },
			])
		})

		it('keeps one POST in flight for each target, and sends the waiting lines after the response', async () => {
			const posts: HttpRequest[] = []
			const replies: ((status: number) => void)[] = []
			const session = createCmcdSession({ sid: 's1', eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }] }, (request) => new Promise((resolve) => {
				posts.push(request)
				replies.push((status) => resolve({ status }))
			}))

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
			equal(posts.length, 1)
			replies[0](200)
			await settle()

			equal(posts.length, 2)
			equal(posts[1].body, `e=ps,sid="s1",sn=1,sta=a,ts=${ts},v=2\ne=ps,sid="s1",sn=2,sta=p,ts=${ts},v=2`)
		})

		it('posts with fetch and without keepalive by default', (context) => {
			const fetch = context.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 200 }))
			const session = createCmcdSession({ sid: 's1', eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }] })

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

			equal(fetch.mock.callCount(), 1)
			deepEqual(fetch.mock.calls[0].arguments, [A, { method: 'POST', headers: { 'Content-Type': 'application/cmcd' }, body: `e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2` }])
		})
	})
})
```

- [ ] **Step 2: Build, run the test, and confirm that it fails**

```bash
npm run build -w libs/cmcd
node --no-warnings --test libs/cmcd/test/createCmcdSession.events.test.ts
```

Expected: FAIL with `SyntaxError: The requested module '@svta/cml-cmcd' does not provide an export named 'CMCD_EVENT_HOSTNAME'`.

- [ ] **Step 3: Add the `h` event**

In `libs/cmcd/src/CmcdEventType.ts`, after the line `export const CMCD_EVENT_CUSTOM_EVENT = 'ce' as const`, add:

```ts

/**
 * CMCD event type 'h' (hostname).
 *
 * @public
 */
export const CMCD_EVENT_HOSTNAME = 'h' as const
```

In the same file, after the line `CUSTOM_EVENT: CMCD_EVENT_CUSTOM_EVENT as typeof CMCD_EVENT_CUSTOM_EVENT,`, add:

```ts

	/**
	 * A change of the content host. The `h` key holds the new host.
	 */
	HOSTNAME: CMCD_EVENT_HOSTNAME as typeof CMCD_EVENT_HOSTNAME,
```

- [ ] **Step 4: Write the types**

Create `libs/cmcd/src/CmcdReportFilter.ts`:

```ts
import type { DeepReadonly, HttpRequest } from '@svta/cml-utils'
import type { Cmcd } from './Cmcd.ts'

/**
 * Selects the reports that an event target of a CMCD session receives.
 *
 * The session calls the filter before it builds the report.
 * A report that the filter rejects uses no sequence number.
 * The filter must not change its arguments.
 * If the filter throws, no target receives the report, and the error goes to the caller.
 *
 * @param report - The data of the report, with `e` and `ts` set.
 * @param request - The request of an `rr` report, or the request that the player passed to `recordEvent()`.
 * @returns `true` if the target receives the report.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/createCmcdSession.events.test.ts#example}
 */
export type CmcdReportFilter = (report: DeepReadonly<Cmcd>, request?: DeepReadonly<HttpRequest>) => boolean
```

Replace the content of `libs/cmcd/src/CmcdEventReportConfig.ts` with:

```ts
import type { CMCD_V2 } from './CMCD_V2.ts'
import type { CmcdEventReportTransform } from './CmcdEventReportTransform.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import type { CmcdReportConfig } from './CmcdReportConfig.ts'
import type { CmcdReportFilter } from './CmcdReportFilter.ts'

/**
 * Configuration for a CMCD event report.
 *
 * @typeParam C - The type of the player's `customData` on the request that
 *                triggered the event. Defaults to `Record<string, unknown>`.
 *
 * @public
 */
export type CmcdEventReportConfig<C = Record<string, unknown>> = CmcdReportConfig & {
	/**
	 * The version of the CMCD protocol to use. Event reporting
	 * requires version 2.
	 *
	 * @defaultValue `CMCD_V2`
	 */
	version?: typeof CMCD_V2

	/**
	 * The URL of the collector. Each batch of event reports goes to this URL in a POST.
	 */
	url: string;

	/**
	 * The events to report. If the caller provides no events,
	 * the event target is effectively disabled.
	 *
	 * @defaultValue `undefined`
	 */
	events?: CmcdEventType[];

	/**
	 * The interval of the `t` reports, in seconds. The value `0` turns them off.
	 *
	 * @defaultValue `CMCD_DEFAULT_TIME_INTERVAL`
	 *
	 * @see {@link CMCD_DEFAULT_TIME_INTERVAL}
	 */
	interval?: number;

	/**
	 * The number of events to batch before sending the report.
	 *
	 * @defaultValue `1`
	 */
	batchSize?: number;

	/**
	 * Selects the reports that the target receives. Only `createCmcdSession()`
	 * reads this option. Without a filter, the target receives every report of
	 * its events.
	 *
	 * @defaultValue `undefined`
	 */
	filter?: CmcdReportFilter;

	/**
	 * Transform applied to each of this target's event reports before
	 * it is queued. Return the data to continue, or `null` to cancel
	 * the report for this target.
	 *
	 * The transform is scoped to this target only. Targets that share a
	 * collector URL each run their own transform. Other targets that
	 * accept the event still receive a report cancelled by this transform.
	 * Only `CmcdReporter` reads this option. For `createCmcdSession()`, use
	 * `filter`.
	 *
	 * @defaultValue `undefined`
	 *
	 * @example
	 * {@includeCode ../test/CmcdReporter.test.ts#example-transform}
	 */
	transform?: CmcdEventReportTransform<C>;
};
```

Replace the content of `libs/cmcd/src/CmcdSessionConfig.ts` with:

```ts
import type { CmcdEventReportConfig } from './CmcdEventReportConfig.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'

/**
 * The configuration of a CMCD session.
 *
 * The members of {@link CmcdRequestReportConfig} are the request mode settings. `configure()` replaces them.
 *
 * @public
 */
export type CmcdSessionConfig = CmcdRequestReportConfig & {
	/**
	 * The session ID, a string of 1 to 64 characters.
	 *
	 * @defaultValue A new UUID
	 */
	sid?: string;

	/**
	 * The content ID of each report whose data has no `cid`. It has at most 128 characters.
	 */
	cid?: string;

	/**
	 * The event targets. They cannot change after the session is created.
	 * The targets with the same `url` form one destination, and they share one sequence number.
	 */
	eventTargets?: readonly CmcdEventReportConfig[];
}
```

Replace the content of `libs/cmcd/src/CmcdSession.ts` with:

```ts
import type { HttpRequest } from '@svta/cml-utils'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'

/**
 * A CMCD session. One session reports one `sid`.
 *
 * The session keeps only the state that CTA-5004-B scopes to a session or to a destination.
 * The player passes its CMCD data with each call.
 *
 * @public
 */
export type CmcdSession = {
	/**
	 * The session ID of every report.
	 */
	readonly sid: string;

	/**
	 * Returns a copy of the request with a CMCD request report.
	 *
	 * In query mode, the session removes every `CMCD` parameter of the URL and adds one.
	 * In header mode, the session replaces the CMCD headers.
	 * `customData.cmcd` holds the report data before encoding.
	 * Each call advances the sequence number of request mode.
	 *
	 * @param request - The request to report.
	 * @param data - The CMCD data of the request.
	 * @returns A copy of the request with the report.
	 *
	 * @throws If a value cannot be encoded. The call then changes no state.
	 */
	createRequestReport<R extends HttpRequest>(request: R, data?: Cmcd): R & CmcdRequestReport<R['customData']>;

	/**
	 * Records an event report for each selected event target.
	 *
	 * A target is selected when it lists the event type and its `filter` returns `true`.
	 *
	 * @param type - The event type.
	 * @param data - The CMCD data of the event.
	 * @param request - A request for the filters.
	 *
	 * @throws If a filter throws, or if a value cannot be encoded. The call then changes no state.
	 *
	 * @example
	 * {@includeCode ../test/createCmcdSession.events.test.ts#example}
	 */
	recordEvent(type: CmcdEventType, data?: Cmcd, request?: Readonly<HttpRequest>): void;

	/**
	 * Replaces the request mode settings: `version`, `transmissionMode`, `enabledKeys`, and `customHeaderMap`.
	 * The `sid` and every sequence number stay.
	 *
	 * @param settings - The new settings.
	 */
	configure(settings: CmcdRequestReportConfig): void;

	/**
	 * Sends the queue of each event target at once.
	 * If a POST is in flight, the target sends after its response.
	 */
	flush(): void;
}
```

In `libs/cmcd/src/index.ts`, after the line `export type * from './CmcdReportConfig.ts'`, add:

```ts
export type * from './CmcdReportFilter.ts'
```

- [ ] **Step 5: Write the implementation**

Replace the content of `libs/cmcd/src/createCmcdSession.ts` with:

```ts
import type { DeepReadonly, HttpRequest } from '@svta/cml-utils'
import { uuid } from '@svta/cml-utils'
import { CMCD_MIME_TYPE } from './CMCD_MIME_TYPE.ts'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import { CMCD_EVENT_BACKGROUNDED_MODE } from './CmcdEventType.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdReportFilter } from './CmcdReportFilter.ts'
import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import { CMCD_EVENT_MODE, CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'
import type { CmcdSession } from './CmcdSession.ts'
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { CMCD_HEADERS } from './CmcdTransmissionMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'
import { encodePreparedCmcd } from './encodePreparedCmcd.ts'
import { prepareCmcdData } from './prepareCmcdData.ts'
import { replaceCmcdParam } from './replaceCmcdParam.ts'
import { toBareValue } from './toBareValue.ts'
import { toPreparedCmcdHeaders } from './toPreparedCmcdHeaders.ts'

type KeyFilter = CmcdEncodeOptions['filter']

type Destination = {
	sn: number;
}

type Draft = Pick<Destination, 'sn'>

type Target = {
	url: string;
	destination: Destination;
	events: readonly CmcdEventType[];
	keys: KeyFilter;
	batchSize: number;
	filter?: CmcdReportFilter;
	queue: string[];
	inFlight: boolean;
	flushPending: boolean;
}

const CMCD_HEADER = /^cmcd-(object|request|session|status)$/i

function toKeyFilter(keys: readonly CmcdKey[] | undefined): KeyFilter {
	if (!keys) {
		return undefined
	}

	const set = new Set<string>(keys)

	return (key) => set.has(key)
}

function createDestination(): Destination {
	return { sn: 0 }
}

function defaultRequester(request: HttpRequest): Promise<{ status: number; }> {
	const { url, ...init } = request

	return fetch(url, init)
}

/**
 * Creates a CMCD session. One session reports one `sid`.
 *
 * Request mode is one destination. Each event target URL is one destination.
 * Each destination has its own sequence number.
 * The player passes its CMCD data with each call and decides itself when its state changes.
 *
 * @param config - The configuration of the session.
 * @param requester - Sends each batch of event reports. The default requester uses `fetch`.
 * @returns The session.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/createCmcdSession.test.ts#example}
 */
export function createCmcdSession(config: CmcdSessionConfig = {}, requester: (request: HttpRequest) => Promise<{ status: number; }> = defaultRequester): CmcdSession {
	const sid = config.sid ?? uuid()
	const settings: CmcdRequestReportConfig = {
		version: config.version,
		transmissionMode: config.transmissionMode,
		enabledKeys: config.enabledKeys,
		customHeaderMap: config.customHeaderMap,
	}
	const requestDestination = createDestination()
	const urls = new Map<string, Destination>()
	const targets: Target[] = []
	let requestKeys = toKeyFilter(settings.enabledKeys)

	for (const target of config.eventTargets ?? []) {
		let destination = urls.get(target.url)

		if (!destination) {
			destination = createDestination()
			urls.set(target.url, destination)
		}

		targets.push({
			url: target.url,
			destination,
			events: [...(target.events ?? [])],
			keys: toKeyFilter(target.enabledKeys),
			batchSize: target.batchSize ?? 1,
			filter: target.filter,
			queue: [],
			inFlight: false,
			flushPending: false,
		})
	}

	function draftOf(drafts: Map<Destination, Draft>, destination: Destination): Draft {
		let draft = drafts.get(destination)

		if (!draft) {
			draft = { sn: destination.sn }
			drafts.set(destination, draft)
		}

		return draft
	}

	function build(draft: Draft, base: Cmcd, reportingMode: CmcdReportingMode, version: CmcdVersion, keys: KeyFilter, baseUrl?: string): Cmcd {
		return prepareCmcdData({ ...base, cid: base.cid ?? config.cid, sid, sn: draft.sn++ }, { version, reportingMode, filter: keys, baseUrl })
	}

	function commit(drafts: Map<Destination, Draft>): void {
		for (const [destination, draft] of drafts) {
			Object.assign(destination, draft)
		}
	}

	function isReady(target: Target): boolean {
		return target.queue.length >= target.batchSize
	}

	function send(target: Target, force?: boolean): void {
		if (target.inFlight) {
			target.flushPending ||= force === true
			return
		}

		if (!target.queue.length) {
			return
		}

		target.inFlight = true

		const lines = target.queue.splice(0)
		const request: HttpRequest = { url: target.url, method: 'POST', headers: { 'Content-Type': CMCD_MIME_TYPE }, body: lines.join('\n') }

		const settle = (): void => {
			target.inFlight = false

			if (target.flushPending) {
				target.flushPending = false
				send(target, true)
			}
			else if (isReady(target)) {
				send(target)
			}
		}

		new Promise<{ status: number; }>((resolve) => resolve(requester(request))).then(settle, settle)
	}

	function emit(type: CmcdEventType, data: Cmcd, request?: DeepReadonly<HttpRequest>): void {
		const report: Cmcd = { ...data, e: type, ts: data.ts ?? Date.now() }

		// CTA-5004-B: a b event without bg is the exit from backgrounded mode.
		if (type === CMCD_EVENT_BACKGROUNDED_MODE && toBareValue(report.bg) === false) {
			delete report.bg
		}

		const selected = targets.filter((target) => target.events.includes(type) && (!target.filter || target.filter(report, request)))
		const drafts = new Map<Destination, Draft>()
		const lines = selected.map((target) => encodePreparedCmcd(build(draftOf(drafts, target.destination), report, CMCD_EVENT_MODE, CMCD_V2, target.keys)))

		commit(drafts)

		selected.forEach((target, i) => {
			target.queue.push(lines[i])

			if (isReady(target)) {
				send(target)
			}
		})
	}

	return {
		sid,

		createRequestReport<R extends HttpRequest>(request: R, data: Cmcd = {}): R & CmcdRequestReport<R['customData']> {
			const drafts = new Map<Destination, Draft>()
			const cmcd = build(draftOf(drafts, requestDestination), data, CMCD_REQUEST_MODE, settings.version ?? CMCD_V2, requestKeys, request.url)
			const source = request.headers ?? {}
			const replace = settings.transmissionMode === CMCD_HEADERS
			const headers: Record<string, string> = {}
			let url = request.url

			for (const name in source) {
				if (!replace || !CMCD_HEADER.test(name)) {
					headers[name] = source[name]
				}
			}

			if (replace) {
				Object.assign(headers, toPreparedCmcdHeaders(cmcd, settings.customHeaderMap))
			}
			else {
				url = replaceCmcdParam(url, encodePreparedCmcd(cmcd))
			}

			commit(drafts)

			return { ...request, url, headers, customData: { ...request.customData, cmcd } } as R & CmcdRequestReport<R['customData']>
		},

		recordEvent(type, data = {}, request) {
			emit(type, data, request)
		},

		configure(next) {
			Object.assign(settings, next)
			requestKeys = toKeyFilter(settings.enabledKeys)
		},

		flush() {
			for (const target of targets) {
				send(target, true)
			}
		},
	}
}
```

- [ ] **Step 6: Build, run the checks, and confirm that they pass**

```bash
npm run build -w libs/cmcd
node --no-warnings --test libs/cmcd/test/createCmcdSession.events.test.ts
npm test -w libs/cmcd
npm run typecheck
npx eslint libs/cmcd
```

Expected: the 14 tests of the file pass, and every package test passes. The typecheck and ESLint report nothing.

- [ ] **Step 7: Commit**

```bash
git add libs/cmcd/src/CmcdEventType.ts libs/cmcd/src/CmcdReportFilter.ts libs/cmcd/src/CmcdEventReportConfig.ts libs/cmcd/src/CmcdSessionConfig.ts libs/cmcd/src/CmcdSession.ts libs/cmcd/src/createCmcdSession.ts libs/cmcd/src/index.ts libs/cmcd/config/cml-cmcd.api.md libs/cmcd/test/createCmcdSession.events.test.ts
git commit -s -m "feat(cmcd): record event reports in the CMCD session" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 4: Errors and the Keys with a Destination Scope

**Files:**
- Create: `libs/cmcd/src/readScopedValues.ts`
- Modify: `libs/cmcd/src/CmcdSessionConfig.ts`, `libs/cmcd/src/CmcdSession.ts`, `libs/cmcd/src/createCmcdSession.ts`, and the regenerated `libs/cmcd/config/cml-cmcd.api.md`
- Test: `libs/cmcd/test/createCmcdSession.errors.test.ts`

**Interfaces:**
- Consumes: the functions of `createCmcdSession.ts` from Task 3.
- Produces: `recordError(codes: string | readonly string[], data?: Cmcd): void`. Internal: `readScopedValues(data: Cmcd, ec?: readonly string[]): CmcdScopedValues` and the type `CmcdScopedValues` (`msd`, `bs`, `bsd`, `ec`). `emit()` gains the parameter `ec`.

- [ ] **Step 1: Write the failing test**

Create `libs/cmcd/test/createCmcdSession.errors.test.ts`:

```ts
import type { Cmcd, CmcdSessionConfig } from '@svta/cml-cmcd'
import { CmcdEventType, CmcdObjectType, CmcdPlayerState, createCmcdSession, toCmcdValue } from '@svta/cml-cmcd'
import type { HttpRequest } from '@svta/cml-utils'
import { deepEqual, equal, ok, throws } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

const SEGMENT = 'https://cdn.test/v/1.m4s'
const A = 'https://a.test/cmcd'
const B = 'https://b.test/cmcd'
const ts = 1000

function settle(): Promise<void> {
	return new Promise((resolve) => setImmediate(resolve))
}

function setup(config: CmcdSessionConfig) {
	const posts: HttpRequest[] = []
	const session = createCmcdSession({ sid: 's1', ...config }, async (request) => {
		posts.push(request)
		return { status: 200 }
	})
	const lines = (url?: string): string[] => posts.filter((post) => !url || post.url === url).flatMap((post) => String(post.body).split('\n'))
	const request = (data: Cmcd): string => decodeURIComponent(session.createRequestReport({ url: SEGMENT }, data).url)

	return { session, lines, request }
}

describe('createCmcdSession errors and keys with a destination scope', () => {
	beforeEach(() => mock.timers.enable({ apis: ['Date'], now: ts }))
	afterEach(() => mock.timers.reset())

	it('provides a valid example', () => {
		// #region example
		const posts: { url: string; body: string; }[] = []
		const session = createCmcdSession({
			sid: 'session-1',
			eventTargets: [
				{ url: 'https://collector.example.com/errors', events: [CmcdEventType.ERROR] },
				{ url: 'https://collector.example.com/cmcd', events: [CmcdEventType.PLAY_STATE] },
			],
		}, async (request) => {
			posts.push({ url: request.url, body: String(request.body) })
			return { status: 200 }
		})

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.PLAYING, msd: 850 })
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.REBUFFERING, bs: true })
		session.recordError('MEDIA_ERR_NETWORK')
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.PLAYING, bsd: [1200] })

		const report = session.createRequestReport({ url: 'https://cdn.example.com/movie/seg-4.m4s' }, { ot: CmcdObjectType.VIDEO, d: 4000 })

		const error = posts.find((post) => post.url === 'https://collector.example.com/errors')
		ok(error?.body.startsWith('bs,e=e,ec=("MEDIA_ERR_NETWORK"),msd=850,'))
		equal(decodeURIComponent(report.url), 'https://cdn.example.com/movie/seg-4.m4s?CMCD=bs,bsd=(1200),d=4000,ec=("MEDIA_ERR_NETWORK"),msd=850,ot=v,sid="session-1",sn=0,v=2')
		// #endregion example
	})

	it('sends msd from any call once to each destination, and ignores an invalid msd', async () => {
		const { session, lines, request } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }, { url: B, events: [CmcdEventType.PLAY_STATE] }] })

		for (const msd of [-5, Number.NaN, Infinity, 1e15]) {
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 's', msd })
		}
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p', msd: 850.6 })
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a', msd: 900 })
		const first = request({ ot: CmcdObjectType.VIDEO, msd: 900 })
		const second = request({ ot: CmcdObjectType.VIDEO })
		await settle()

		deepEqual(lines().filter((line) => line.includes('msd')), [
			`e=ps,msd=851,sid="s1",sn=4,sta=p,ts=${ts},v=2`,
			`e=ps,msd=851,sid="s1",sn=4,sta=p,ts=${ts},v=2`,
		])
		ok(first.includes('msd=851'))
		ok(!second.includes('msd'))
	})

	it('rounds msd, and accepts values from 0 to the integer limit', () => {
		const cases: [number, string][] = [[0, 'msd=0'], [12.5, 'msd=13'], [999_999_999_999_999, 'msd=999999999999999'], [999_999_999_999_998.6, 'msd=999999999999999']]

		for (const [msd, expected] of cases) {
			const { request } = setup({})
			ok(request({ msd }).includes(expected))
		}
	})

	it('keeps msd for the next report that can carry it', () => {
		const { session, request } = setup({ version: 1 })

		const first = request({ msd: 300 })
		session.configure({ version: 2 })
		const second = request({})

		ok(!first.includes('msd'))
		ok(second.includes('msd=300'))
	})

	it('sends a waiting bs with the next report of the same object type', async () => {
		const { session, lines, request } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }] })

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'r', ot: CmcdObjectType.VIDEO, bs: true })
		const audio = request({ ot: CmcdObjectType.AUDIO })
		const video = request({ ot: CmcdObjectType.VIDEO })
		const again = request({ ot: CmcdObjectType.VIDEO })
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		request({ bs: true })
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
		await settle()

		equal(audio, `${SEGMENT}?CMCD=ot=a,sid="s1",sn=0,v=2`)
		equal(video, `${SEGMENT}?CMCD=bs,ot=v,sid="s1",sn=1,v=2`)
		equal(again, `${SEGMENT}?CMCD=ot=v,sid="s1",sn=2,v=2`)
		deepEqual(lines(), [
			`bs,e=ps,ot=v,sid="s1",sn=0,sta=r,ts=${ts},v=2`,
			`e=ps,sid="s1",sn=1,sta=p,ts=${ts},v=2`,
			`bs,e=ps,sid="s1",sn=2,sta=a,ts=${ts},v=2`,
		])
	})

	it('sends the bsd values of several calls to a destination as one list', async () => {
		const { session, lines, request } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }] })

		const first = request({ bsd: [1200] })
		const second = request({ bsd: [800] })
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
		await settle()

		equal(first, `${SEGMENT}?CMCD=bsd=(1200),sid="s1",sn=0,v=2`)
		equal(second, `${SEGMENT}?CMCD=bsd=(800),sid="s1",sn=1,v=2`)
		deepEqual(lines(), [`bsd=(1200 800),e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`, `e=ps,sid="s1",sn=1,sta=a,ts=${ts},v=2`])
	})

	it('copies each waiting value, including the value inside an SfItem', () => {
		const { session, lines, request } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }] })
		const params = { v: true }
		const item = toCmcdValue<number, { v: boolean; }>(1200, params)
		const bsd = [item, 800]

		request({ bsd })
		item.value = 5
		params.v = false
		bsd.push(1)
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

		deepEqual(lines(), [`bsd=(1200;v 800),e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`])
	})

	it('sends an e report to the targets that list e, and the codes wait for every other destination', async () => {
		const { session, lines, request } = setup({
			eventTargets: [
				{ url: A, events: [CmcdEventType.ERROR, CmcdEventType.PLAY_STATE] },
				{ url: B, events: [CmcdEventType.PLAY_STATE] },
			],
		})

		const stall = request({ bs: true })
		session.recordError('NET')
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
		const first = request({})
		const second = request({})
		await settle()

		equal(stall, `${SEGMENT}?CMCD=bs,sid="s1",sn=0,v=2`)
		equal(first, `${SEGMENT}?CMCD=ec=("NET"),sid="s1",sn=1,v=2`)
		equal(second, `${SEGMENT}?CMCD=sid="s1",sn=2,v=2`)
		deepEqual(lines(A), [
			`bs,e=e,ec=("NET"),sid="s1",sn=0,ts=${ts},v=2`,
			`e=ps,sid="s1",sn=1,sta=p,ts=${ts},v=2`,
			`e=ps,sid="s1",sn=2,sta=a,ts=${ts},v=2`,
		])
		deepEqual(lines(B), [
			`bs,e=ps,ec=("NET"),sid="s1",sn=0,sta=p,ts=${ts},v=2`,
			`e=ps,sid="s1",sn=1,sta=a,ts=${ts},v=2`,
		])
	})

	it('changes no state when a call throws', () => {
		const { session, lines, request } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }] })

		throws(() => session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p', bs: true, msd: 500, 'com.example-name': 'a\nb' }))
		throws(() => request({ bsd: [1e18] }))
		throws(() => session.recordError('a\nb'))
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

		equal(request({}), `${SEGMENT}?CMCD=sid="s1",sn=0,v=2`)
		deepEqual(lines(), [`e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`])
	})

	it('drops a waiting value that the version or enabledKeys does not allow', () => {
		const { session, request } = setup({ version: 1, eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }] })

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p', bsd: [300] })
		const first = request({})
		session.configure({ version: 2 })
		const second = request({})

		equal(first, `${SEGMENT}?CMCD=sid="s1"`)
		equal(second, `${SEGMENT}?CMCD=sid="s1",sn=1,v=2`)
	})
})
```

- [ ] **Step 2: Build, run the test, and confirm that it fails**

```bash
npm run build -w libs/cmcd
node --no-warnings --test libs/cmcd/test/createCmcdSession.errors.test.ts
```

Expected: FAIL. 7 of 10 tests fail, with `TypeError: session.recordError is not a function` and with assertion errors for `msd`, `bs`, and `bsd`.

- [ ] **Step 3: Write the scoped values**

Create `libs/cmcd/src/readScopedValues.ts`:

```ts
import { encodeSfDict, SfItem } from '@svta/cml-structured-field-values'
import { CMCD_KEY_SPECS } from './CMCD_KEY_SPECS.ts'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { Cmcd } from './Cmcd.ts'
import { CMCD_EVENT_MODE } from './CmcdReportingMode.ts'
import { normalizeValue } from './normalizeValue.ts'
import { toBareValue } from './toBareValue.ts'
import { toTokenString } from './toTokenString.ts'

/**
 * The values of one call that every destination of a CMCD session receives.
 *
 * @internal
 */
export type CmcdScopedValues = {
	/**
	 * A valid `msd`, rounded to an integer.
	 */
	msd?: number;

	/**
	 * The object type of a `bs: true` call. An empty string matches every object type.
	 */
	bs?: string;

	/**
	 * A copy of the `bsd` items.
	 */
	bsd?: unknown[];

	/**
	 * A copy of the `ec` items.
	 */
	ec?: unknown[];
}

const MAX_INTEGER = 999_999_999_999_999

function copyItems(value: unknown, key: 'bsd' | 'ec'): unknown[] | undefined {
	if (value == null) {
		return undefined
	}

	const list = normalizeValue(toBareValue(value), CMCD_KEY_SPECS[key], { version: CMCD_V2, reportingMode: CMCD_EVENT_MODE }) as unknown[] | undefined

	return list?.map((item) => item instanceof SfItem ? new SfItem(item.value, item.params && { ...item.params }) : item)
}

/**
 * Reads the values of a call that have a destination scope.
 *
 * The result has a valid `msd`, the object type of a `bs: true` call, and copies of the `bsd` and `ec` items.
 *
 * @param data - The data of the call.
 * @param ec - The error codes of a `recordError()` call.
 * @returns The scoped values.
 *
 * @throws If a `bsd` or `ec` value cannot be encoded.
 *
 * @internal
 */
export function readScopedValues(data: Cmcd, ec?: readonly string[]): CmcdScopedValues {
	const scoped: CmcdScopedValues = {}
	const msd = toBareValue(data.msd)

	if (typeof msd === 'number' && msd >= 0 && Math.round(msd) <= MAX_INTEGER) {
		scoped.msd = Math.round(msd)
	}

	if (toBareValue(data.bs) === true) {
		scoped.bs = toTokenString(data.ot) ?? ''
	}

	const bsd = copyItems(data.bsd, 'bsd')
	const codes = copyItems(ec, 'ec')
	const lists: Record<string, unknown[]> = {}

	if (bsd) {
		lists['bsd'] = scoped.bsd = bsd
	}

	if (codes) {
		lists['ec'] = scoped.ec = codes
	}

	if (bsd || codes) {
		encodeSfDict(lists)
	}

	return scoped
}
```

- [ ] **Step 4: Update the types**

Replace the content of `libs/cmcd/src/CmcdSessionConfig.ts` with:

```ts
import type { CmcdEventReportConfig } from './CmcdEventReportConfig.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'

/**
 * The configuration of a CMCD session.
 *
 * The members of {@link CmcdRequestReportConfig} are the request mode settings. `configure()` replaces them.
 *
 * @public
 */
export type CmcdSessionConfig = CmcdRequestReportConfig & {
	/**
	 * The session ID, a string of 1 to 64 characters.
	 *
	 * @defaultValue A new UUID
	 */
	sid?: string;

	/**
	 * The content ID of each report whose data has no `cid`. It has at most 128 characters.
	 */
	cid?: string;

	/**
	 * The event targets. They cannot change after the session is created.
	 * The targets with the same `url` form one destination.
	 * They share one sequence number, the `msd` rule, and the waiting values.
	 */
	eventTargets?: readonly CmcdEventReportConfig[];
}
```

Replace the content of `libs/cmcd/src/CmcdSession.ts` with:

```ts
import type { HttpRequest } from '@svta/cml-utils'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'

/**
 * A CMCD session. One session reports one `sid`.
 *
 * The session keeps only the state that CTA-5004-B scopes to a session or to a destination.
 * The player passes its CMCD data with each call.
 *
 * @public
 */
export type CmcdSession = {
	/**
	 * The session ID of every report.
	 */
	readonly sid: string;

	/**
	 * Returns a copy of the request with a CMCD request report.
	 *
	 * In query mode, the session removes every `CMCD` parameter of the URL and adds one.
	 * In header mode, the session replaces the CMCD headers.
	 * `customData.cmcd` holds the report data before encoding.
	 * Each call advances the sequence number of request mode.
	 *
	 * @param request - The request to report.
	 * @param data - The CMCD data of the request.
	 * @returns A copy of the request with the report.
	 *
	 * @throws If a value cannot be encoded. The call then changes no state.
	 */
	createRequestReport<R extends HttpRequest>(request: R, data?: Cmcd): R & CmcdRequestReport<R['customData']>;

	/**
	 * Records an event report for each selected event target.
	 *
	 * A target is selected when it lists the event type and its `filter` returns `true`.
	 *
	 * @param type - The event type.
	 * @param data - The CMCD data of the event.
	 * @param request - A request for the filters.
	 *
	 * @throws If a filter throws, or if a value cannot be encoded. The call then changes no state.
	 *
	 * @example
	 * {@includeCode ../test/createCmcdSession.events.test.ts#example}
	 */
	recordEvent(type: CmcdEventType, data?: Cmcd, request?: Readonly<HttpRequest>): void;

	/**
	 * Records an error.
	 *
	 * Each selected target that lists `e` receives an `e` report with `ec`.
	 * Every other destination sends the codes with its next report.
	 *
	 * @param codes - The error codes.
	 * @param data - The CMCD data of the error report.
	 *
	 * @throws If a filter throws, or if a value cannot be encoded. The call then changes no state.
	 *
	 * @example
	 * {@includeCode ../test/createCmcdSession.errors.test.ts#example}
	 */
	recordError(codes: string | readonly string[], data?: Cmcd): void;

	/**
	 * Replaces the request mode settings: `version`, `transmissionMode`, `enabledKeys`, and `customHeaderMap`.
	 * The `sid` and every sequence number stay.
	 *
	 * @param settings - The new settings.
	 */
	configure(settings: CmcdRequestReportConfig): void;

	/**
	 * Sends the queue of each event target at once.
	 * If a POST is in flight, the target sends after its response.
	 */
	flush(): void;
}
```

- [ ] **Step 5: Write the implementation**

Replace the content of `libs/cmcd/src/createCmcdSession.ts` with:

```ts
import type { DeepReadonly, HttpRequest } from '@svta/cml-utils'
import { uuid } from '@svta/cml-utils'
import { CMCD_MIME_TYPE } from './CMCD_MIME_TYPE.ts'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import { CMCD_EVENT_BACKGROUNDED_MODE, CMCD_EVENT_ERROR } from './CmcdEventType.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdReportFilter } from './CmcdReportFilter.ts'
import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import { CMCD_EVENT_MODE, CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'
import type { CmcdSession } from './CmcdSession.ts'
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { CMCD_HEADERS } from './CmcdTransmissionMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'
import { encodePreparedCmcd } from './encodePreparedCmcd.ts'
import { prepareCmcdData } from './prepareCmcdData.ts'
import type { CmcdScopedValues } from './readScopedValues.ts'
import { readScopedValues } from './readScopedValues.ts'
import { replaceCmcdParam } from './replaceCmcdParam.ts'
import { toBareValue } from './toBareValue.ts'
import { toPreparedCmcdHeaders } from './toPreparedCmcdHeaders.ts'
import { toTokenString } from './toTokenString.ts'

type KeyFilter = CmcdEncodeOptions['filter']

type Waiting = {
	bs: string[];
	bsd: unknown[];
	ec: unknown[];
}

type Destination = {
	sn: number;
	msdSent: boolean;
	waiting: Waiting;
}

type Draft = Pick<Destination, 'sn' | 'msdSent' | 'waiting'>

type Target = {
	url: string;
	destination: Destination;
	events: readonly CmcdEventType[];
	keys: KeyFilter;
	batchSize: number;
	filter?: CmcdReportFilter;
	queue: string[];
	inFlight: boolean;
	flushPending: boolean;
}

const CMCD_HEADER = /^cmcd-(object|request|session|status)$/i

function toKeyFilter(keys: readonly CmcdKey[] | undefined): KeyFilter {
	if (!keys) {
		return undefined
	}

	const set = new Set<string>(keys)

	return (key) => set.has(key)
}

function createDestination(): Destination {
	return { sn: 0, msdSent: false, waiting: { bs: [], bsd: [], ec: [] } }
}

function defaultRequester(request: HttpRequest): Promise<{ status: number; }> {
	const { url, ...init } = request

	return fetch(url, init)
}

/**
 * Creates a CMCD session. One session reports one `sid`.
 *
 * Request mode is one destination. Each event target URL is one destination.
 * Each destination has its own sequence number.
 * The player passes its CMCD data with each call and decides itself when its state changes.
 *
 * @param config - The configuration of the session.
 * @param requester - Sends each batch of event reports. The default requester uses `fetch`.
 * @returns The session.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/createCmcdSession.test.ts#example}
 */
export function createCmcdSession(config: CmcdSessionConfig = {}, requester: (request: HttpRequest) => Promise<{ status: number; }> = defaultRequester): CmcdSession {
	const sid = config.sid ?? uuid()
	const settings: CmcdRequestReportConfig = {
		version: config.version,
		transmissionMode: config.transmissionMode,
		enabledKeys: config.enabledKeys,
		customHeaderMap: config.customHeaderMap,
	}
	const requestDestination = createDestination()
	const destinations: Destination[] = [requestDestination]
	const urls = new Map<string, Destination>()
	const targets: Target[] = []
	let requestKeys = toKeyFilter(settings.enabledKeys)
	let msd: number | undefined

	for (const target of config.eventTargets ?? []) {
		let destination = urls.get(target.url)

		if (!destination) {
			destination = createDestination()
			urls.set(target.url, destination)
			destinations.push(destination)
		}

		targets.push({
			url: target.url,
			destination,
			events: [...(target.events ?? [])],
			keys: toKeyFilter(target.enabledKeys),
			batchSize: target.batchSize ?? 1,
			filter: target.filter,
			queue: [],
			inFlight: false,
			flushPending: false,
		})
	}

	function draftOf(drafts: Map<Destination, Draft>, destination: Destination): Draft {
		let draft = drafts.get(destination)

		if (!draft) {
			draft = { sn: destination.sn, msdSent: destination.msdSent, waiting: { ...destination.waiting } }
			drafts.set(destination, draft)
		}

		return draft
	}

	function build(draft: Draft, base: Cmcd, scoped: CmcdScopedValues, reportingMode: CmcdReportingMode, version: CmcdVersion, keys: KeyFilter, baseUrl?: string): Cmcd {
		const { waiting } = draft
		const values: Record<string, unknown> = { ...base, cid: base.cid ?? config.cid, msd: draft.msdSent ? undefined : msd ?? scoped.msd }

		if (waiting.bs.length) {
			const ot = toTokenString(base.ot)
			const kept = ot === undefined ? [] : waiting.bs.filter((type) => type !== '' && type !== ot)

			if (kept.length < waiting.bs.length) {
				values['bs'] = true
			}

			waiting.bs = kept
		}

		if (waiting.bsd.length) {
			values['bsd'] = [...waiting.bsd, ...(scoped.bsd ?? [])]
			waiting.bsd = []
		}

		if (waiting.ec.length) {
			values['ec'] = [...waiting.ec, ...(scoped.ec ?? [])]
			waiting.ec = []
		}

		values['sid'] = sid
		values['sn'] = draft.sn++

		const prepared = prepareCmcdData(values, { version, reportingMode, filter: keys, baseUrl })

		draft.msdSent ||= prepared.msd !== undefined

		return prepared
	}

	function commit(drafts: Map<Destination, Draft>, scoped: CmcdScopedValues): void {
		msd ??= scoped.msd

		for (const destination of destinations) {
			const draft = drafts.get(destination)

			if (draft) {
				Object.assign(destination, draft)
			}
			else {
				const { waiting } = destination

				if (scoped.bs !== undefined) {
					waiting.bs.push(scoped.bs)
				}

				if (scoped.bsd) {
					waiting.bsd.push(...scoped.bsd)
				}

				if (scoped.ec) {
					waiting.ec.push(...scoped.ec)
				}
			}
		}
	}

	function isReady(target: Target): boolean {
		return target.queue.length >= target.batchSize
	}

	function send(target: Target, force?: boolean): void {
		if (target.inFlight) {
			target.flushPending ||= force === true
			return
		}

		if (!target.queue.length) {
			return
		}

		target.inFlight = true

		const lines = target.queue.splice(0)
		const request: HttpRequest = { url: target.url, method: 'POST', headers: { 'Content-Type': CMCD_MIME_TYPE }, body: lines.join('\n') }

		const settle = (): void => {
			target.inFlight = false

			if (target.flushPending) {
				target.flushPending = false
				send(target, true)
			}
			else if (isReady(target)) {
				send(target)
			}
		}

		new Promise<{ status: number; }>((resolve) => resolve(requester(request))).then(settle, settle)
	}

	function emit(type: CmcdEventType, data: Cmcd, request?: DeepReadonly<HttpRequest>, ec?: readonly string[]): void {
		const report: Cmcd = { ...data, e: type, ts: data.ts ?? Date.now() }

		// CTA-5004-B: a b event without bg is the exit from backgrounded mode.
		if (type === CMCD_EVENT_BACKGROUNDED_MODE && toBareValue(report.bg) === false) {
			delete report.bg
		}

		const scoped = readScopedValues(report, ec)
		const selected = targets.filter((target) => target.events.includes(type) && (!target.filter || target.filter(report, request)))
		const drafts = new Map<Destination, Draft>()
		const lines = selected.map((target) => encodePreparedCmcd(build(draftOf(drafts, target.destination), report, scoped, CMCD_EVENT_MODE, CMCD_V2, target.keys)))

		commit(drafts, scoped)

		selected.forEach((target, i) => {
			target.queue.push(lines[i])

			if (isReady(target)) {
				send(target)
			}
		})
	}

	return {
		sid,

		createRequestReport<R extends HttpRequest>(request: R, data: Cmcd = {}): R & CmcdRequestReport<R['customData']> {
			const scoped = readScopedValues(data)
			const drafts = new Map<Destination, Draft>()
			const cmcd = build(draftOf(drafts, requestDestination), data, scoped, CMCD_REQUEST_MODE, settings.version ?? CMCD_V2, requestKeys, request.url)
			const source = request.headers ?? {}
			const replace = settings.transmissionMode === CMCD_HEADERS
			const headers: Record<string, string> = {}
			let url = request.url

			for (const name in source) {
				if (!replace || !CMCD_HEADER.test(name)) {
					headers[name] = source[name]
				}
			}

			if (replace) {
				Object.assign(headers, toPreparedCmcdHeaders(cmcd, settings.customHeaderMap))
			}
			else {
				url = replaceCmcdParam(url, encodePreparedCmcd(cmcd))
			}

			commit(drafts, scoped)

			return { ...request, url, headers, customData: { ...request.customData, cmcd } } as R & CmcdRequestReport<R['customData']>
		},

		recordEvent(type, data = {}, request) {
			emit(type, data, request)
		},

		recordError(codes, data = {}) {
			const ec = typeof codes === 'string' ? [codes] : [...codes]

			emit(CMCD_EVENT_ERROR, { ...data, ec }, undefined, ec)
		},

		configure(next) {
			Object.assign(settings, next)
			requestKeys = toKeyFilter(settings.enabledKeys)
		},

		flush() {
			for (const target of targets) {
				send(target, true)
			}
		},
	}
}
```

- [ ] **Step 6: Build, run the checks, and confirm that they pass**

```bash
npm run build -w libs/cmcd
node --no-warnings --test libs/cmcd/test/createCmcdSession.errors.test.ts
npm test -w libs/cmcd
npm run typecheck
npx eslint libs/cmcd
```

Expected: the 10 tests of the file pass, and every package test passes. The typecheck and ESLint report nothing.

- [ ] **Step 7: Commit**

```bash
git add libs/cmcd/src/readScopedValues.ts libs/cmcd/src/CmcdSessionConfig.ts libs/cmcd/src/CmcdSession.ts libs/cmcd/src/createCmcdSession.ts libs/cmcd/config/cml-cmcd.api.md libs/cmcd/test/createCmcdSession.errors.test.ts
git commit -s -m "feat(cmcd): record errors and the keys with a destination scope" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 5: Responses

**Files:**
- Create: `libs/cmcd/src/toResponseKeys.ts`
- Modify: `libs/cmcd/src/CmcdSession.ts`, `libs/cmcd/src/createCmcdSession.ts`, and the regenerated `libs/cmcd/config/cml-cmcd.api.md`
- Test: `libs/cmcd/test/toResponseKeys.test.ts`, `libs/cmcd/test/createCmcdSession.responses.test.ts`

**Interfaces:**
- Consumes: `replaceCmcdParam()` from Task 1, and `emit()` and `readScopedValues()` from Task 4.
- Produces: `recordResponseReceived(response: HttpResponse, data?: Cmcd): void`. Internal: `toResponseKeys(response: HttpResponse, timeOrigin: number): Cmcd`.

- [ ] **Step 1: Write the failing tests**

Create `libs/cmcd/test/toResponseKeys.test.ts`:

```ts
import { deepEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { toResponseKeys } from '../src/toResponseKeys.ts'

const request = { url: 'https://cdn.test/1.m4s?CMCD=sn%3D0&a=1' }

describe('toResponseKeys', () => {
	it('derives url, rc, ts, ttfb, and ttlb', () => {
		const keys = toResponseKeys({ request, status: 200, resourceTiming: { startTime: 100.4, responseStart: 180.6, duration: 299.5, encodedBodySize: 1000 } }, 1000)

		deepEqual(keys, { url: 'https://cdn.test/1.m4s?a=1', rc: 200, ts: 1100, ttfb: 80, ttlb: 300 })
	})

	it('derives only url and rc without resourceTiming', () => {
		deepEqual(toResponseKeys({ request, status: 404 }, 1000), { url: 'https://cdn.test/1.m4s?a=1', rc: 404 })
	})

	it('omits ttfb when responseStart is 0, missing, or earlier than startTime', () => {
		for (const responseStart of [0, undefined, 50]) {
			const keys = toResponseKeys({ request, status: 200, resourceTiming: { startTime: 100, responseStart, duration: 300, encodedBodySize: 0 } }, 1000)

			deepEqual(keys, { url: 'https://cdn.test/1.m4s?a=1', rc: 200, ts: 1100, ttlb: 300 })
		}
	})

	it('omits ttlb when duration is 0', () => {
		const keys = toResponseKeys({ request, status: 200, resourceTiming: { startTime: 100, responseStart: 100, duration: 0, encodedBodySize: 0 } }, 1000)

		deepEqual(keys, { url: 'https://cdn.test/1.m4s?a=1', rc: 200, ts: 1100, ttfb: 0 })
	})
})
```

Create `libs/cmcd/test/createCmcdSession.responses.test.ts`:

```ts
import { CmcdEventType, CmcdObjectType, createCmcdSession } from '@svta/cml-cmcd'
import type { HttpRequest } from '@svta/cml-utils'
import { deepEqual, equal, ok } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

const SEGMENT = 'https://cdn.test/v/1.m4s'
const A = 'https://a.test/cmcd'
const ts = 1000

function settle(): Promise<void> {
	return new Promise((resolve) => setImmediate(resolve))
}

function setup() {
	const posts: HttpRequest[] = []
	const session = createCmcdSession({ sid: 's1', eventTargets: [{ url: A, events: [CmcdEventType.RESPONSE_RECEIVED] }] }, async (request) => {
		posts.push(request)
		return { status: 200 }
	})
	const lines = (): string[] => posts.flatMap((post) => String(post.body).split('\n'))

	return { session, lines }
}

describe('createCmcdSession responses', () => {
	beforeEach(() => mock.timers.enable({ apis: ['Date'], now: ts }))
	afterEach(() => mock.timers.reset())

	it('provides a valid example', () => {
		// #region example
		const bodies: string[] = []
		const settings = [
			{ url: 'https://collector.example.com/cmcd', includeInRequests: ['segment'] },
			{ url: 'https://collector.example.com/cmcd', includeInRequests: ['mpd'] },
		]

		const session = createCmcdSession({
			eventTargets: settings.map((target) => ({
				url: target.url,
				events: [CmcdEventType.RESPONSE_RECEIVED],
				filter: (report, request) => report.e !== CmcdEventType.RESPONSE_RECEIVED || target.includeInRequests.includes(request?.customData?.requestType),
			})),
		}, async (request) => {
			bodies.push(String(request.body))
			return { status: 200 }
		})

		session.recordResponseReceived({ request: { url: 'https://cdn.example.com/movie/seg-1.m4s', customData: { requestType: 'segment' } }, status: 200 })
		session.recordResponseReceived({ request: { url: 'https://cdn.example.com/movie.mpd', customData: { requestType: 'mpd' } }, status: 200 })

		equal(bodies.length, 2)
		ok(bodies[0].includes('sn=0') && bodies[0].includes('url="https://cdn.example.com/movie/seg-1.m4s"'))
		ok(bodies[1].includes('sn=1') && bodies[1].includes('url="https://cdn.example.com/movie.mpd"'))
		// #endregion example
	})

	it('derives url, rc, ts, ttfb, and ttlb', () => {
		const { session, lines } = setup()

		session.recordResponseReceived({
			request: { url: `${SEGMENT}?CMCD=sn%3D0&a=1` },
			status: 200,
			resourceTiming: { startTime: 100, responseStart: 180, duration: 300, encodedBodySize: 1000 },
		})

		deepEqual(lines(), [`e=rr,rc=200,sid="s1",sn=0,ts=${Math.round(performance.timeOrigin + 100)},ttfb=80,ttlb=300,url="${SEGMENT}?a=1",v=2`])
	})

	it('adds the request-time data without the keys that have a destination scope, and data overrides the derived keys', async () => {
		const { session, lines } = setup()

		const report = session.createRequestReport({ url: SEGMENT }, { ot: CmcdObjectType.VIDEO, br: [3000], msd: 700, bs: true, bsd: [300] })
		session.recordResponseReceived({ request: report, status: 200 }, { rc: 206, ttfbb: 60 })
		session.recordResponseReceived({ request: { url: 'https://cdn.test/v/2.m4s' }, status: 404 })
		await settle()

		deepEqual(lines(), [
			`br=(3000),bs,bsd=(300),e=rr,msd=700,ot=v,rc=206,sid="s1",sn=0,ts=${ts},ttfbb=60,url="${SEGMENT}",v=2`,
			`e=rr,rc=404,sid="s1",sn=1,ts=${ts},url="https://cdn.test/v/2.m4s",v=2`,
		])
	})
})
```

- [ ] **Step 2: Build, run the tests, and confirm that they fail**

```bash
npm run build -w libs/cmcd
node --no-warnings --test libs/cmcd/test/toResponseKeys.test.ts libs/cmcd/test/createCmcdSession.responses.test.ts
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/toResponseKeys.ts`, and with `TypeError: session.recordResponseReceived is not a function`.

- [ ] **Step 3: Write the response keys**

Create `libs/cmcd/src/toResponseKeys.ts`:

```ts
import type { HttpResponse } from '@svta/cml-utils'
import type { Cmcd } from './Cmcd.ts'
import { replaceCmcdParam } from './replaceCmcdParam.ts'

/**
 * Derives the keys of an `rr` report from a response.
 *
 * - `url` is the request URL without the `CMCD` parameter.
 * - `rc` is the status.
 * - `ts` is the time origin plus `startTime`.
 * - `ttfb` is `responseStart` minus `startTime`. It needs a `responseStart` above 0 and not earlier than `startTime`.
 * - `ttlb` is `duration`. It needs a `duration` above 0.
 *
 * Resource Timing reports 0 for `responseStart` of a cross-origin response without the `Timing-Allow-Origin` header.
 *
 * @param response - The response.
 * @param timeOrigin - The time origin of `resourceTiming`, in milliseconds since the epoch.
 * @returns The derived keys.
 *
 * @internal
 */
export function toResponseKeys(response: HttpResponse, timeOrigin: number): Cmcd {
	const keys: Cmcd = { url: replaceCmcdParam(response.request.url), rc: response.status }
	const timing = response.resourceTiming

	if (timing) {
		const { startTime, responseStart = 0, duration } = timing

		keys.ts = Math.round(timeOrigin + startTime)

		if (responseStart > 0 && responseStart >= startTime) {
			keys.ttfb = Math.round(responseStart - startTime)
		}

		if (duration > 0) {
			keys.ttlb = Math.round(duration)
		}
	}

	return keys
}
```

- [ ] **Step 4: Update the type and the implementation**

Replace the content of `libs/cmcd/src/CmcdSession.ts` with:

```ts
import type { HttpRequest, HttpResponse } from '@svta/cml-utils'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'

/**
 * A CMCD session. One session reports one `sid`.
 *
 * The session keeps only the state that CTA-5004-B scopes to a session or to a destination.
 * The player passes its CMCD data with each call.
 *
 * @public
 */
export type CmcdSession = {
	/**
	 * The session ID of every report.
	 */
	readonly sid: string;

	/**
	 * Returns a copy of the request with a CMCD request report.
	 *
	 * In query mode, the session removes every `CMCD` parameter of the URL and adds one.
	 * In header mode, the session replaces the CMCD headers.
	 * `customData.cmcd` holds the report data before encoding.
	 * Each call advances the sequence number of request mode.
	 *
	 * @param request - The request to report.
	 * @param data - The CMCD data of the request.
	 * @returns A copy of the request with the report.
	 *
	 * @throws If a value cannot be encoded. The call then changes no state.
	 */
	createRequestReport<R extends HttpRequest>(request: R, data?: Cmcd): R & CmcdRequestReport<R['customData']>;

	/**
	 * Records an event report for each selected event target.
	 *
	 * A target is selected when it lists the event type and its `filter` returns `true`.
	 *
	 * @param type - The event type.
	 * @param data - The CMCD data of the event.
	 * @param request - A request for the filters.
	 *
	 * @throws If a filter throws, or if a value cannot be encoded. The call then changes no state.
	 *
	 * @example
	 * {@includeCode ../test/createCmcdSession.events.test.ts#example}
	 */
	recordEvent(type: CmcdEventType, data?: Cmcd, request?: Readonly<HttpRequest>): void;

	/**
	 * Records an `rr` report for a response.
	 *
	 * The session derives `url` without the `CMCD` parameter, and `rc` from `status`.
	 * It derives `ts`, `ttfb`, and `ttlb` from `resourceTiming`.
	 * It adds the request-time data from `customData.cmcd`, without `msd`, `bs`, `bsd`, and `ec`.
	 * The `data` argument overrides the derived keys.
	 *
	 * @param response - The response. Its `request` is the request report.
	 * @param data - The keys that override the derived keys.
	 *
	 * @throws If a filter throws, or if a value cannot be encoded. The call then changes no state.
	 *
	 * @example
	 * {@includeCode ../test/createCmcdSession.responses.test.ts#example}
	 */
	recordResponseReceived(response: HttpResponse, data?: Cmcd): void;

	/**
	 * Records an error.
	 *
	 * Each selected target that lists `e` receives an `e` report with `ec`.
	 * Every other destination sends the codes with its next report.
	 *
	 * @param codes - The error codes.
	 * @param data - The CMCD data of the error report.
	 *
	 * @throws If a filter throws, or if a value cannot be encoded. The call then changes no state.
	 *
	 * @example
	 * {@includeCode ../test/createCmcdSession.errors.test.ts#example}
	 */
	recordError(codes: string | readonly string[], data?: Cmcd): void;

	/**
	 * Replaces the request mode settings: `version`, `transmissionMode`, `enabledKeys`, and `customHeaderMap`.
	 * The `sid` and every sequence number stay.
	 *
	 * @param settings - The new settings.
	 */
	configure(settings: CmcdRequestReportConfig): void;

	/**
	 * Sends the queue of each event target at once.
	 * If a POST is in flight, the target sends after its response.
	 */
	flush(): void;
}
```

Replace the content of `libs/cmcd/src/createCmcdSession.ts` with:

```ts
import type { DeepReadonly, HttpRequest } from '@svta/cml-utils'
import { uuid } from '@svta/cml-utils'
import { CMCD_MIME_TYPE } from './CMCD_MIME_TYPE.ts'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import { CMCD_EVENT_BACKGROUNDED_MODE, CMCD_EVENT_ERROR, CMCD_EVENT_RESPONSE_RECEIVED } from './CmcdEventType.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdReportFilter } from './CmcdReportFilter.ts'
import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import { CMCD_EVENT_MODE, CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'
import type { CmcdSession } from './CmcdSession.ts'
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { CMCD_HEADERS } from './CmcdTransmissionMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'
import { encodePreparedCmcd } from './encodePreparedCmcd.ts'
import { prepareCmcdData } from './prepareCmcdData.ts'
import type { CmcdScopedValues } from './readScopedValues.ts'
import { readScopedValues } from './readScopedValues.ts'
import { replaceCmcdParam } from './replaceCmcdParam.ts'
import { toBareValue } from './toBareValue.ts'
import { toPreparedCmcdHeaders } from './toPreparedCmcdHeaders.ts'
import { toResponseKeys } from './toResponseKeys.ts'
import { toTokenString } from './toTokenString.ts'

type KeyFilter = CmcdEncodeOptions['filter']

type Waiting = {
	bs: string[];
	bsd: unknown[];
	ec: unknown[];
}

type Destination = {
	sn: number;
	msdSent: boolean;
	waiting: Waiting;
}

type Draft = Pick<Destination, 'sn' | 'msdSent' | 'waiting'>

type Target = {
	url: string;
	destination: Destination;
	events: readonly CmcdEventType[];
	keys: KeyFilter;
	batchSize: number;
	filter?: CmcdReportFilter;
	queue: string[];
	inFlight: boolean;
	flushPending: boolean;
}

const CMCD_HEADER = /^cmcd-(object|request|session|status)$/i

function toKeyFilter(keys: readonly CmcdKey[] | undefined): KeyFilter {
	if (!keys) {
		return undefined
	}

	const set = new Set<string>(keys)

	return (key) => set.has(key)
}

function withoutScopedKeys({ msd, bs, bsd, ec, ...data }: Cmcd): Cmcd {
	return data
}

function createDestination(): Destination {
	return { sn: 0, msdSent: false, waiting: { bs: [], bsd: [], ec: [] } }
}

function defaultRequester(request: HttpRequest): Promise<{ status: number; }> {
	const { url, ...init } = request

	return fetch(url, init)
}

/**
 * Creates a CMCD session. One session reports one `sid`.
 *
 * Request mode is one destination. Each event target URL is one destination.
 * Each destination has its own sequence number.
 * The player passes its CMCD data with each call and decides itself when its state changes.
 *
 * @param config - The configuration of the session.
 * @param requester - Sends each batch of event reports. The default requester uses `fetch`.
 * @returns The session.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/createCmcdSession.test.ts#example}
 */
export function createCmcdSession(config: CmcdSessionConfig = {}, requester: (request: HttpRequest) => Promise<{ status: number; }> = defaultRequester): CmcdSession {
	const sid = config.sid ?? uuid()
	const timeOrigin = performance.timeOrigin || Date.now() - performance.now()
	const settings: CmcdRequestReportConfig = {
		version: config.version,
		transmissionMode: config.transmissionMode,
		enabledKeys: config.enabledKeys,
		customHeaderMap: config.customHeaderMap,
	}
	const requestDestination = createDestination()
	const destinations: Destination[] = [requestDestination]
	const urls = new Map<string, Destination>()
	const targets: Target[] = []
	let requestKeys = toKeyFilter(settings.enabledKeys)
	let msd: number | undefined

	for (const target of config.eventTargets ?? []) {
		let destination = urls.get(target.url)

		if (!destination) {
			destination = createDestination()
			urls.set(target.url, destination)
			destinations.push(destination)
		}

		targets.push({
			url: target.url,
			destination,
			events: [...(target.events ?? [])],
			keys: toKeyFilter(target.enabledKeys),
			batchSize: target.batchSize ?? 1,
			filter: target.filter,
			queue: [],
			inFlight: false,
			flushPending: false,
		})
	}

	function draftOf(drafts: Map<Destination, Draft>, destination: Destination): Draft {
		let draft = drafts.get(destination)

		if (!draft) {
			draft = { sn: destination.sn, msdSent: destination.msdSent, waiting: { ...destination.waiting } }
			drafts.set(destination, draft)
		}

		return draft
	}

	function build(draft: Draft, base: Cmcd, scoped: CmcdScopedValues, reportingMode: CmcdReportingMode, version: CmcdVersion, keys: KeyFilter, baseUrl?: string): Cmcd {
		const { waiting } = draft
		const values: Record<string, unknown> = { ...base, cid: base.cid ?? config.cid, msd: draft.msdSent ? undefined : msd ?? scoped.msd }

		if (waiting.bs.length) {
			const ot = toTokenString(base.ot)
			const kept = ot === undefined ? [] : waiting.bs.filter((type) => type !== '' && type !== ot)

			if (kept.length < waiting.bs.length) {
				values['bs'] = true
			}

			waiting.bs = kept
		}

		if (waiting.bsd.length) {
			values['bsd'] = [...waiting.bsd, ...(scoped.bsd ?? [])]
			waiting.bsd = []
		}

		if (waiting.ec.length) {
			values['ec'] = [...waiting.ec, ...(scoped.ec ?? [])]
			waiting.ec = []
		}

		values['sid'] = sid
		values['sn'] = draft.sn++

		const prepared = prepareCmcdData(values, { version, reportingMode, filter: keys, baseUrl })

		draft.msdSent ||= prepared.msd !== undefined

		return prepared
	}

	function commit(drafts: Map<Destination, Draft>, scoped: CmcdScopedValues): void {
		msd ??= scoped.msd

		for (const destination of destinations) {
			const draft = drafts.get(destination)

			if (draft) {
				Object.assign(destination, draft)
			}
			else {
				const { waiting } = destination

				if (scoped.bs !== undefined) {
					waiting.bs.push(scoped.bs)
				}

				if (scoped.bsd) {
					waiting.bsd.push(...scoped.bsd)
				}

				if (scoped.ec) {
					waiting.ec.push(...scoped.ec)
				}
			}
		}
	}

	function isReady(target: Target): boolean {
		return target.queue.length >= target.batchSize
	}

	function send(target: Target, force?: boolean): void {
		if (target.inFlight) {
			target.flushPending ||= force === true
			return
		}

		if (!target.queue.length) {
			return
		}

		target.inFlight = true

		const lines = target.queue.splice(0)
		const request: HttpRequest = { url: target.url, method: 'POST', headers: { 'Content-Type': CMCD_MIME_TYPE }, body: lines.join('\n') }

		const settle = (): void => {
			target.inFlight = false

			if (target.flushPending) {
				target.flushPending = false
				send(target, true)
			}
			else if (isReady(target)) {
				send(target)
			}
		}

		new Promise<{ status: number; }>((resolve) => resolve(requester(request))).then(settle, settle)
	}

	function emit(type: CmcdEventType, data: Cmcd, request?: DeepReadonly<HttpRequest>, ec?: readonly string[]): void {
		const report: Cmcd = { ...data, e: type, ts: data.ts ?? Date.now() }

		// CTA-5004-B: a b event without bg is the exit from backgrounded mode.
		if (type === CMCD_EVENT_BACKGROUNDED_MODE && toBareValue(report.bg) === false) {
			delete report.bg
		}

		const scoped = readScopedValues(report, ec)
		const selected = targets.filter((target) => target.events.includes(type) && (!target.filter || target.filter(report, request)))
		const drafts = new Map<Destination, Draft>()
		const lines = selected.map((target) => encodePreparedCmcd(build(draftOf(drafts, target.destination), report, scoped, CMCD_EVENT_MODE, CMCD_V2, target.keys)))

		commit(drafts, scoped)

		selected.forEach((target, i) => {
			target.queue.push(lines[i])

			if (isReady(target)) {
				send(target)
			}
		})
	}

	return {
		sid,

		createRequestReport<R extends HttpRequest>(request: R, data: Cmcd = {}): R & CmcdRequestReport<R['customData']> {
			const scoped = readScopedValues(data)
			const drafts = new Map<Destination, Draft>()
			const cmcd = build(draftOf(drafts, requestDestination), data, scoped, CMCD_REQUEST_MODE, settings.version ?? CMCD_V2, requestKeys, request.url)
			const source = request.headers ?? {}
			const replace = settings.transmissionMode === CMCD_HEADERS
			const headers: Record<string, string> = {}
			let url = request.url

			for (const name in source) {
				if (!replace || !CMCD_HEADER.test(name)) {
					headers[name] = source[name]
				}
			}

			if (replace) {
				Object.assign(headers, toPreparedCmcdHeaders(cmcd, settings.customHeaderMap))
			}
			else {
				url = replaceCmcdParam(url, encodePreparedCmcd(cmcd))
			}

			commit(drafts, scoped)

			return { ...request, url, headers, customData: { ...request.customData, cmcd } } as R & CmcdRequestReport<R['customData']>
		},

		recordEvent(type, data = {}, request) {
			emit(type, data, request)
		},

		recordResponseReceived(response, data = {}) {
			const requestData = withoutScopedKeys(response.request.customData?.cmcd ?? {})

			emit(CMCD_EVENT_RESPONSE_RECEIVED, { ...requestData, ...toResponseKeys(response, timeOrigin), ...data }, response.request)
		},

		recordError(codes, data = {}) {
			const ec = typeof codes === 'string' ? [codes] : [...codes]

			emit(CMCD_EVENT_ERROR, { ...data, ec }, undefined, ec)
		},

		configure(next) {
			Object.assign(settings, next)
			requestKeys = toKeyFilter(settings.enabledKeys)
		},

		flush() {
			for (const target of targets) {
				send(target, true)
			}
		},
	}
}
```

- [ ] **Step 5: Build, run the checks, and confirm that they pass**

```bash
npm run build -w libs/cmcd
node --no-warnings --test libs/cmcd/test/toResponseKeys.test.ts libs/cmcd/test/createCmcdSession.responses.test.ts
npm test -w libs/cmcd
npm run typecheck
npx eslint libs/cmcd
```

Expected: the 7 tests of the two files pass, and every package test passes. The typecheck and ESLint report nothing.

- [ ] **Step 6: Commit**

```bash
git add libs/cmcd/src/toResponseKeys.ts libs/cmcd/src/CmcdSession.ts libs/cmcd/src/createCmcdSession.ts libs/cmcd/config/cml-cmcd.api.md libs/cmcd/test/toResponseKeys.test.ts libs/cmcd/test/createCmcdSession.responses.test.ts
git commit -s -m "feat(cmcd): record responses in the CMCD session" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 6: Delivery

**Files:**
- Modify: `libs/cmcd/src/CmcdSession.ts`, `libs/cmcd/src/createCmcdSession.ts`
- Test: `libs/cmcd/test/createCmcdSession.delivery.test.ts`

**Interfaces:**
- Consumes: `send()` and `emit()` from Task 5.
- Produces: the delivery rules of the RFC. A 2xx response resets the wait. A 410 stops every target with the URL. A 429, a 5xx, a rejection, or a requester that throws returns the batch to the queue. The target then waits 1 to 60 seconds. Any other status drops the batch. An `e` report makes its target send. Internal: `stopDestination()`, and the target fields `urgent`, `delay`, and `retry`.

- [ ] **Step 1: Write the failing test**

Create `libs/cmcd/test/createCmcdSession.delivery.test.ts`:

```ts
import type { CmcdSessionConfig } from '@svta/cml-cmcd'
import { CmcdEventType, CmcdPlayerState, createCmcdSession } from '@svta/cml-cmcd'
import type { HttpRequest } from '@svta/cml-utils'
import { deepEqual, equal } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

const A = 'https://a.test/cmcd'
const B = 'https://b.test/cmcd'
const ts = 1000

type Reply = number | 'reject' | 'throw'

function settle(): Promise<void> {
	return new Promise((resolve) => setImmediate(resolve))
}

function setup(config: CmcdSessionConfig, reply: Reply | (() => Reply) = 200) {
	const posts: HttpRequest[] = []
	const session = createCmcdSession({ sid: 's1', ...config }, (request) => {
		posts.push(request)
		const result = typeof reply === 'function' ? reply() : reply

		if (result === 'throw') {
			throw new Error('requester failed')
		}

		return result === 'reject' ? Promise.reject(new Error('network')) : Promise.resolve({ status: result })
	})
	const lines = (index: number): string[] => String(posts[index].body).split('\n')

	return { session, posts, lines }
}

function setupManual(config: CmcdSessionConfig) {
	const posts: HttpRequest[] = []
	const replies: ((status: number) => void)[] = []
	const session = createCmcdSession({ sid: 's1', ...config }, (request) => new Promise((resolve) => {
		posts.push(request)
		replies.push((status) => resolve({ status }))
	}))
	const lines = (index: number): string[] => String(posts[index].body).split('\n')

	return { session, posts, replies, lines }
}

describe('createCmcdSession delivery', () => {
	beforeEach(() => mock.timers.enable({ apis: ['setTimeout', 'Date'], now: ts }))
	afterEach(() => mock.timers.reset())

	it('provides a valid example', () => {
		// #region example
		const bodies: string[] = []
		const session = createCmcdSession({
			eventTargets: [{
				url: 'https://collector.example.com/cmcd',
				events: [CmcdEventType.PLAY_STATE],
				batchSize: 10,
			}],
		}, async (request) => {
			bodies.push(String(request.body))
			return { status: 200 }
		})

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.PLAYING })
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.PAUSED })
		session.flush()

		equal(bodies.length, 1)
		equal(bodies[0].split('\n').length, 2)
		// #endregion example
	})

	it('sends at once when an e report joins the queue', () => {
		const { session, posts, lines } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE, CmcdEventType.ERROR], batchSize: 10 }] })

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		equal(posts.length, 0)
		session.recordError('NET')

		equal(posts.length, 1)
		deepEqual(lines(0), [`e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`, `e=e,ec=("NET"),sid="s1",sn=1,ts=${ts},v=2`])
	})

	it('drops a batch on a status other than 2xx, 410, 429, or 5xx', async () => {
		const { session, posts } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }] }, 404)

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		await settle()
		session.flush()
		mock.timers.tick(60_000)

		equal(posts.length, 1)
	})

	for (const reply of [429, 500, 503, 'reject', 'throw'] as const) {
		it(`returns the batch to the queue after ${reply}, and waits 1 second, doubling to 60 seconds`, async () => {
			let current: Reply = reply
			const { session, posts, lines } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE, CmcdEventType.ERROR] }] }, () => current)

			const wait = async (ms: number, expected: number): Promise<void> => {
				mock.timers.tick(ms - 1)
				await settle()
				equal(posts.length, expected - 1)
				mock.timers.tick(1)
				await settle()
				equal(posts.length, expected)
			}

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
			await settle()
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
			session.recordError('NET')
			equal(posts.length, 1)
			await wait(1000, 2)
			equal(lines(1).length, 3)

			let expected = 2
			for (const ms of [2000, 4000, 8000, 16_000, 32_000, 60_000, 60_000]) {
				await wait(ms, ++expected)
			}

			current = 200
			await wait(60_000, ++expected)
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

			equal(posts.length, expected + 1)
		})
	}

	it('keeps every line while the collector fails', async () => {
		const { session, posts } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }] }, 429)

		for (let i = 0; i < 700; i++) {
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: i % 2 ? 'p' : 'a' })
		}
		await settle()
		session.flush()

		equal(posts.length, 2)
		equal(String(posts[1].body).split('\n').length, 700)
	})

	it('sends at once on flush() during a wait', async () => {
		const { session, posts } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }] }, 503)

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		await settle()
		session.flush()

		equal(posts.length, 2)
	})

	it('sends after the response on flush() during a POST, also after a failure', async () => {
		const { session, posts, replies, lines } = setupManual({ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE], batchSize: 10 }] })

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		session.flush()
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
		session.flush()
		equal(posts.length, 1)
		replies[0](503)
		await settle()

		equal(posts.length, 2)
		deepEqual(lines(1), [`e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`, `e=ps,sid="s1",sn=1,sta=a,ts=${ts},v=2`])
	})

	it('stops every target with a URL after a 410, and drops a batch in flight to that URL', async () => {
		const { session, posts, replies } = setupManual({
			eventTargets: [
				{ url: A, events: [CmcdEventType.PLAY_STATE] },
				{ url: A, events: [CmcdEventType.PLAY_STATE, CmcdEventType.ERROR] },
				{ url: B, events: [CmcdEventType.PLAY_STATE] },
			],
		})

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		equal(posts.length, 3)
		replies[0](410)
		replies[1](503)
		replies[2](200)
		await settle()
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a', bs: true })
		session.recordError('NET')
		session.flush()
		mock.timers.tick(60_000)
		await settle()

		deepEqual(posts.map((post) => post.url), [A, A, B, B])
		equal(posts[3].body, `bs,e=ps,sid="s1",sn=1,sta=a,ts=${ts},v=2`)
	})
})
```

- [ ] **Step 2: Build, run the test, and confirm that it fails**

```bash
npm run build -w libs/cmcd
node --no-warnings --test libs/cmcd/test/createCmcdSession.delivery.test.ts
```

Expected: FAIL. 10 of 12 tests fail with assertion errors, for example `0 == 1` and `2 == 1`.

- [ ] **Step 3: Update the type and the implementation**

Replace the content of `libs/cmcd/src/CmcdSession.ts` with:

```ts
import type { HttpRequest, HttpResponse } from '@svta/cml-utils'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'

/**
 * A CMCD session. One session reports one `sid`.
 *
 * The session keeps only the state that CTA-5004-B scopes to a session or to a destination.
 * The player passes its CMCD data with each call.
 *
 * @public
 */
export type CmcdSession = {
	/**
	 * The session ID of every report.
	 */
	readonly sid: string;

	/**
	 * Returns a copy of the request with a CMCD request report.
	 *
	 * In query mode, the session removes every `CMCD` parameter of the URL and adds one.
	 * In header mode, the session replaces the CMCD headers.
	 * `customData.cmcd` holds the report data before encoding.
	 * Each call advances the sequence number of request mode.
	 *
	 * @param request - The request to report.
	 * @param data - The CMCD data of the request.
	 * @returns A copy of the request with the report.
	 *
	 * @throws If a value cannot be encoded. The call then changes no state.
	 */
	createRequestReport<R extends HttpRequest>(request: R, data?: Cmcd): R & CmcdRequestReport<R['customData']>;

	/**
	 * Records an event report for each selected event target.
	 *
	 * A target is selected when it lists the event type, no 410 response stopped it, and its `filter` returns `true`.
	 *
	 * @param type - The event type.
	 * @param data - The CMCD data of the event.
	 * @param request - A request for the filters.
	 *
	 * @throws If a filter throws, or if a value cannot be encoded. The call then changes no state.
	 *
	 * @example
	 * {@includeCode ../test/createCmcdSession.events.test.ts#example}
	 */
	recordEvent(type: CmcdEventType, data?: Cmcd, request?: Readonly<HttpRequest>): void;

	/**
	 * Records an `rr` report for a response.
	 *
	 * The session derives `url` without the `CMCD` parameter, and `rc` from `status`.
	 * It derives `ts`, `ttfb`, and `ttlb` from `resourceTiming`.
	 * It adds the request-time data from `customData.cmcd`, without `msd`, `bs`, `bsd`, and `ec`.
	 * The `data` argument overrides the derived keys.
	 *
	 * @param response - The response. Its `request` is the request report.
	 * @param data - The keys that override the derived keys.
	 *
	 * @throws If a filter throws, or if a value cannot be encoded. The call then changes no state.
	 *
	 * @example
	 * {@includeCode ../test/createCmcdSession.responses.test.ts#example}
	 */
	recordResponseReceived(response: HttpResponse, data?: Cmcd): void;

	/**
	 * Records an error.
	 *
	 * Each selected target that lists `e` sends an `e` report with `ec` at once.
	 * Every other destination sends the codes with its next report.
	 *
	 * @param codes - The error codes.
	 * @param data - The CMCD data of the error report.
	 *
	 * @throws If a filter throws, or if a value cannot be encoded. The call then changes no state.
	 *
	 * @example
	 * {@includeCode ../test/createCmcdSession.errors.test.ts#example}
	 */
	recordError(codes: string | readonly string[], data?: Cmcd): void;

	/**
	 * Replaces the request mode settings: `version`, `transmissionMode`, `enabledKeys`, and `customHeaderMap`.
	 * The `sid` and every sequence number stay.
	 *
	 * @param settings - The new settings.
	 */
	configure(settings: CmcdRequestReportConfig): void;

	/**
	 * Sends the queue of each event target at once, also during a wait.
	 * If a POST is in flight, the target sends after its response.
	 *
	 * @example
	 * {@includeCode ../test/createCmcdSession.delivery.test.ts#example}
	 */
	flush(): void;
}
```

Replace the content of `libs/cmcd/src/createCmcdSession.ts` with:

```ts
import type { DeepReadonly, HttpRequest } from '@svta/cml-utils'
import { uuid } from '@svta/cml-utils'
import { CMCD_MIME_TYPE } from './CMCD_MIME_TYPE.ts'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import { CMCD_EVENT_BACKGROUNDED_MODE, CMCD_EVENT_ERROR, CMCD_EVENT_RESPONSE_RECEIVED } from './CmcdEventType.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdReportFilter } from './CmcdReportFilter.ts'
import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import { CMCD_EVENT_MODE, CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'
import type { CmcdSession } from './CmcdSession.ts'
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { CMCD_HEADERS } from './CmcdTransmissionMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'
import { encodePreparedCmcd } from './encodePreparedCmcd.ts'
import { prepareCmcdData } from './prepareCmcdData.ts'
import type { CmcdScopedValues } from './readScopedValues.ts'
import { readScopedValues } from './readScopedValues.ts'
import { replaceCmcdParam } from './replaceCmcdParam.ts'
import { toBareValue } from './toBareValue.ts'
import { toPreparedCmcdHeaders } from './toPreparedCmcdHeaders.ts'
import { toResponseKeys } from './toResponseKeys.ts'
import { toTokenString } from './toTokenString.ts'

type KeyFilter = CmcdEncodeOptions['filter']

type Waiting = {
	bs: string[];
	bsd: unknown[];
	ec: unknown[];
}

type Destination = {
	sn: number;
	msdSent: boolean;
	waiting: Waiting;
	gone: boolean;
	targets: Target[];
}

type Draft = Pick<Destination, 'sn' | 'msdSent' | 'waiting'>

type Target = {
	url: string;
	destination: Destination;
	events: readonly CmcdEventType[];
	keys: KeyFilter;
	batchSize: number;
	filter?: CmcdReportFilter;
	queue: string[];
	urgent: boolean;
	inFlight: boolean;
	flushPending: boolean;
	delay: number;
	retry?: ReturnType<typeof setTimeout>;
}

const MIN_DELAY = 1000
const MAX_DELAY = 60_000
const CMCD_HEADER = /^cmcd-(object|request|session|status)$/i

function toKeyFilter(keys: readonly CmcdKey[] | undefined): KeyFilter {
	if (!keys) {
		return undefined
	}

	const set = new Set<string>(keys)

	return (key) => set.has(key)
}

function withoutScopedKeys({ msd, bs, bsd, ec, ...data }: Cmcd): Cmcd {
	return data
}

function createDestination(): Destination {
	return { sn: 0, msdSent: false, waiting: { bs: [], bsd: [], ec: [] }, gone: false, targets: [] }
}

function defaultRequester(request: HttpRequest): Promise<{ status: number; }> {
	const { url, ...init } = request

	return fetch(url, init)
}

/**
 * Creates a CMCD session. One session reports one `sid`.
 *
 * Request mode is one destination. Each event target URL is one destination.
 * Each destination has its own sequence number.
 * The player passes its CMCD data with each call and decides itself when its state changes.
 *
 * @param config - The configuration of the session.
 * @param requester - Sends each batch of event reports. The default requester uses `fetch`.
 * @returns The session.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/createCmcdSession.test.ts#example}
 */
export function createCmcdSession(config: CmcdSessionConfig = {}, requester: (request: HttpRequest) => Promise<{ status: number; }> = defaultRequester): CmcdSession {
	const sid = config.sid ?? uuid()
	const timeOrigin = performance.timeOrigin || Date.now() - performance.now()
	const settings: CmcdRequestReportConfig = {
		version: config.version,
		transmissionMode: config.transmissionMode,
		enabledKeys: config.enabledKeys,
		customHeaderMap: config.customHeaderMap,
	}
	const requestDestination = createDestination()
	const destinations: Destination[] = [requestDestination]
	const urls = new Map<string, Destination>()
	const targets: Target[] = []
	let requestKeys = toKeyFilter(settings.enabledKeys)
	let msd: number | undefined

	for (const target of config.eventTargets ?? []) {
		let destination = urls.get(target.url)

		if (!destination) {
			destination = createDestination()
			urls.set(target.url, destination)
			destinations.push(destination)
		}

		const state: Target = {
			url: target.url,
			destination,
			events: [...(target.events ?? [])],
			keys: toKeyFilter(target.enabledKeys),
			batchSize: target.batchSize ?? 1,
			filter: target.filter,
			queue: [],
			urgent: false,
			inFlight: false,
			flushPending: false,
			delay: 0,
		}

		destination.targets.push(state)
		targets.push(state)
	}

	function draftOf(drafts: Map<Destination, Draft>, destination: Destination): Draft {
		let draft = drafts.get(destination)

		if (!draft) {
			draft = { sn: destination.sn, msdSent: destination.msdSent, waiting: { ...destination.waiting } }
			drafts.set(destination, draft)
		}

		return draft
	}

	function build(draft: Draft, base: Cmcd, scoped: CmcdScopedValues, reportingMode: CmcdReportingMode, version: CmcdVersion, keys: KeyFilter, baseUrl?: string): Cmcd {
		const { waiting } = draft
		const values: Record<string, unknown> = { ...base, cid: base.cid ?? config.cid, msd: draft.msdSent ? undefined : msd ?? scoped.msd }

		if (waiting.bs.length) {
			const ot = toTokenString(base.ot)
			const kept = ot === undefined ? [] : waiting.bs.filter((type) => type !== '' && type !== ot)

			if (kept.length < waiting.bs.length) {
				values['bs'] = true
			}

			waiting.bs = kept
		}

		if (waiting.bsd.length) {
			values['bsd'] = [...waiting.bsd, ...(scoped.bsd ?? [])]
			waiting.bsd = []
		}

		if (waiting.ec.length) {
			values['ec'] = [...waiting.ec, ...(scoped.ec ?? [])]
			waiting.ec = []
		}

		values['sid'] = sid
		values['sn'] = draft.sn++

		const prepared = prepareCmcdData(values, { version, reportingMode, filter: keys, baseUrl })

		draft.msdSent ||= prepared.msd !== undefined

		return prepared
	}

	function commit(drafts: Map<Destination, Draft>, scoped: CmcdScopedValues): void {
		msd ??= scoped.msd

		for (const destination of destinations) {
			const draft = drafts.get(destination)

			if (draft) {
				Object.assign(destination, draft)
			}
			else if (!destination.gone) {
				const { waiting } = destination

				if (scoped.bs !== undefined) {
					waiting.bs.push(scoped.bs)
				}

				if (scoped.bsd) {
					waiting.bsd.push(...scoped.bsd)
				}

				if (scoped.ec) {
					waiting.ec.push(...scoped.ec)
				}
			}
		}
	}

	function stopDestination(destination: Destination): void {
		destination.gone = true
		destination.waiting = { bs: [], bsd: [], ec: [] }

		for (const target of destination.targets) {
			clearTimeout(target.retry)
			target.retry = undefined
			target.queue.length = 0
			target.urgent = false
			target.flushPending = false
		}
	}

	function isReady(target: Target): boolean {
		return target.queue.length >= target.batchSize || target.urgent
	}

	function send(target: Target, force?: boolean): void {
		if (target.inFlight) {
			target.flushPending ||= force === true
			return
		}

		if (target.destination.gone || !target.queue.length || (target.retry !== undefined && !force)) {
			return
		}

		clearTimeout(target.retry)
		target.retry = undefined
		target.inFlight = true

		const lines = target.queue.splice(0)
		const urgent = target.urgent
		const request: HttpRequest = { url: target.url, method: 'POST', headers: { 'Content-Type': CMCD_MIME_TYPE }, body: lines.join('\n') }

		target.urgent = false

		const settle = (status?: number): void => {
			target.inFlight = false

			if (status === 410) {
				stopDestination(target.destination)
				return
			}

			if (target.destination.gone) {
				return
			}

			// CTA-5004-B: back off after a 429 or 5xx response.
			const failed = status === undefined || status === 429 || (status >= 500 && status < 600)

			if (failed) {
				target.queue.unshift(...lines)
				target.urgent ||= urgent
				target.delay = Math.min(target.delay * 2 || MIN_DELAY, MAX_DELAY)
				target.retry = setTimeout(() => {
					target.retry = undefined
					send(target)
				}, target.delay)
			}
			else {
				target.delay = 0
			}

			if (target.flushPending) {
				target.flushPending = false
				send(target, true)
			}
			else if (!failed && isReady(target)) {
				send(target)
			}
		}

		new Promise<{ status: number; }>((resolve) => resolve(requester(request))).then((response) => settle(response?.status ?? 0), () => settle())
	}

	function emit(type: CmcdEventType, data: Cmcd, request?: DeepReadonly<HttpRequest>, ec?: readonly string[]): void {
		const report: Cmcd = { ...data, e: type, ts: data.ts ?? Date.now() }

		// CTA-5004-B: a b event without bg is the exit from backgrounded mode.
		if (type === CMCD_EVENT_BACKGROUNDED_MODE && toBareValue(report.bg) === false) {
			delete report.bg
		}

		const scoped = readScopedValues(report, ec)
		const selected = targets.filter((target) => target.events.includes(type) && !target.destination.gone && (!target.filter || target.filter(report, request)))
		const drafts = new Map<Destination, Draft>()
		const lines = selected.map((target) => encodePreparedCmcd(build(draftOf(drafts, target.destination), report, scoped, CMCD_EVENT_MODE, CMCD_V2, target.keys)))

		commit(drafts, scoped)

		selected.forEach((target, i) => {
			target.queue.push(lines[i])
			target.urgent ||= type === CMCD_EVENT_ERROR

			if (isReady(target)) {
				send(target)
			}
		})
	}

	return {
		sid,

		createRequestReport<R extends HttpRequest>(request: R, data: Cmcd = {}): R & CmcdRequestReport<R['customData']> {
			const scoped = readScopedValues(data)
			const drafts = new Map<Destination, Draft>()
			const cmcd = build(draftOf(drafts, requestDestination), data, scoped, CMCD_REQUEST_MODE, settings.version ?? CMCD_V2, requestKeys, request.url)
			const source = request.headers ?? {}
			const replace = settings.transmissionMode === CMCD_HEADERS
			const headers: Record<string, string> = {}
			let url = request.url

			for (const name in source) {
				if (!replace || !CMCD_HEADER.test(name)) {
					headers[name] = source[name]
				}
			}

			if (replace) {
				Object.assign(headers, toPreparedCmcdHeaders(cmcd, settings.customHeaderMap))
			}
			else {
				url = replaceCmcdParam(url, encodePreparedCmcd(cmcd))
			}

			commit(drafts, scoped)

			return { ...request, url, headers, customData: { ...request.customData, cmcd } } as R & CmcdRequestReport<R['customData']>
		},

		recordEvent(type, data = {}, request) {
			emit(type, data, request)
		},

		recordResponseReceived(response, data = {}) {
			const requestData = withoutScopedKeys(response.request.customData?.cmcd ?? {})

			emit(CMCD_EVENT_RESPONSE_RECEIVED, { ...requestData, ...toResponseKeys(response, timeOrigin), ...data }, response.request)
		},

		recordError(codes, data = {}) {
			const ec = typeof codes === 'string' ? [codes] : [...codes]

			emit(CMCD_EVENT_ERROR, { ...data, ec }, undefined, ec)
		},

		configure(next) {
			Object.assign(settings, next)
			requestKeys = toKeyFilter(settings.enabledKeys)
		},

		flush() {
			for (const target of targets) {
				send(target, true)
			}
		},
	}
}
```

- [ ] **Step 4: Build, run the checks, and confirm that they pass**

```bash
npm run build -w libs/cmcd
node --no-warnings --test libs/cmcd/test/createCmcdSession.delivery.test.ts
npm test -w libs/cmcd
npm run typecheck
npx eslint libs/cmcd
```

Expected: the 12 tests of the file pass, and every package test passes. The typecheck and ESLint report nothing. The API report does not change, because the task changes only TSDoc in the public types.

- [ ] **Step 5: Commit**

```bash
git add libs/cmcd/src/CmcdSession.ts libs/cmcd/src/createCmcdSession.ts libs/cmcd/test/createCmcdSession.delivery.test.ts
git commit -s -m "feat(cmcd): back off and stop on the responses of a collector" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 7: Timers

**Files:**
- Modify: `libs/cmcd/src/CmcdSessionConfig.ts`, `libs/cmcd/src/CmcdSession.ts`, `libs/cmcd/src/createCmcdSession.ts`, and the regenerated `libs/cmcd/config/cml-cmcd.api.md`
- Test: `libs/cmcd/test/createCmcdSession.timers.test.ts`

**Interfaces:**
- Consumes: `emit()` and `send()` from Task 6.
- Produces: `start(immediate?: boolean): void`, `stop(): void`, `CmcdSessionConfig.snapshot`, and the use of `CmcdEventReportConfig.interval`, which already exists. `emit()` gains the parameter `candidates` before `ec`.

- [ ] **Step 1: Write the failing test**

Create `libs/cmcd/test/createCmcdSession.timers.test.ts`:

```ts
import type { Cmcd, CmcdSessionConfig } from '@svta/cml-cmcd'
import { CmcdEventType, CmcdPlayerState, CmcdStreamType, createCmcdSession } from '@svta/cml-cmcd'
import type { HttpRequest } from '@svta/cml-utils'
import { deepEqual, equal, ok, throws } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

const A = 'https://a.test/cmcd'
const B = 'https://b.test/cmcd'
const ts = 1000

function settle(): Promise<void> {
	return new Promise((resolve) => setImmediate(resolve))
}

function setup(config: CmcdSessionConfig, status = 200) {
	const posts: HttpRequest[] = []
	const session = createCmcdSession({ sid: 's1', ...config }, async (request) => {
		posts.push(request)
		return { status }
	})
	const lines = (index: number): string[] => String(posts[index].body).split('\n')

	return { session, posts, lines }
}

describe('createCmcdSession timers', () => {
	const state: Cmcd = { sta: 'p' }

	beforeEach(() => mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: ts }))
	afterEach(() => mock.timers.reset())

	it('provides a valid example', () => {
		// #region example
		const bodies: string[] = []
		let playerState: Cmcd['sta'] = CmcdPlayerState.STARTING

		const data = (): Cmcd => ({ st: CmcdStreamType.VOD, sta: playerState, bl: [21300] })

		const session = createCmcdSession({
			cid: 'movie-42',
			eventTargets: [{
				url: 'https://collector.example.com/cmcd',
				events: [CmcdEventType.PLAY_STATE, CmcdEventType.TIME_INTERVAL],
				interval: 30,
				batchSize: 2,
			}],
			snapshot: data,
		}, async (request) => {
			bodies.push(String(request.body))
			return { status: 200 }
		})

		function setPlayerState(next: Cmcd['sta']): void {
			if (next === playerState) {
				return
			}

			playerState = next
			session.recordEvent(CmcdEventType.PLAY_STATE, data())
		}

		session.start()
		setPlayerState(CmcdPlayerState.PLAYING)
		setPlayerState(CmcdPlayerState.PLAYING)
		session.stop()

		const [interval, playing] = bodies[0].split('\n')
		ok(interval.includes('e=t') && interval.includes('sta=s'))
		ok(playing.includes('e=ps') && playing.includes('sta=p'))
		// #endregion example
	})

	it('sends the first t report on start() and one each interval, until stop()', async () => {
		const { session, posts, lines } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.TIME_INTERVAL], interval: 10 }], snapshot: () => state })

		session.start()
		equal(posts.length, 1)
		await settle()
		mock.timers.tick(9999)
		equal(posts.length, 1)
		mock.timers.tick(1)
		equal(posts.length, 2)
		session.stop()
		mock.timers.tick(60_000)

		equal(posts.length, 2)
		deepEqual(lines(1), [`e=t,sid="s1",sn=1,sta=p,ts=${ts + 10_000},v=2`])
	})

	it('waits one interval on start(false), and uses CMCD_DEFAULT_TIME_INTERVAL without an interval', () => {
		const { session, posts } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.TIME_INTERVAL] }], snapshot: () => state })

		session.start(false)
		mock.timers.tick(29_999)
		equal(posts.length, 0)
		mock.timers.tick(1)

		equal(posts.length, 1)
	})

	it('arms no timer without snapshot, for an interval of 0, or for a target without t', () => {
		const first = setup({ eventTargets: [{ url: A, events: [CmcdEventType.TIME_INTERVAL] }] })
		const second = setup({ eventTargets: [{ url: A, events: [CmcdEventType.TIME_INTERVAL], interval: 0 }], snapshot: () => state })
		const third = setup({ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }], snapshot: () => state })

		for (const { session } of [first, second, third]) {
			session.start()
		}
		mock.timers.tick(60_000)

		equal(first.posts.length + second.posts.length + third.posts.length, 0)
	})

	it('ticks each target at its own interval and applies its filter', async () => {
		const data: Cmcd = { sta: 'p' }
		const { session, posts } = setup({
			eventTargets: [
				{ url: A, events: [CmcdEventType.TIME_INTERVAL], interval: 10 },
				{ url: B, events: [CmcdEventType.TIME_INTERVAL], interval: 15, filter: (report) => report.sta === 'a' },
			],
			snapshot: () => data,
		})

		session.start(false)
		mock.timers.tick(10_000)
		await settle()
		data.sta = 'a'
		mock.timers.tick(5000)
		mock.timers.tick(5000)

		deepEqual(posts.map((post) => post.url), [A, B, A])
	})

	it('arms one timer for each target when start() runs twice', () => {
		const { session, posts } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.TIME_INTERVAL], interval: 10 }], snapshot: () => state })

		session.start(false)
		session.start(false)
		mock.timers.tick(10_000)

		equal(posts.length, 1)
	})

	it('gives an error of snapshot() to the timer callback', () => {
		const { session } = setup({
			eventTargets: [{ url: A, events: [CmcdEventType.TIME_INTERVAL], interval: 10 }],
			snapshot: () => {
				throw new Error('snapshot failed')
			},
		})

		session.start(false)

		throws(() => mock.timers.tick(10_000), /snapshot failed/)
		session.stop()
	})

	it('clears the wait on stop(), and a failure after stop() starts no timer', async () => {
		const { session, posts } = setup({ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }] }, 503)

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		await settle()
		session.stop()
		mock.timers.tick(300_000)
		await settle()
		equal(posts.length, 1)
		session.flush()
		await settle()
		mock.timers.tick(300_000)
		await settle()

		equal(posts.length, 2)
	})
})
```

- [ ] **Step 2: Build, run the test, and confirm that it fails**

```bash
npm run build -w libs/cmcd
node --no-warnings --test libs/cmcd/test/createCmcdSession.timers.test.ts
```

Expected: FAIL. The 8 tests fail with `TypeError`, because `start()` and `stop()` do not exist yet.

- [ ] **Step 3: Update the types**

Replace the content of `libs/cmcd/src/CmcdSessionConfig.ts` with:

```ts
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEventReportConfig } from './CmcdEventReportConfig.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'

/**
 * The configuration of a CMCD session.
 *
 * The members of {@link CmcdRequestReportConfig} are the request mode settings. `configure()` replaces them.
 *
 * @public
 */
export type CmcdSessionConfig = CmcdRequestReportConfig & {
	/**
	 * The session ID, a string of 1 to 64 characters.
	 *
	 * @defaultValue A new UUID
	 */
	sid?: string;

	/**
	 * The content ID of each report whose data has no `cid`. It has at most 128 characters.
	 */
	cid?: string;

	/**
	 * The event targets. They cannot change after the session is created.
	 * The targets with the same `url` form one destination.
	 * They share one sequence number, the `msd` rule, and the waiting values.
	 */
	eventTargets?: readonly CmcdEventReportConfig[];

	/**
	 * Returns the data of each `t` report. Without `snapshot`, `start()` arms no timer.
	 */
	snapshot?: () => Cmcd;
}
```

Replace the content of `libs/cmcd/src/CmcdSession.ts` with:

```ts
import type { HttpRequest, HttpResponse } from '@svta/cml-utils'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'

/**
 * A CMCD session. One session reports one `sid`.
 *
 * The session keeps only the state that CTA-5004-B scopes to a session or to a destination.
 * The player passes its CMCD data with each call.
 *
 * @public
 */
export type CmcdSession = {
	/**
	 * The session ID of every report.
	 */
	readonly sid: string;

	/**
	 * Returns a copy of the request with a CMCD request report.
	 *
	 * In query mode, the session removes every `CMCD` parameter of the URL and adds one.
	 * In header mode, the session replaces the CMCD headers.
	 * `customData.cmcd` holds the report data before encoding.
	 * Each call advances the sequence number of request mode.
	 *
	 * @param request - The request to report.
	 * @param data - The CMCD data of the request.
	 * @returns A copy of the request with the report.
	 *
	 * @throws If a value cannot be encoded. The call then changes no state.
	 */
	createRequestReport<R extends HttpRequest>(request: R, data?: Cmcd): R & CmcdRequestReport<R['customData']>;

	/**
	 * Records an event report for each selected event target.
	 *
	 * A target is selected when it lists the event type, no 410 response stopped it, and its `filter` returns `true`.
	 *
	 * @param type - The event type.
	 * @param data - The CMCD data of the event.
	 * @param request - A request for the filters.
	 *
	 * @throws If a filter throws, or if a value cannot be encoded. The call then changes no state.
	 *
	 * @example
	 * {@includeCode ../test/createCmcdSession.events.test.ts#example}
	 */
	recordEvent(type: CmcdEventType, data?: Cmcd, request?: Readonly<HttpRequest>): void;

	/**
	 * Records an `rr` report for a response.
	 *
	 * The session derives `url` without the `CMCD` parameter, and `rc` from `status`.
	 * It derives `ts`, `ttfb`, and `ttlb` from `resourceTiming`.
	 * It adds the request-time data from `customData.cmcd`, without `msd`, `bs`, `bsd`, and `ec`.
	 * The `data` argument overrides the derived keys.
	 *
	 * @param response - The response. Its `request` is the request report.
	 * @param data - The keys that override the derived keys.
	 *
	 * @throws If a filter throws, or if a value cannot be encoded. The call then changes no state.
	 *
	 * @example
	 * {@includeCode ../test/createCmcdSession.responses.test.ts#example}
	 */
	recordResponseReceived(response: HttpResponse, data?: Cmcd): void;

	/**
	 * Records an error.
	 *
	 * Each selected target that lists `e` sends an `e` report with `ec` at once.
	 * Every other destination sends the codes with its next report.
	 *
	 * @param codes - The error codes.
	 * @param data - The CMCD data of the error report.
	 *
	 * @throws If a filter throws, or if a value cannot be encoded. The call then changes no state.
	 *
	 * @example
	 * {@includeCode ../test/createCmcdSession.errors.test.ts#example}
	 */
	recordError(codes: string | readonly string[], data?: Cmcd): void;

	/**
	 * Replaces the request mode settings: `version`, `transmissionMode`, `enabledKeys`, and `customHeaderMap`.
	 * The `sid` and every sequence number stay.
	 *
	 * @param settings - The new settings.
	 */
	configure(settings: CmcdRequestReportConfig): void;

	/**
	 * Arms one timer for each event target that lists `t` and has an interval above 0.
	 *
	 * Each tick records a `t` report with the data from `snapshot()`.
	 * Without `snapshot`, the method arms nothing.
	 *
	 * @param immediate - If `true`, the default, the first `t` report goes out at once. If `false`, it waits one interval.
	 *
	 * @example
	 * {@includeCode ../test/createCmcdSession.timers.test.ts#example}
	 */
	start(immediate?: boolean): void;

	/**
	 * Clears the interval timers and the wait timers of the event targets.
	 * After `stop()`, a failed send starts no timer.
	 */
	stop(): void;

	/**
	 * Sends the queue of each event target at once, also during a wait.
	 * If a POST is in flight, the target sends after its response.
	 *
	 * @example
	 * {@includeCode ../test/createCmcdSession.delivery.test.ts#example}
	 */
	flush(): void;
}
```

- [ ] **Step 4: Write the implementation**

Replace the content of `libs/cmcd/src/createCmcdSession.ts` with:

```ts
import type { DeepReadonly, HttpRequest } from '@svta/cml-utils'
import { uuid } from '@svta/cml-utils'
import { CMCD_DEFAULT_TIME_INTERVAL } from './CMCD_DEFAULT_TIME_INTERVAL.ts'
import { CMCD_MIME_TYPE } from './CMCD_MIME_TYPE.ts'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import { CMCD_EVENT_BACKGROUNDED_MODE, CMCD_EVENT_ERROR, CMCD_EVENT_RESPONSE_RECEIVED, CMCD_EVENT_TIME_INTERVAL } from './CmcdEventType.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdReportFilter } from './CmcdReportFilter.ts'
import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import { CMCD_EVENT_MODE, CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'
import type { CmcdSession } from './CmcdSession.ts'
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { CMCD_HEADERS } from './CmcdTransmissionMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'
import { encodePreparedCmcd } from './encodePreparedCmcd.ts'
import { prepareCmcdData } from './prepareCmcdData.ts'
import type { CmcdScopedValues } from './readScopedValues.ts'
import { readScopedValues } from './readScopedValues.ts'
import { replaceCmcdParam } from './replaceCmcdParam.ts'
import { toBareValue } from './toBareValue.ts'
import { toPreparedCmcdHeaders } from './toPreparedCmcdHeaders.ts'
import { toResponseKeys } from './toResponseKeys.ts'
import { toTokenString } from './toTokenString.ts'

type KeyFilter = CmcdEncodeOptions['filter']

type Waiting = {
	bs: string[];
	bsd: unknown[];
	ec: unknown[];
}

type Destination = {
	sn: number;
	msdSent: boolean;
	waiting: Waiting;
	gone: boolean;
	targets: Target[];
}

type Draft = Pick<Destination, 'sn' | 'msdSent' | 'waiting'>

type Target = {
	url: string;
	destination: Destination;
	events: readonly CmcdEventType[];
	keys: KeyFilter;
	batchSize: number;
	interval: number;
	filter?: CmcdReportFilter;
	queue: string[];
	urgent: boolean;
	inFlight: boolean;
	flushPending: boolean;
	delay: number;
	retry?: ReturnType<typeof setTimeout>;
	timer?: ReturnType<typeof setInterval>;
}

const MIN_DELAY = 1000
const MAX_DELAY = 60_000
const CMCD_HEADER = /^cmcd-(object|request|session|status)$/i

function toKeyFilter(keys: readonly CmcdKey[] | undefined): KeyFilter {
	if (!keys) {
		return undefined
	}

	const set = new Set<string>(keys)

	return (key) => set.has(key)
}

function withoutScopedKeys({ msd, bs, bsd, ec, ...data }: Cmcd): Cmcd {
	return data
}

function createDestination(): Destination {
	return { sn: 0, msdSent: false, waiting: { bs: [], bsd: [], ec: [] }, gone: false, targets: [] }
}

function defaultRequester(request: HttpRequest): Promise<{ status: number; }> {
	const { url, ...init } = request

	return fetch(url, init)
}

/**
 * Creates a CMCD session. One session reports one `sid`.
 *
 * Request mode is one destination. Each event target URL is one destination.
 * Each destination has its own sequence number.
 * The player passes its CMCD data with each call and decides itself when its state changes.
 *
 * @param config - The configuration of the session.
 * @param requester - Sends each batch of event reports. The default requester uses `fetch`.
 * @returns The session.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/createCmcdSession.test.ts#example}
 */
export function createCmcdSession(config: CmcdSessionConfig = {}, requester: (request: HttpRequest) => Promise<{ status: number; }> = defaultRequester): CmcdSession {
	const sid = config.sid ?? uuid()
	const timeOrigin = performance.timeOrigin || Date.now() - performance.now()
	const settings: CmcdRequestReportConfig = {
		version: config.version,
		transmissionMode: config.transmissionMode,
		enabledKeys: config.enabledKeys,
		customHeaderMap: config.customHeaderMap,
	}
	const requestDestination = createDestination()
	const destinations: Destination[] = [requestDestination]
	const urls = new Map<string, Destination>()
	const targets: Target[] = []
	let requestKeys = toKeyFilter(settings.enabledKeys)
	let msd: number | undefined
	let stopped = false

	for (const target of config.eventTargets ?? []) {
		let destination = urls.get(target.url)

		if (!destination) {
			destination = createDestination()
			urls.set(target.url, destination)
			destinations.push(destination)
		}

		const state: Target = {
			url: target.url,
			destination,
			events: [...(target.events ?? [])],
			keys: toKeyFilter(target.enabledKeys),
			batchSize: target.batchSize ?? 1,
			interval: target.interval ?? CMCD_DEFAULT_TIME_INTERVAL,
			filter: target.filter,
			queue: [],
			urgent: false,
			inFlight: false,
			flushPending: false,
			delay: 0,
		}

		destination.targets.push(state)
		targets.push(state)
	}

	function draftOf(drafts: Map<Destination, Draft>, destination: Destination): Draft {
		let draft = drafts.get(destination)

		if (!draft) {
			draft = { sn: destination.sn, msdSent: destination.msdSent, waiting: { ...destination.waiting } }
			drafts.set(destination, draft)
		}

		return draft
	}

	function build(draft: Draft, base: Cmcd, scoped: CmcdScopedValues, reportingMode: CmcdReportingMode, version: CmcdVersion, keys: KeyFilter, baseUrl?: string): Cmcd {
		const { waiting } = draft
		const values: Record<string, unknown> = { ...base, cid: base.cid ?? config.cid, msd: draft.msdSent ? undefined : msd ?? scoped.msd }

		if (waiting.bs.length) {
			const ot = toTokenString(base.ot)
			const kept = ot === undefined ? [] : waiting.bs.filter((type) => type !== '' && type !== ot)

			if (kept.length < waiting.bs.length) {
				values['bs'] = true
			}

			waiting.bs = kept
		}

		if (waiting.bsd.length) {
			values['bsd'] = [...waiting.bsd, ...(scoped.bsd ?? [])]
			waiting.bsd = []
		}

		if (waiting.ec.length) {
			values['ec'] = [...waiting.ec, ...(scoped.ec ?? [])]
			waiting.ec = []
		}

		values['sid'] = sid
		values['sn'] = draft.sn++

		const prepared = prepareCmcdData(values, { version, reportingMode, filter: keys, baseUrl })

		draft.msdSent ||= prepared.msd !== undefined

		return prepared
	}

	function commit(drafts: Map<Destination, Draft>, scoped: CmcdScopedValues): void {
		msd ??= scoped.msd

		for (const destination of destinations) {
			const draft = drafts.get(destination)

			if (draft) {
				Object.assign(destination, draft)
			}
			else if (!destination.gone) {
				const { waiting } = destination

				if (scoped.bs !== undefined) {
					waiting.bs.push(scoped.bs)
				}

				if (scoped.bsd) {
					waiting.bsd.push(...scoped.bsd)
				}

				if (scoped.ec) {
					waiting.ec.push(...scoped.ec)
				}
			}
		}
	}

	function stopDestination(destination: Destination): void {
		destination.gone = true
		destination.waiting = { bs: [], bsd: [], ec: [] }

		for (const target of destination.targets) {
			clearInterval(target.timer)
			clearTimeout(target.retry)
			target.timer = undefined
			target.retry = undefined
			target.queue.length = 0
			target.urgent = false
			target.flushPending = false
		}
	}

	function isReady(target: Target): boolean {
		return target.queue.length >= target.batchSize || target.urgent
	}

	function send(target: Target, force?: boolean): void {
		if (target.inFlight) {
			target.flushPending ||= force === true
			return
		}

		if (target.destination.gone || !target.queue.length || (target.retry !== undefined && !force)) {
			return
		}

		clearTimeout(target.retry)
		target.retry = undefined
		target.inFlight = true

		const lines = target.queue.splice(0)
		const urgent = target.urgent
		const request: HttpRequest = { url: target.url, method: 'POST', headers: { 'Content-Type': CMCD_MIME_TYPE }, body: lines.join('\n') }

		target.urgent = false

		const settle = (status?: number): void => {
			target.inFlight = false

			if (status === 410) {
				stopDestination(target.destination)
				return
			}

			if (target.destination.gone) {
				return
			}

			// CTA-5004-B: back off after a 429 or 5xx response.
			const failed = status === undefined || status === 429 || (status >= 500 && status < 600)

			if (failed) {
				target.queue.unshift(...lines)
				target.urgent ||= urgent
				target.delay = Math.min(target.delay * 2 || MIN_DELAY, MAX_DELAY)

				if (!stopped) {
					target.retry = setTimeout(() => {
						target.retry = undefined
						send(target)
					}, target.delay)
				}
			}
			else {
				target.delay = 0
			}

			if (target.flushPending) {
				target.flushPending = false
				send(target, true)
			}
			else if (!failed && isReady(target)) {
				send(target)
			}
		}

		new Promise<{ status: number; }>((resolve) => resolve(requester(request))).then((response) => settle(response?.status ?? 0), () => settle())
	}

	function emit(type: CmcdEventType, data: Cmcd, request?: DeepReadonly<HttpRequest>, candidates: readonly Target[] = targets, ec?: readonly string[]): void {
		const report: Cmcd = { ...data, e: type, ts: data.ts ?? Date.now() }

		// CTA-5004-B: a b event without bg is the exit from backgrounded mode.
		if (type === CMCD_EVENT_BACKGROUNDED_MODE && toBareValue(report.bg) === false) {
			delete report.bg
		}

		const scoped = readScopedValues(report, ec)
		const selected = candidates.filter((target) => target.events.includes(type) && !target.destination.gone && (!target.filter || target.filter(report, request)))
		const drafts = new Map<Destination, Draft>()
		const lines = selected.map((target) => encodePreparedCmcd(build(draftOf(drafts, target.destination), report, scoped, CMCD_EVENT_MODE, CMCD_V2, target.keys)))

		commit(drafts, scoped)

		selected.forEach((target, i) => {
			target.queue.push(lines[i])
			target.urgent ||= type === CMCD_EVENT_ERROR

			if (isReady(target)) {
				send(target)
			}
		})
	}

	return {
		sid,

		createRequestReport<R extends HttpRequest>(request: R, data: Cmcd = {}): R & CmcdRequestReport<R['customData']> {
			const scoped = readScopedValues(data)
			const drafts = new Map<Destination, Draft>()
			const cmcd = build(draftOf(drafts, requestDestination), data, scoped, CMCD_REQUEST_MODE, settings.version ?? CMCD_V2, requestKeys, request.url)
			const source = request.headers ?? {}
			const replace = settings.transmissionMode === CMCD_HEADERS
			const headers: Record<string, string> = {}
			let url = request.url

			for (const name in source) {
				if (!replace || !CMCD_HEADER.test(name)) {
					headers[name] = source[name]
				}
			}

			if (replace) {
				Object.assign(headers, toPreparedCmcdHeaders(cmcd, settings.customHeaderMap))
			}
			else {
				url = replaceCmcdParam(url, encodePreparedCmcd(cmcd))
			}

			commit(drafts, scoped)

			return { ...request, url, headers, customData: { ...request.customData, cmcd } } as R & CmcdRequestReport<R['customData']>
		},

		recordEvent(type, data = {}, request) {
			emit(type, data, request)
		},

		recordResponseReceived(response, data = {}) {
			const requestData = withoutScopedKeys(response.request.customData?.cmcd ?? {})

			emit(CMCD_EVENT_RESPONSE_RECEIVED, { ...requestData, ...toResponseKeys(response, timeOrigin), ...data }, response.request)
		},

		recordError(codes, data = {}) {
			const ec = typeof codes === 'string' ? [codes] : [...codes]

			emit(CMCD_EVENT_ERROR, { ...data, ec }, undefined, targets, ec)
		},

		configure(next) {
			Object.assign(settings, next)
			requestKeys = toKeyFilter(settings.enabledKeys)
		},

		start(immediate = true) {
			const { snapshot } = config
			const ticks: (() => void)[] = []

			stopped = false

			for (const target of targets) {
				clearInterval(target.timer)
				target.timer = undefined

				if (snapshot && target.interval > 0 && !target.destination.gone && target.events.includes(CMCD_EVENT_TIME_INTERVAL)) {
					const tick = (): void => emit(CMCD_EVENT_TIME_INTERVAL, snapshot(), undefined, [target])

					target.timer = setInterval(tick, target.interval * 1000)

					if (immediate) {
						ticks.push(tick)
					}
				}
			}

			ticks.forEach((tick) => tick())
		},

		stop() {
			stopped = true

			for (const target of targets) {
				clearInterval(target.timer)
				clearTimeout(target.retry)
				target.timer = undefined
				target.retry = undefined
			}
		},

		flush() {
			for (const target of targets) {
				send(target, true)
			}
		},
	}
}
```

- [ ] **Step 5: Build, run the checks, and confirm that they pass**

```bash
npm run build -w libs/cmcd
node --no-warnings --test libs/cmcd/test/createCmcdSession.timers.test.ts
npm test -w libs/cmcd
npm run typecheck
npx eslint libs/cmcd
```

Expected: the 8 tests of the file pass, and every package test passes. The typecheck and ESLint report nothing.

- [ ] **Step 6: Commit**

```bash
git add libs/cmcd/src/CmcdSessionConfig.ts libs/cmcd/src/CmcdSession.ts libs/cmcd/src/createCmcdSession.ts libs/cmcd/config/cml-cmcd.api.md libs/cmcd/test/createCmcdSession.timers.test.ts
git commit -s -m "feat(cmcd): add the t report timers of the CMCD session" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 8: Configuration Checks

**Files:**
- Create: `libs/cmcd/src/checkSessionConfig.ts`
- Modify: `libs/cmcd/src/createCmcdSession.ts`
- Test: `libs/cmcd/test/createCmcdSession.config.test.ts`

**Interfaces:**
- Consumes: `createCmcdSession()` from Task 7.
- Produces: internal `checkSessionConfig(config: CmcdSessionConfig): void`, which throws `Error` with the message `createCmcdSession: <parameter> must be <valid values>, received <value>`.

- [ ] **Step 1: Write the failing test**

Create `libs/cmcd/test/createCmcdSession.config.test.ts`:

```ts
import type { CmcdSessionConfig } from '@svta/cml-cmcd'
import { CmcdTransmissionMode, createCmcdSession } from '@svta/cml-cmcd'
import { doesNotThrow, throws } from 'node:assert'
import { describe, it } from 'node:test'

const target = { url: 'https://collector.test/cmcd', events: [] }

describe('createCmcdSession configuration checks', () => {
	it('provides a valid example', () => {
		// #region example
		throws(
			() => createCmcdSession({ eventTargets: [{ url: 'https://collector.example.com/cmcd', events: [], batchSize: 0 }] }),
			{ message: 'createCmcdSession: eventTargets[0].batchSize must be a positive integer, received 0' },
		)
		// #endregion example
	})

	it('throws for an invalid sid, cid, url, interval, or batchSize', () => {
		const cases: [CmcdSessionConfig, string][] = [
			[{ sid: '' }, 'createCmcdSession: sid must be a string of 1 to 64 characters, received ""'],
			[{ sid: 'x'.repeat(65) }, `createCmcdSession: sid must be a string of 1 to 64 characters, received "${'x'.repeat(65)}"`],
			[{ sid: 5 as unknown as string }, 'createCmcdSession: sid must be a string of 1 to 64 characters, received 5'],
			[{ cid: 'x'.repeat(129) }, `createCmcdSession: cid must be a string of at most 128 characters, received "${'x'.repeat(129)}"`],
			[{ eventTargets: [{ ...target, url: '' }] }, 'createCmcdSession: eventTargets[0].url must be a non-empty string, received ""'],
			[{ eventTargets: [{ events: [] } as unknown as typeof target] }, 'createCmcdSession: eventTargets[0].url must be a non-empty string, received undefined'],
			[{ eventTargets: [{ ...target, interval: -1 }] }, 'createCmcdSession: eventTargets[0].interval must be a finite number, 0 or more, received -1'],
			[{ eventTargets: [{ ...target, interval: Infinity }] }, 'createCmcdSession: eventTargets[0].interval must be a finite number, 0 or more, received Infinity'],
			[{ eventTargets: [target, { ...target, batchSize: 0 }] }, 'createCmcdSession: eventTargets[1].batchSize must be a positive integer, received 0'],
			[{ eventTargets: [{ ...target, batchSize: 1.5 }] }, 'createCmcdSession: eventTargets[0].batchSize must be a positive integer, received 1.5'],
		]

		for (const [config, message] of cases) {
			throws(() => createCmcdSession(config), { message })
		}
	})

	it('accepts the limits of each rule', () => {
		const configs: CmcdSessionConfig[] = [
			{},
			{ sid: 'x'.repeat(64), cid: 'x'.repeat(128), version: 1, transmissionMode: CmcdTransmissionMode.HEADERS },
			{ cid: '' },
			{ eventTargets: [{ ...target, interval: 0, batchSize: 1 }] },
		]

		for (const config of configs) {
			doesNotThrow(() => createCmcdSession(config))
		}
	})
})
```

- [ ] **Step 2: Build, run the test, and confirm that it fails**

```bash
npm run build -w libs/cmcd
node --no-warnings --test libs/cmcd/test/createCmcdSession.config.test.ts
```

Expected: FAIL. 2 of 3 tests fail with `AssertionError [ERR_ASSERTION]: Missing expected exception.`

- [ ] **Step 3: Write the checks**

Create `libs/cmcd/src/checkSessionConfig.ts`:

```ts
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'

function configError(parameter: string, expected: string, received: unknown): Error {
	const value = typeof received === 'string' ? JSON.stringify(received) : String(received)

	return new Error(`createCmcdSession: ${parameter} must be ${expected}, received ${value}`)
}

/**
 * Checks the rules of a session configuration that the TypeScript types cannot express.
 *
 * @param config - The configuration to check.
 *
 * @throws If `sid`, `cid`, or the `url`, `interval`, or `batchSize` of a target is invalid.
 *
 * @internal
 */
export function checkSessionConfig(config: CmcdSessionConfig): void {
	const { sid, cid, eventTargets } = config

	if (sid !== undefined && (typeof sid !== 'string' || sid === '' || sid.length > 64)) {
		throw configError('sid', 'a string of 1 to 64 characters', sid)
	}

	if (cid !== undefined && (typeof cid !== 'string' || cid.length > 128)) {
		throw configError('cid', 'a string of at most 128 characters', cid)
	}

	eventTargets?.forEach(({ url, interval, batchSize }, i) => {
		if (typeof url !== 'string' || url === '') {
			throw configError(`eventTargets[${i}].url`, 'a non-empty string', url)
		}

		if (interval !== undefined && !(Number.isFinite(interval) && interval >= 0)) {
			throw configError(`eventTargets[${i}].interval`, 'a finite number, 0 or more', interval)
		}

		if (batchSize !== undefined && !(Number.isInteger(batchSize) && batchSize > 0)) {
			throw configError(`eventTargets[${i}].batchSize`, 'a positive integer', batchSize)
		}
	})
}
```

Replace the content of `libs/cmcd/src/createCmcdSession.ts` with:

```ts
import type { DeepReadonly, HttpRequest } from '@svta/cml-utils'
import { uuid } from '@svta/cml-utils'
import { CMCD_DEFAULT_TIME_INTERVAL } from './CMCD_DEFAULT_TIME_INTERVAL.ts'
import { CMCD_MIME_TYPE } from './CMCD_MIME_TYPE.ts'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import { CMCD_EVENT_BACKGROUNDED_MODE, CMCD_EVENT_ERROR, CMCD_EVENT_RESPONSE_RECEIVED, CMCD_EVENT_TIME_INTERVAL } from './CmcdEventType.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdReportFilter } from './CmcdReportFilter.ts'
import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import { CMCD_EVENT_MODE, CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'
import type { CmcdSession } from './CmcdSession.ts'
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { CMCD_HEADERS } from './CmcdTransmissionMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'
import { checkSessionConfig } from './checkSessionConfig.ts'
import { encodePreparedCmcd } from './encodePreparedCmcd.ts'
import { prepareCmcdData } from './prepareCmcdData.ts'
import type { CmcdScopedValues } from './readScopedValues.ts'
import { readScopedValues } from './readScopedValues.ts'
import { replaceCmcdParam } from './replaceCmcdParam.ts'
import { toBareValue } from './toBareValue.ts'
import { toPreparedCmcdHeaders } from './toPreparedCmcdHeaders.ts'
import { toResponseKeys } from './toResponseKeys.ts'
import { toTokenString } from './toTokenString.ts'

type KeyFilter = CmcdEncodeOptions['filter']

type Waiting = {
	bs: string[];
	bsd: unknown[];
	ec: unknown[];
}

type Destination = {
	sn: number;
	msdSent: boolean;
	waiting: Waiting;
	gone: boolean;
	targets: Target[];
}

type Draft = Pick<Destination, 'sn' | 'msdSent' | 'waiting'>

type Target = {
	url: string;
	destination: Destination;
	events: readonly CmcdEventType[];
	keys: KeyFilter;
	batchSize: number;
	interval: number;
	filter?: CmcdReportFilter;
	queue: string[];
	urgent: boolean;
	inFlight: boolean;
	flushPending: boolean;
	delay: number;
	retry?: ReturnType<typeof setTimeout>;
	timer?: ReturnType<typeof setInterval>;
}

const MIN_DELAY = 1000
const MAX_DELAY = 60_000
const CMCD_HEADER = /^cmcd-(object|request|session|status)$/i

function toKeyFilter(keys: readonly CmcdKey[] | undefined): KeyFilter {
	if (!keys) {
		return undefined
	}

	const set = new Set<string>(keys)

	return (key) => set.has(key)
}

function withoutScopedKeys({ msd, bs, bsd, ec, ...data }: Cmcd): Cmcd {
	return data
}

function createDestination(): Destination {
	return { sn: 0, msdSent: false, waiting: { bs: [], bsd: [], ec: [] }, gone: false, targets: [] }
}

function defaultRequester(request: HttpRequest): Promise<{ status: number; }> {
	const { url, ...init } = request

	return fetch(url, init)
}

/**
 * Creates a CMCD session. One session reports one `sid`.
 *
 * Request mode is one destination. Each event target URL is one destination.
 * Each destination has its own sequence number.
 * The player passes its CMCD data with each call and decides itself when its state changes.
 *
 * @param config - The configuration of the session.
 * @param requester - Sends each batch of event reports. The default requester uses `fetch`.
 * @returns The session.
 *
 * @throws If `sid`, `cid`, or the `url`, `interval`, or `batchSize` of a target is invalid.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/createCmcdSession.test.ts#example}
 */
export function createCmcdSession(config: CmcdSessionConfig = {}, requester: (request: HttpRequest) => Promise<{ status: number; }> = defaultRequester): CmcdSession {
	checkSessionConfig(config)

	const sid = config.sid ?? uuid()
	const timeOrigin = performance.timeOrigin || Date.now() - performance.now()
	const settings: CmcdRequestReportConfig = {
		version: config.version,
		transmissionMode: config.transmissionMode,
		enabledKeys: config.enabledKeys,
		customHeaderMap: config.customHeaderMap,
	}
	const requestDestination = createDestination()
	const destinations: Destination[] = [requestDestination]
	const urls = new Map<string, Destination>()
	const targets: Target[] = []
	let requestKeys = toKeyFilter(settings.enabledKeys)
	let msd: number | undefined
	let stopped = false

	for (const target of config.eventTargets ?? []) {
		let destination = urls.get(target.url)

		if (!destination) {
			destination = createDestination()
			urls.set(target.url, destination)
			destinations.push(destination)
		}

		const state: Target = {
			url: target.url,
			destination,
			events: [...(target.events ?? [])],
			keys: toKeyFilter(target.enabledKeys),
			batchSize: target.batchSize ?? 1,
			interval: target.interval ?? CMCD_DEFAULT_TIME_INTERVAL,
			filter: target.filter,
			queue: [],
			urgent: false,
			inFlight: false,
			flushPending: false,
			delay: 0,
		}

		destination.targets.push(state)
		targets.push(state)
	}

	function draftOf(drafts: Map<Destination, Draft>, destination: Destination): Draft {
		let draft = drafts.get(destination)

		if (!draft) {
			draft = { sn: destination.sn, msdSent: destination.msdSent, waiting: { ...destination.waiting } }
			drafts.set(destination, draft)
		}

		return draft
	}

	function build(draft: Draft, base: Cmcd, scoped: CmcdScopedValues, reportingMode: CmcdReportingMode, version: CmcdVersion, keys: KeyFilter, baseUrl?: string): Cmcd {
		const { waiting } = draft
		const values: Record<string, unknown> = { ...base, cid: base.cid ?? config.cid, msd: draft.msdSent ? undefined : msd ?? scoped.msd }

		if (waiting.bs.length) {
			const ot = toTokenString(base.ot)
			const kept = ot === undefined ? [] : waiting.bs.filter((type) => type !== '' && type !== ot)

			if (kept.length < waiting.bs.length) {
				values['bs'] = true
			}

			waiting.bs = kept
		}

		if (waiting.bsd.length) {
			values['bsd'] = [...waiting.bsd, ...(scoped.bsd ?? [])]
			waiting.bsd = []
		}

		if (waiting.ec.length) {
			values['ec'] = [...waiting.ec, ...(scoped.ec ?? [])]
			waiting.ec = []
		}

		values['sid'] = sid
		values['sn'] = draft.sn++

		const prepared = prepareCmcdData(values, { version, reportingMode, filter: keys, baseUrl })

		draft.msdSent ||= prepared.msd !== undefined

		return prepared
	}

	function commit(drafts: Map<Destination, Draft>, scoped: CmcdScopedValues): void {
		msd ??= scoped.msd

		for (const destination of destinations) {
			const draft = drafts.get(destination)

			if (draft) {
				Object.assign(destination, draft)
			}
			else if (!destination.gone) {
				const { waiting } = destination

				if (scoped.bs !== undefined) {
					waiting.bs.push(scoped.bs)
				}

				if (scoped.bsd) {
					waiting.bsd.push(...scoped.bsd)
				}

				if (scoped.ec) {
					waiting.ec.push(...scoped.ec)
				}
			}
		}
	}

	function stopDestination(destination: Destination): void {
		destination.gone = true
		destination.waiting = { bs: [], bsd: [], ec: [] }

		for (const target of destination.targets) {
			clearInterval(target.timer)
			clearTimeout(target.retry)
			target.timer = undefined
			target.retry = undefined
			target.queue.length = 0
			target.urgent = false
			target.flushPending = false
		}
	}

	function isReady(target: Target): boolean {
		return target.queue.length >= target.batchSize || target.urgent
	}

	function send(target: Target, force?: boolean): void {
		if (target.inFlight) {
			target.flushPending ||= force === true
			return
		}

		if (target.destination.gone || !target.queue.length || (target.retry !== undefined && !force)) {
			return
		}

		clearTimeout(target.retry)
		target.retry = undefined
		target.inFlight = true

		const lines = target.queue.splice(0)
		const urgent = target.urgent
		const request: HttpRequest = { url: target.url, method: 'POST', headers: { 'Content-Type': CMCD_MIME_TYPE }, body: lines.join('\n') }

		target.urgent = false

		const settle = (status?: number): void => {
			target.inFlight = false

			if (status === 410) {
				stopDestination(target.destination)
				return
			}

			if (target.destination.gone) {
				return
			}

			// CTA-5004-B: back off after a 429 or 5xx response.
			const failed = status === undefined || status === 429 || (status >= 500 && status < 600)

			if (failed) {
				target.queue.unshift(...lines)
				target.urgent ||= urgent
				target.delay = Math.min(target.delay * 2 || MIN_DELAY, MAX_DELAY)

				if (!stopped) {
					target.retry = setTimeout(() => {
						target.retry = undefined
						send(target)
					}, target.delay)
				}
			}
			else {
				target.delay = 0
			}

			if (target.flushPending) {
				target.flushPending = false
				send(target, true)
			}
			else if (!failed && isReady(target)) {
				send(target)
			}
		}

		new Promise<{ status: number; }>((resolve) => resolve(requester(request))).then((response) => settle(response?.status ?? 0), () => settle())
	}

	function emit(type: CmcdEventType, data: Cmcd, request?: DeepReadonly<HttpRequest>, candidates: readonly Target[] = targets, ec?: readonly string[]): void {
		const report: Cmcd = { ...data, e: type, ts: data.ts ?? Date.now() }

		// CTA-5004-B: a b event without bg is the exit from backgrounded mode.
		if (type === CMCD_EVENT_BACKGROUNDED_MODE && toBareValue(report.bg) === false) {
			delete report.bg
		}

		const scoped = readScopedValues(report, ec)
		const selected = candidates.filter((target) => target.events.includes(type) && !target.destination.gone && (!target.filter || target.filter(report, request)))
		const drafts = new Map<Destination, Draft>()
		const lines = selected.map((target) => encodePreparedCmcd(build(draftOf(drafts, target.destination), report, scoped, CMCD_EVENT_MODE, CMCD_V2, target.keys)))

		commit(drafts, scoped)

		selected.forEach((target, i) => {
			target.queue.push(lines[i])
			target.urgent ||= type === CMCD_EVENT_ERROR

			if (isReady(target)) {
				send(target)
			}
		})
	}

	return {
		sid,

		createRequestReport<R extends HttpRequest>(request: R, data: Cmcd = {}): R & CmcdRequestReport<R['customData']> {
			const scoped = readScopedValues(data)
			const drafts = new Map<Destination, Draft>()
			const cmcd = build(draftOf(drafts, requestDestination), data, scoped, CMCD_REQUEST_MODE, settings.version ?? CMCD_V2, requestKeys, request.url)
			const source = request.headers ?? {}
			const replace = settings.transmissionMode === CMCD_HEADERS
			const headers: Record<string, string> = {}
			let url = request.url

			for (const name in source) {
				if (!replace || !CMCD_HEADER.test(name)) {
					headers[name] = source[name]
				}
			}

			if (replace) {
				Object.assign(headers, toPreparedCmcdHeaders(cmcd, settings.customHeaderMap))
			}
			else {
				url = replaceCmcdParam(url, encodePreparedCmcd(cmcd))
			}

			commit(drafts, scoped)

			return { ...request, url, headers, customData: { ...request.customData, cmcd } } as R & CmcdRequestReport<R['customData']>
		},

		recordEvent(type, data = {}, request) {
			emit(type, data, request)
		},

		recordResponseReceived(response, data = {}) {
			const requestData = withoutScopedKeys(response.request.customData?.cmcd ?? {})

			emit(CMCD_EVENT_RESPONSE_RECEIVED, { ...requestData, ...toResponseKeys(response, timeOrigin), ...data }, response.request)
		},

		recordError(codes, data = {}) {
			const ec = typeof codes === 'string' ? [codes] : [...codes]

			emit(CMCD_EVENT_ERROR, { ...data, ec }, undefined, targets, ec)
		},

		configure(next) {
			Object.assign(settings, next)
			requestKeys = toKeyFilter(settings.enabledKeys)
		},

		start(immediate = true) {
			const { snapshot } = config
			const ticks: (() => void)[] = []

			stopped = false

			for (const target of targets) {
				clearInterval(target.timer)
				target.timer = undefined

				if (snapshot && target.interval > 0 && !target.destination.gone && target.events.includes(CMCD_EVENT_TIME_INTERVAL)) {
					const tick = (): void => emit(CMCD_EVENT_TIME_INTERVAL, snapshot(), undefined, [target])

					target.timer = setInterval(tick, target.interval * 1000)

					if (immediate) {
						ticks.push(tick)
					}
				}
			}

			ticks.forEach((tick) => tick())
		},

		stop() {
			stopped = true

			for (const target of targets) {
				clearInterval(target.timer)
				clearTimeout(target.retry)
				target.timer = undefined
				target.retry = undefined
			}
		},

		flush() {
			for (const target of targets) {
				send(target, true)
			}
		},
	}
}
```

- [ ] **Step 4: Build, run the checks, and confirm that they pass**

```bash
npm run build -w libs/cmcd
node --no-warnings --test libs/cmcd/test/createCmcdSession.config.test.ts
npm test -w libs/cmcd
npm run typecheck
npx eslint libs/cmcd
```

Expected: the 3 tests of the file pass, and every package test passes. The typecheck and ESLint report nothing.

- [ ] **Step 5: Commit**

```bash
git add libs/cmcd/src/checkSessionConfig.ts libs/cmcd/src/createCmcdSession.ts libs/cmcd/test/createCmcdSession.config.test.ts
git commit -s -m "feat(cmcd): check the configuration of createCmcdSession" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 9: CTA-5004-B Examples

**Files:**
- Create: `libs/cmcd/test/data/CTA_5004_B_EXAMPLES.ts`
- Test: `libs/cmcd/test/createCmcdSession.examples.test.ts`

**Interfaces:**
- Consumes: the complete session from Tasks 2 to 8.
- Produces: a conformance suite. The tests pass at once, because Tasks 2 to 8 implement the behavior. If an example fails, stop and report the example: the session differs from the spec.

The data file comes from PR 460. Its comments name the changes to the text of CTA-5004-B. Example 8.2.5 is not in the file. The PR 460 variant of that example derives `bs` from the play states, and the RFC rejected that derivation.

The request mode constants are the Query-arg lines of the spec, without decoding. The tests compare the raw query of each URL with these lines, so they check the encoding too.

- [ ] **Step 1: Add the example data**

Create `libs/cmcd/test/data/CTA_5004_B_EXAMPLES.ts`:

```ts
/** Query-arg lines of CTA-5004-B section 8.1, request mode. */
export const EX_8_1_1 = 'CMCD=bl%3D%282000%29%2Cbr%3D%283000%3Bv%29%2Ccid%3D%22content-id-123%22%2Cd%3D4000%2Cdl%3D1000%2Cmtp%3D%2815000%29%2Cnor%3D%28%22next-seg.mp4%22%29%2Cot%3Dv%2Crtp%3D12000%2Csf%3Dd%2Csid%3D%22session-id-123%22%2Cst%3Dv%2Csta%3Dp%2Ctb%3D%286000%3Bv%29%2Cv%3D2'
export const EX_8_1_1_HEADERS = {
	'CMCD-Request': 'bl=(2000),dl=1000,mtp=(15000),nor=("next-seg.mp4"),sta=p',
	'CMCD-Object': 'br=(3000;v),d=4000,ot=v,tb=(6000;v)',
	'CMCD-Status': 'rtp=12000',
	'CMCD-Session': 'cid="content-id-123",sf=d,sid="session-id-123",st=v,v=2',
}
export const EX_8_1_2 = 'CMCD=bl%3D%282000%29%2Cbr%3D%28320%29%2Ccid%3D%22content-id-123%22%2Cd%3D2000%2Cmtp%3D%2815000%29%2Cot%3Da%2Csid%3D%22session-id-123%22%2Cst%3Dv%2Cv%3D2'
export const EX_8_1_3 = 'CMCD=cid%3D%22content-id-123%22%2Csid%3D%22session-id-123%22%2Cv%3D2'
export const EX_8_1_4: readonly string[] = [
	'CMCD=cid%3D%22content-id-123%22%2Cot%3Dm%2Csf%3Dd%2Csid%3D%22session-id-123%22%2Cst%3Dv%2Csu%2Cv%3D2',
	'CMCD=bl%3D%280%29%2Cbr%3D%283000%3Bv%29%2Ccid%3D%22content-id-123%22%2Cmtp%3D%2815000%29%2Cnor%3D%28%22seg-1.m4v%22%20%22seg-2.m4v%22%29%2Cot%3Di%2Csid%3D%22session-id-123%22%2Cst%3Dv%2Csta%3Ds%2Csu%2Cv%3D2',
	'CMCD=bl%3D%280%29%2Cbr%3D%283000%3Bv%29%2Ccid%3D%22content-id-123%22%2Cd%3D4000%2Cmtp%3D%2815000%29%2Cnor%3D%28%22seg-2.m4v%22%20%22seg-3.m4v%22%29%2Cot%3Dv%2Csid%3D%22session-id-123%22%2Cst%3Dv%2Csta%3Ds%2Csu%2Cv%3D2',
	'CMCD=bl%3D%284000%29%2Cbr%3D%283000%3Bv%29%2Ccid%3D%22content-id-123%22%2Cd%3D4000%2Cmsd%3D200%2Cmtp%3D%2815000%29%2Cnor%3D%28%22seg-3.m4v%22%20%22seg-4.m4v%22%29%2Cot%3Dv%2Csid%3D%22session-id-123%22%2Cst%3Dv%2Csta%3Dp%2Cv%3D2',
]
export const EX_8_1_5: readonly string[] = [
	'CMCD=cid%3D%22content-id-123%22%2Cec%3D%28%22CODEC_NOT_SUPPORTED%22%29%2Csid%3D%22session-id-123%22%2Csta%3Dp%2Cv%3D2',
	'CMCD=cid%3D%22content-id-123%22%2Cec%3D%28%22DRM_NOT_SUPPORTED%22%20%22PLAYBACK_FAILED%22%29%2Csid%3D%22session-id-123%22%2Csta%3Df%2Cv%3D2',
]
export const EX_8_1_6: readonly string[] = [
	'CMCD=bl%3D%280%29%2Cbs%2Ccid%3D%22content-id-123%22%2Cot%3Dv%2Csid%3D%22session-id-123%22%2Csta%3Dr%2Cv%3D2',
	'CMCD=bl%3D%280%3Bv%202000%3Ba%29%2Cbs%2Ccid%3D%22content-id-123%22%2Cot%3Dv%2Csid%3D%22session-id-123%22%2Csta%3Dr%2Cv%3D2',
]
export const EX_8_1_7 = {
	primary: 'CMCD=cid%3D%22movie-123%22%2Cot%3Dv%2Csid%3D%22session-common-1%22%2Cv%3D2',
	ad: 'CMCD=cid%3D%22ad-555%22%2Cnr%2Cot%3Dv%2Csid%3D%22session-common-1%22%2Cv%3D2',
	primaryHidden: 'CMCD=cid%3D%22movie-123%22%2Cnr%2Cot%3Dv%2Csid%3D%22session-common-1%22%2Cv%3D2',
	adShown: 'CMCD=cid%3D%22ad-555%22%2Cot%3Dv%2Csid%3D%22session-common-1%22%2Cv%3D2',
}
/** 8.1.8 with `sn=129` replaced by the first sequence number of a fresh session. */
export const EX_8_1_8 = 'CMCD=bg%2Cbl%3D%282100%3Bv%201800%3Ba%29%2Cbr%3D%283000%3Bv%20164%3Ba%29%2Cbs%2Cbsa%3D%283%3Bv%29%2Cbsd%3D%281200%3Bv%20100%3Ba%29%2Cbsda%3D%284150%3Bv%20300%3Ba%29%2Ccid%3D%22content-id-123%22%2Ccs%3D%22g48djn236sk2%22%2Cd%3D4000%2Cdfa%3D32%2Cdl%3D1000%2Cec%3D%28%222001%22%29%2Clb%3D%28500%3Bv%2032%3Ba%29%2Cltc%3D13500%2Cmsd%3D1700%2Cmtp%3D%2815000%3Bv%206000%3Ba%29%2Cnor%3D%28%22next-seg.mp4%22%29%2Cnr%2Cot%3Dv%2Cpb%3D%282000%3Bv%20164%3Ba%29%2Cpr%3D1.1%2Cpt%3D632782%2Crtp%3D12000%2Csf%3Dd%2Csid%3D%22session-id-123%22%2Csn%3D0%2Cst%3Dl%2Csta%3Dp%2Csu%2Ctb%3D%286000%3Bv%20350%3Ba%29%2Ctbl%3D%282000%3Bv%202000%3Ba%29%2Ctpb%3D%285000%3Bv%20164%3Ba%29%2Cv%3D2'

/** POST bodies of section 8.2, event mode. Document whitespace removed. */
export const EX_8_2_1 = 'e=t,ts=1764752400000,v=2'
export const EX_8_2_2: readonly string[] = [
	'bl=(0),cid="content-id-123",e=t,h="example.com",pt=0,sid="session-id-123",sn=1,sta=s,su,ts=1764752400000,v=2',
	'bl=(6000),br=(4200;v 256;a),cid="content-id-123",e=t,h="example.com",lb=(523;v 64;a),msd=812,mtp=(87000;v 49000;a),pb=(4200;v 256;a),pt=29188,sf=d,sid="session-id-123",sn=2,st=v,sta=p,tb=(4200;v 256;a),tpb=(4200;v 256;a),ts=1764752430000,v=2',
	'bl=(3200),br=(4200;v 256;a),bs,bsd=(720;v),cid="content-id-123",e=t,ec=("MEDIA_ERR_NETWORK"),h="example.com",lb=(523;v 64;a),mtp=(89000;v 52000;a),pb=(4200;v 256;a),pt=59188,sf=d,sid="session-id-123",sn=3,st=v,sta=p,tb=(4200;v 256;a),tpb=(4200;v 256;a),ts=1764752460000,v=2',
	'bl=(6000),br=(4200;v 256;a),cid="content-id-123",e=t,h="example.com",lb=(523;v 64;a),mtp=(81000;v 55000;a),pb=(4200;v 256;a),pt=89188,sf=d,sid="session-id-123",sn=4,st=v,sta=p,tb=(4200;v 256;a),tpb=(4200;v 256;a),ts=1764752490000,v=2',
	'bl=(0),br=(4200;v 256;a),cid="content-id-123",e=t,h="example.com",lb=(523;v 64;a),mtp=(82000;v 55000;a),pb=(4200;v 256;a),pr=0,pt=111000,sf=d,sid="session-id-123",sn=5,st=v,sta=e,tb=(4200;v 256;a),tpb=(4200;v 256;a),ts=1764752520000,v=2',
]
export const EX_8_2_3 = 'cid="bbb",cmsdd="ZXRwPTEyNTAwO3J0dD0zNTttYj02MDAwO3JkPTIwMA==",cmsds="c2lkPSI5YTNiLTIxY2QiO2JyPTQ1MDA7ZD00MDAwO290PXY7c3Q9dg==",e=rr,nor=("video/segment-6.m4v"),ot=v,rc=200,sid="session1",ts=1763657019723,ttfb=180,ttlb=200,url="video/segment-5.m4v",v=2'
export const EX_8_2_4 = 'cid="content-id-123",e=e,ec=("CODEC_NOT_SUPPORTED"),sid="session-id-123",ts=1764269150213,v=2'
export const EX_8_2_6 = 'bl=(0),cid="content-id-123",e=ps,pt=30000,sid="session-id-123",sta=k,ts=1764269150529,v=2'
export const EX_8_2_7 = 'cid="ad-content-555",e=sk,sid="session-id-123",ts=1764269150076,v=2'
export const EX_8_2_8: readonly string[] = [
	'cid="movie-123",e=abs,nr,sid="session-id-123",ts=1764269150186,v=2',
	'cid="ad-001",e=as,sid="session-id-123",ts=1764269150934,v=2',
	'cid="ad-001",e=ae,nr,sid="session-id-123",ts=1764269170901,v=2',
	'cid="movie-123",e=abe,sid="session-id-123",ts=1764269170331,v=2',
]
```

- [ ] **Step 2: Write the tests**

Create `libs/cmcd/test/createCmcdSession.examples.test.ts`:

```ts
import type { Cmcd, CmcdKey, CmcdSessionConfig } from '@svta/cml-cmcd'
import { CmcdEventType, CmcdObjectType, CmcdPlayerState, CmcdStreamingFormat, CmcdStreamType, CmcdTransmissionMode, createCmcdSession, toCmcdValue } from '@svta/cml-cmcd'
import type { HttpRequest } from '@svta/cml-utils'
import { deepEqual, equal } from 'node:assert'
import { afterEach, describe, it, mock } from 'node:test'
import { EX_8_1_1, EX_8_1_1_HEADERS, EX_8_1_2, EX_8_1_3, EX_8_1_4, EX_8_1_5, EX_8_1_6, EX_8_1_7, EX_8_1_8, EX_8_2_1, EX_8_2_2, EX_8_2_3, EX_8_2_4, EX_8_2_6, EX_8_2_7, EX_8_2_8 } from './data/CTA_5004_B_EXAMPLES.ts'

const CDN = 'https://cdn.example.com'
const SEGMENT = `${CDN}/seg-1.m4s`
const COLLECTOR = 'https://collector.example.com/cmcd'
const CID = 'content-id-123'
const SID = 'session-id-123'

function query(url: string): string {
	return url.slice(url.indexOf('?') + 1)
}

function settle(): Promise<void> {
	return new Promise((resolve) => setImmediate(resolve))
}

function eventSetup(config: CmcdSessionConfig) {
	const bodies: string[] = []
	const session = createCmcdSession({ sid: SID, ...config }, async (request: HttpRequest) => {
		bodies.push(String(request.body))
		return { status: 200 }
	})

	return { session, bodies }
}

const v = (value: number) => toCmcdValue<number, { v: boolean; }>(value, { v: true })
const a = (value: number) => toCmcdValue<number, { a: boolean; }>(value, { a: true })
const NO_SN: CmcdKey[] = ['bl', 'br', 'bs', 'cid', 'cmsdd', 'cmsds', 'd', 'dl', 'e', 'ec', 'h', 'msd', 'mtp', 'nor', 'nr', 'ot', 'pt', 'rc', 'rtp', 'sf', 'sid', 'st', 'sta', 'su', 'tb', 'ts', 'ttfb', 'ttlb', 'url', 'v']

describe('createCmcdSession reproduces the examples of CTA-5004-B', () => {
	afterEach(() => mock.timers.reset())

	it('provides a valid example', () => {
		// #region example
		const session = createCmcdSession({ sid: 'session-id-123', enabledKeys: ['cid', 'sid'] })

		const report = session.createRequestReport({ url: 'https://cdn.example.com/seg-1.m4s' }, { cid: 'content-id-123' })

		equal(decodeURIComponent(report.url), 'https://cdn.example.com/seg-1.m4s?CMCD=cid="content-id-123",sid="session-id-123",v=2')
		// #endregion example
	})

	describe('8.1 request mode', () => {
		const data81: Cmcd = { cid: CID, sf: CmcdStreamingFormat.DASH, st: CmcdStreamType.VOD, sta: CmcdPlayerState.PLAYING, bl: [2000], mtp: [15000], rtp: 12000, br: [v(3000)], d: 4000, dl: 1000, nor: [`${CDN}/next-seg.mp4`], ot: CmcdObjectType.VIDEO, tb: [v(6000)] }
		const keys81: CmcdKey[] = ['bl', 'br', 'cid', 'd', 'dl', 'mtp', 'nor', 'ot', 'rtp', 'sf', 'sid', 'st', 'sta', 'tb']

		it('8.1.1 in query mode', () => {
			const session = createCmcdSession({ sid: SID, enabledKeys: keys81 })

			equal(query(session.createRequestReport({ url: SEGMENT }, data81).url), EX_8_1_1)
		})

		it('8.1.1 in header mode', () => {
			const session = createCmcdSession({ sid: SID, enabledKeys: keys81, transmissionMode: CmcdTransmissionMode.HEADERS })

			deepEqual(session.createRequestReport({ url: SEGMENT, headers: { Accept: '*/*' } }, data81).headers, { Accept: '*/*', ...EX_8_1_1_HEADERS })
		})

		it('8.1.2 and 8.1.3', () => {
			const audio = createCmcdSession({ sid: SID, enabledKeys: ['bl', 'br', 'cid', 'd', 'mtp', 'ot', 'sid', 'st'] })
			const minimal = createCmcdSession({ sid: SID, enabledKeys: ['cid', 'sid'] })

			equal(query(audio.createRequestReport({ url: SEGMENT }, { cid: CID, st: CmcdStreamType.VOD, bl: [2000], mtp: [15000], br: [320], d: 2000, ot: CmcdObjectType.AUDIO }).url), EX_8_1_2)
			equal(query(minimal.createRequestReport({ url: SEGMENT }, { cid: CID }).url), EX_8_1_3)
		})

		it('8.1.4, a startup sequence with su and msd', () => {
			const session = createCmcdSession({ sid: SID, enabledKeys: ['bl', 'br', 'cid', 'd', 'msd', 'mtp', 'nor', 'ot', 'sf', 'sid', 'st', 'sta', 'su'] })
			const base: Cmcd = { cid: CID, st: CmcdStreamType.VOD }
			const media: Cmcd = { ...base, bl: [0], br: [v(3000)], mtp: [15000], sta: CmcdPlayerState.STARTING, su: true }

			const urls = [
				session.createRequestReport({ url: `${CDN}/manifest.mpd` }, { ...base, ot: CmcdObjectType.MANIFEST, sf: CmcdStreamingFormat.DASH, su: true }).url,
				session.createRequestReport({ url: `${CDN}/init.m4v` }, { ...media, ot: CmcdObjectType.INIT, nor: [`${CDN}/seg-1.m4v`, `${CDN}/seg-2.m4v`] }).url,
				session.createRequestReport({ url: `${CDN}/seg-1.m4v` }, { ...media, ot: CmcdObjectType.VIDEO, d: 4000, nor: [`${CDN}/seg-2.m4v`, `${CDN}/seg-3.m4v`] }).url,
				session.createRequestReport({ url: `${CDN}/seg-2.m4v` }, { ...media, bl: [4000], sta: CmcdPlayerState.PLAYING, su: false, msd: 200, ot: CmcdObjectType.VIDEO, d: 4000, nor: [`${CDN}/seg-3.m4v`, `${CDN}/seg-4.m4v`] }).url,
			]

			deepEqual(urls.map(query), EX_8_1_4)
		})

		it('8.1.5, error codes that wait for the next request', () => {
			const session = createCmcdSession({ sid: SID, enabledKeys: ['cid', 'ec', 'sid', 'sta'] })

			session.recordError('CODEC_NOT_SUPPORTED')
			const first = session.createRequestReport({ url: SEGMENT }, { cid: CID, sta: CmcdPlayerState.PLAYING })
			const second = session.createRequestReport({ url: SEGMENT }, { cid: CID, sta: CmcdPlayerState.PLAYING })
			session.recordError(['DRM_NOT_SUPPORTED', 'PLAYBACK_FAILED'])
			const third = session.createRequestReport({ url: SEGMENT }, { cid: CID, sta: 'f' })

			deepEqual([first, third].map((report) => query(report.url)), EX_8_1_5)
			equal(query(second.url), 'CMCD=cid%3D%22content-id-123%22%2Csid%3D%22session-id-123%22%2Csta%3Dp%2Cv%3D2')
		})

		it('8.1.6, buffer starvation', () => {
			const session = createCmcdSession({ sid: SID, enabledKeys: ['bl', 'bs', 'cid', 'ot', 'sid', 'sta'] })
			const stall: Cmcd = { cid: CID, sta: CmcdPlayerState.REBUFFERING, ot: CmcdObjectType.VIDEO, bs: true }

			const urls = [
				session.createRequestReport({ url: SEGMENT }, { ...stall, bl: [0] }).url,
				session.createRequestReport({ url: SEGMENT }, { ...stall, bl: [v(0), a(2000)] }).url,
			]

			deepEqual(urls.map(query), EX_8_1_6)
		})

		it('8.1.7, two players in one session', () => {
			const session = createCmcdSession({ sid: 'session-common-1', enabledKeys: ['cid', 'nr', 'ot', 'sid'] })
			const report = (data: Cmcd): string => query(session.createRequestReport({ url: SEGMENT }, { ...data, ot: CmcdObjectType.VIDEO }).url)

			deepEqual({
				primary: report({ cid: 'movie-123' }),
				ad: report({ cid: 'ad-555', nr: true }),
				primaryHidden: report({ cid: 'movie-123', nr: true }),
				adShown: report({ cid: 'ad-555' }),
			}, EX_8_1_7)
		})

		it('8.1.8, every request mode key', () => {
			const session = createCmcdSession({ sid: SID })

			session.recordError('2001')
			const report = session.createRequestReport({ url: SEGMENT }, {
				bg: true, bl: [v(2100), a(1800)], br: [v(3000), a(164)], bs: true, bsa: [v(3)], bsd: [v(1200), a(100)], bsda: [v(4150), a(300)],
				cid: CID, cs: 'g48djn236sk2', d: 4000, dfa: 32, dl: 1000, lb: [v(500), a(32)], ltc: 13500, msd: 1700, mtp: [v(15000), a(6000)],
				nor: [`${CDN}/next-seg.mp4`], nr: true, ot: CmcdObjectType.VIDEO, pb: [v(2000), a(164)], pr: 1.1, pt: 632782, rtp: 12000,
				sf: CmcdStreamingFormat.DASH, st: CmcdStreamType.LIVE, sta: CmcdPlayerState.PLAYING, su: true, tb: [v(6000), a(350)], tbl: [v(2000), a(2000)], tpb: [v(5000), a(164)],
			})

			equal(query(report.url), EX_8_1_8)
		})
	})

	describe('8.2 event mode', () => {
		it('8.2.1, a minimal t report', () => {
			mock.timers.enable({ apis: ['setInterval', 'Date'], now: 1764752400000 - 30_000 })
			const { session, bodies } = eventSetup({ eventTargets: [{ url: COLLECTOR, events: [CmcdEventType.TIME_INTERVAL], enabledKeys: [] }], snapshot: () => ({}) })

			session.start(false)
			mock.timers.tick(30_000)
			session.stop()

			deepEqual(bodies, [EX_8_2_1])
		})

		it('8.2.2, t reports with msd, a stall, and an error between two reports', async () => {
			mock.timers.enable({ apis: ['setInterval', 'Date'], now: 1764752400000 - 30_000 })
			const media: Cmcd = { cid: CID, h: 'example.com', sf: CmcdStreamingFormat.DASH, st: CmcdStreamType.VOD, br: [v(4200), a(256)], lb: [v(523), a(64)], pb: [v(4200), a(256)], tb: [v(4200), a(256)], tpb: [v(4200), a(256)] }
			const snapshots: Cmcd[] = [
				{ cid: CID },
				{ cid: CID, h: 'example.com', bl: [0], pt: 0, sta: CmcdPlayerState.STARTING, su: true },
				{ ...media, bl: [6000], msd: 812, mtp: [v(87000), a(49000)], pt: 29188, sta: CmcdPlayerState.PLAYING },
				{ ...media, bl: [3200], mtp: [v(89000), a(52000)], pt: 59188, sta: CmcdPlayerState.PLAYING },
				{ ...media, bl: [6000], mtp: [v(81000), a(55000)], pt: 89188, sta: CmcdPlayerState.PLAYING },
				{ ...media, bl: [0], mtp: [v(82000), a(55000)], pr: 0, pt: 111000, sta: 'e' },
			]
			let tick = 0
			const { session, bodies } = eventSetup({ eventTargets: [{ url: COLLECTOR, events: [CmcdEventType.TIME_INTERVAL] }], snapshot: () => snapshots[tick++] })

			session.start()
			for (let i = 1; i < snapshots.length; i++) {
				await settle()
				if (i === 3) {
					session.recordError('MEDIA_ERR_NETWORK')
					session.createRequestReport({ url: SEGMENT }, { ot: CmcdObjectType.VIDEO, bs: true, bsd: [v(720)] })
				}
				mock.timers.tick(30_000)
			}
			session.stop()

			deepEqual(bodies.slice(1), EX_8_2_2)
		})

		it('8.2.3, an rr report with CMSD keys', () => {
			const { session, bodies } = eventSetup({ sid: 'session1', enabledKeys: NO_SN, eventTargets: [{ url: COLLECTOR, events: [CmcdEventType.RESPONSE_RECEIVED], enabledKeys: [...NO_SN, 'cmsdd', 'cmsds'] }] })

			const request = session.createRequestReport({ url: 'video/segment-5.m4v' }, { cid: 'bbb', ot: CmcdObjectType.VIDEO, nor: ['video/segment-6.m4v'] })
			session.recordResponseReceived({ request, status: 200, resourceTiming: { startTime: 1000, responseStart: 1180, duration: 200, encodedBodySize: 0 } }, {
				ts: 1763657019723,
				cmsdd: 'ZXRwPTEyNTAwO3J0dD0zNTttYj02MDAwO3JkPTIwMA==',
				cmsds: 'c2lkPSI5YTNiLTIxY2QiO2JyPTQ1MDA7ZD00MDAwO290PXY7c3Q9dg==',
			})

			deepEqual(bodies, [EX_8_2_3])
		})

		it('8.2.4, 8.2.6, and 8.2.7, error, play state, and skip reports', async () => {
			const { session, bodies } = eventSetup({ eventTargets: [{ url: COLLECTOR, events: [CmcdEventType.ERROR, CmcdEventType.PLAY_STATE, CmcdEventType.SKIP], enabledKeys: NO_SN }] })

			session.recordError('CODEC_NOT_SUPPORTED', { cid: CID, ts: 1764269150213 })
			await settle()
			session.recordEvent(CmcdEventType.PLAY_STATE, { cid: CID, bl: [0], pt: 30000, sta: CmcdPlayerState.SEEKING, ts: 1764269150529 })
			await settle()
			session.recordEvent(CmcdEventType.SKIP, { cid: 'ad-content-555', ts: 1764269150076 })

			deepEqual(bodies, [EX_8_2_4, EX_8_2_6, EX_8_2_7])
		})

		it('8.2.8, an ad break', async () => {
			const { session, bodies } = eventSetup({
				eventTargets: [{
					url: COLLECTOR,
					events: [CmcdEventType.AD_BREAK_START, CmcdEventType.AD_START, CmcdEventType.AD_END, CmcdEventType.AD_BREAK_END],
					enabledKeys: NO_SN,
				}],
			})

			session.recordEvent(CmcdEventType.AD_BREAK_START, { cid: 'movie-123', nr: true, ts: 1764269150186 })
			await settle()
			session.recordEvent(CmcdEventType.AD_START, { cid: 'ad-001', ts: 1764269150934 })
			await settle()
			session.recordEvent(CmcdEventType.AD_END, { cid: 'ad-001', nr: true, ts: 1764269170901 })
			await settle()
			session.recordEvent(CmcdEventType.AD_BREAK_END, { cid: 'movie-123', ts: 1764269170331 })

			deepEqual(bodies, EX_8_2_8)
		})
	})
})
```

- [ ] **Step 3: Build, run the checks, and confirm that they pass**

```bash
npm run build -w libs/cmcd
node --no-warnings --test libs/cmcd/test/createCmcdSession.examples.test.ts
npm test -w libs/cmcd
npm run typecheck
npx eslint libs/cmcd
```

Expected: the 14 tests of the file pass, and every package test passes. The typecheck and ESLint report nothing.

- [ ] **Step 4: Commit**

```bash
git add libs/cmcd/test/data/CTA_5004_B_EXAMPLES.ts libs/cmcd/test/createCmcdSession.examples.test.ts
git commit -s -m "test(cmcd): reproduce the CTA-5004-B examples with the CMCD session" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 10: Documentation and Changelog

**Files:**
- Create: `libs/cmcd/docs/session-guide.md`, `libs/cmcd/docs/migration-guide.md`
- Modify: `libs/cmcd/README.md`, `libs/cmcd/CHANGELOG.md`

**Interfaces:**
- Consumes: the complete session API. The TSDoc of each member already has its `@example`.
- Produces: the guides that the deprecation notices of Phase 4 link to.

- [ ] **Step 1: Write the session guide**

Create `libs/cmcd/docs/session-guide.md`:

````markdown
---
title: Session Guide
description: How to report CMCD from a player with createCmcdSession
---

# CMCD Session Guide

`createCmcdSession()` reports Common Media Client Data (CMCD) from a media player. In request mode, it adds CMCD data to media requests. In event mode, it sends event reports to collectors. One session reports one session ID (`sid`).

The session keeps only the state that CTA-5004-B scopes to a session or to a destination. The player keeps its own state. It passes its CMCD data with each call and decides itself when its state changes.

## Create a Session

```typescript
import { CmcdEventType, createCmcdSession } from '@svta/cml-cmcd'

const session = createCmcdSession({
	cid: 'movie-42',
	eventTargets: [{
		url: 'https://collector.example.com/cmcd',
		events: [CmcdEventType.PLAY_STATE, CmcdEventType.ERROR],
		batchSize: 5,
	}],
}, async (request) => {
	console.log(request.url, request.body)
	return { status: 200 }
})

console.log(session.sid)
```

The session generates a `sid` when the configuration has none. The second argument sends the event reports, so pass the HTTP client of the player there. Without it, the session sends with `fetch`, without the `keepalive` option.

The configuration uses the types of `CmcdReporter`: `CmcdRequestReportConfig` for request mode, and `CmcdEventReportConfig` for each event target. The session ignores their `transform` options. Use `filter` on an event target instead.

Request mode is one destination. Each event target URL is one destination, so the targets with the same URL share one destination. Each destination has its own sequence number (`sn`), which starts at 0.

To change the `sid`, create a new session. Call `flush()` and `stop()` on the old session first. If the player keeps the old session, it can record late responses under the old `sid`.

## Pass the State on Every Call

The player builds its CMCD data from its own fields and passes the data with each call. A state change check is one comparison.

```typescript
import type { Cmcd } from '@svta/cml-cmcd'
import { CmcdEventType, CmcdPlayerState, createCmcdSession } from '@svta/cml-cmcd'

let playerState: Cmcd['sta'] = CmcdPlayerState.STARTING
const bufferLength = 21300
const bandwidth = 25_000_000

const state = (): Cmcd => ({ sf: 'h', st: 'v', sta: playerState, bl: [bufferLength], mtp: [bandwidth / 1000] })

const session = createCmcdSession({
	cid: 'movie-42',
	eventTargets: [{
		url: 'https://collector.example.com/cmcd',
		events: [CmcdEventType.PLAY_STATE, CmcdEventType.TIME_INTERVAL],
		interval: 30,
	}],
	snapshot: state,
}, async (request) => {
	console.log(request.body)
	return { status: 200 }
})

session.start()

function setPlayerState(next: Cmcd['sta']): void {
	if (next === playerState) {
		return
	}

	playerState = next
	session.recordEvent(CmcdEventType.PLAY_STATE, state())
}

setPlayerState(CmcdPlayerState.PLAYING)
setPlayerState(CmcdPlayerState.PLAYING)

session.stop()
```

The second `setPlayerState()` call sends nothing, because the state did not change. `start()` sends the first `t` report at once and then one report every 30 seconds. Each `t` report reads `snapshot()`. `start(false)` waits one interval before the first report. `stop()` clears the timers.

## Decorate Requests

```typescript
import { CmcdObjectType, CmcdTransmissionMode, createCmcdSession } from '@svta/cml-cmcd'

const session = createCmcdSession({ sid: 'session-1' })

const report = session.createRequestReport(
	{ url: 'https://cdn.example.com/movie/seg-2.m4s' },
	{ ot: CmcdObjectType.VIDEO, d: 4000, br: [3000], nor: ['https://cdn.example.com/movie/seg-3.m4s'] },
)

console.log(decodeURIComponent(report.url))
// https://cdn.example.com/movie/seg-2.m4s?CMCD=br=(3000),d=4000,nor=("seg-3.m4s"),ot=v,sid="session-1",sn=0,v=2

session.configure({ transmissionMode: CmcdTransmissionMode.HEADERS })

const next = session.createRequestReport({ url: 'https://cdn.example.com/movie/seg-3.m4s' }, { ot: CmcdObjectType.VIDEO })

console.log(next.headers['CMCD-Request'])
// sn=1
```

`createRequestReport()` returns a copy of the request:

- In query mode, the session removes every `CMCD` parameter of the URL and adds one. The other parameters and the fragment stay.
- In header mode, the session replaces the CMCD headers of the request. `customHeaderMap` places the custom keys.
- `customData.cmcd` holds the report data before encoding.
- The session writes `nor` as a path relative to the request URL.
- Each call advances the sequence number of request mode. Version 1 does not send `sn`.
- Without `enabledKeys`, the report has every key of the version.

`configure()` replaces `version`, `transmissionMode`, `enabledKeys`, and `customHeaderMap` for request mode. It keeps the `sid` and every sequence number. Event targets cannot change after creation.

## Record Events and Responses

`recordEvent()` sends a report to each event target that lists the event type. The session adds `e`, and `ts` when the data has none. It writes `sid` and `sn` last, so a `sid`, `sn`, or `e` in the data has no effect. The configured `cid` applies when the data has no `cid`. A `b` report with `bg: false` is the exit from backgrounded mode, so the session writes it without `bg`.

`recordResponseReceived()` records an `rr` report. The session derives these keys:

| Key | Source |
|---|---|
| `url` | The request URL without the `CMCD` parameter |
| `rc` | `status` |
| `ts` | The time origin plus `resourceTiming.startTime` |
| `ttfb` | `responseStart` minus `startTime`, when `responseStart` is above 0 and not earlier than `startTime` |
| `ttlb` | `duration`, when it is above 0 |

Resource Timing reports 0 for the `responseStart` of a cross-origin response without the `Timing-Allow-Origin` header. The session then omits `ttfb`.

The report also has the request-time data from `customData.cmcd`. The `data` argument overrides the derived keys. Pass the keys that the session cannot derive there, for example `ttfbb`, `cmsdd`, and `cmsds`.

```typescript
import { CmcdEventType, CmcdObjectType, createCmcdSession } from '@svta/cml-cmcd'

const session = createCmcdSession({
	eventTargets: [{ url: 'https://collector.example.com/cmcd', events: [CmcdEventType.RESPONSE_RECEIVED] }],
}, async (request) => {
	console.log(request.body)
	return { status: 200 }
})

const report = session.createRequestReport({ url: 'https://cdn.example.com/movie/seg-1.m4s' }, { ot: CmcdObjectType.VIDEO, br: [3000] })

session.recordResponseReceived({
	request: report,
	status: 200,
	resourceTiming: { startTime: 1200, responseStart: 1280, duration: 400, encodedBodySize: 512000 },
}, { ttfbb: 95 })
```

## Errors, Startup Delay, and Stalls

`recordError()` sends an `e` report at once to each event target that lists `e`. Every other destination, request mode included, sends the error codes in `ec` with its next report.

Three more keys have a scope that one report cannot cover. The player passes them in the data of any call. The session sends them to every destination:

| Key | Rule |
|---|---|
| `msd` | The first valid value counts. Each destination sends it once, in its next report that can carry it. |
| `bs` | Each destination sends `bs` with its next report of the same object type. A report or a call without `ot` matches every object type. |
| `bsd` | Each destination adds the values to one list and sends the list with its next report. |

A valid `msd` is a finite number from 0 to 999,999,999,999,999 after rounding to an integer. The session ignores any other `msd`. The next report drops a waiting `bs`, `bsd`, or `ec` value that the version or `enabledKeys` does not allow. The session copies each waiting value, so a later change to the data of the caller does not change it.

```typescript
import { CmcdEventType, CmcdObjectType, CmcdPlayerState, createCmcdSession } from '@svta/cml-cmcd'

const session = createCmcdSession({
	eventTargets: [
		{ url: 'https://collector.example.com/errors', events: [CmcdEventType.ERROR] },
		{ url: 'https://collector.example.com/cmcd', events: [CmcdEventType.PLAY_STATE] },
	],
}, async (request) => {
	console.log(request.url, request.body)
	return { status: 200 }
})

session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.PLAYING, msd: 850 })
session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.REBUFFERING, bs: true })
session.recordError('MEDIA_ERR_NETWORK')
session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.PLAYING, bsd: [1200] })

const report = session.createRequestReport({ url: 'https://cdn.example.com/movie/seg-4.m4s' }, { ot: CmcdObjectType.VIDEO, d: 4000 })
console.log(decodeURIComponent(report.url))
```

The error target receives `e=e` with `ec`, `msd`, and `bs`. The other target receives each of the four keys once, with its `ps` reports. The request report has `msd`, `bs`, `bsd`, and `ec`.

## Select Reports with `filter`

A `filter` on an event target returns `true` for each report that the target receives. It runs before the session builds the report, so a rejected report uses no sequence number. For `rr` reports, the filter also receives the request of the response. A filter must not change its arguments, and its `DeepReadonly` types reject a change at any depth.

```typescript
import { CmcdEventType, createCmcdSession } from '@svta/cml-cmcd'

const settings = [
	{ url: 'https://collector.example.com/cmcd', includeInRequests: ['segment'], batchSize: 10 },
	{ url: 'https://collector.example.com/cmcd', includeInRequests: ['mpd'], batchSize: 1 },
]

const session = createCmcdSession({
	eventTargets: settings.map((target) => ({
		url: target.url,
		events: [CmcdEventType.RESPONSE_RECEIVED],
		batchSize: target.batchSize,
		filter: (report, request) => report.e !== CmcdEventType.RESPONSE_RECEIVED || target.includeInRequests.includes(request?.customData?.requestType),
	})),
}, async (request) => {
	console.log(request.body)
	return { status: 200 }
})

session.recordResponseReceived({ request: { url: 'https://cdn.example.com/movie/seg-1.m4s', customData: { requestType: 'segment' } }, status: 200 })
session.recordResponseReceived({ request: { url: 'https://cdn.example.com/movie.mpd', customData: { requestType: 'mpd' } }, status: 200 })
session.flush()
```

The first target receives only the segment response, and the second target receives only the manifest response. Both targets use one collector URL, so they share one sequence of `sn` values.

## Several Players, One Session

Several media players can share one session, because the session keeps no state for a player. Each player passes its own `cid`. During an interstitial, the primary player and the ad player report under one `sid`, with one sequence for each destination.

```typescript
import { CmcdEventType, createCmcdSession } from '@svta/cml-cmcd'

const session = createCmcdSession({
	eventTargets: [{
		url: 'https://collector.example.com/cmcd',
		events: [CmcdEventType.PLAY_STATE, CmcdEventType.AD_START],
	}],
}, async (request) => {
	console.log(request.body)
	return { status: 200 }
})

session.recordEvent(CmcdEventType.PLAY_STATE, { cid: 'movie-42', sta: 'a', nr: true })
session.recordEvent(CmcdEventType.AD_START, { cid: 'ad-7' })
session.recordEvent(CmcdEventType.PLAY_STATE, { cid: 'ad-7', sta: 'p' })
```

## Delivery

A target sends its queue when the queue reaches `batchSize`, and on `flush()`. An `e` report in the queue also makes the target send. One batch is one POST with the content type `application/cmcd`. The lines are joined with a line feed, with no line feed at the end.

A target has at most one POST in flight. Lines that arrive meanwhile wait in its queue. After the response, the target checks the send conditions again.

| Response | Action |
|---|---|
| 2xx | Done. The wait resets. |
| 410 | Every target with that URL stops for the life of the session. The session clears their queues and waiting values. It also drops a batch in flight to that URL. |
| 429, 5xx, a rejected request, or a requester that throws | The batch returns to the front of the queue, and the target waits before its next send. |
| Any other status | The session drops the batch. The wait resets. |

The wait starts at 1 second and doubles after each failure, up to 60 seconds. During the wait, new lines join the queue and go out with the retry. `flush()` sends at once, also during a wait. If a POST is in flight, `flush()` sends after its response. `stop()` clears the wait timers together with the interval timers. After `stop()`, a failure starts no timer.

During a long outage of a collector, the queues of its targets grow without a limit.

## Errors

Each call builds and encodes all of its reports before it changes any state. A call that throws changes no sequence number, no waiting value, and no queue.

- If a filter throws, no target receives the report, and the error goes to the caller.
- A value that the structured field encoder cannot serialize throws from the call that has it.
- An error in a timer tick, from `snapshot()` or from encoding, goes to the timer callback.
- A failed send does not throw. The [delivery](#delivery) table describes what happens instead.

`createCmcdSession()` throws for these configuration values:

| Parameter | Valid values |
|---|---|
| `sid` | A string of 1 to 64 characters |
| `cid` | A string of at most 128 characters |
| `url` of a target | A non-empty string |
| `interval` of a target | A finite number, 0 or more |
| `batchSize` of a target | A positive integer |

The message names the parameter, the valid values, and the received value: `createCmcdSession: eventTargets[1].batchSize must be a positive integer, received 0`.
````

- [ ] **Step 2: Write the migration guide**

Create `libs/cmcd/docs/migration-guide.md`:

````markdown
---
title: Migration Guide
description: How to move a player from CmcdReporter to createCmcdSession
---

# Migrating from `CmcdReporter`

The release that adds `createCmcdSession()` deprecates `CmcdReporter`, and version 3.0.0 removes it. This guide maps each member of `CmcdReporter` to the session API. The [session guide](session-guide.md) describes the session API.

## Before and After

`CmcdReporter` keeps the data of the player in a store. A change of `sta` in the store sends a `ps` event:

```typescript
import { CmcdEventType, CmcdReporter } from '@svta/cml-cmcd'

const reporter = new CmcdReporter({
	cid: 'movie-42',
	enabledKeys: ['bl', 'br', 'cid', 'd', 'ot', 'sid', 'sn', 'v'],
	eventTargets: [{
		url: 'https://collector.example.com/cmcd',
		events: [CmcdEventType.PLAY_STATE],
		enabledKeys: ['cid', 'e', 'sid', 'sn', 'sta', 'ts', 'v'],
	}],
}, async (request) => {
	console.log(request.body)
	return { status: 200 }
})

reporter.update({ sta: 'p', bl: [12000] })

const report = reporter.createRequestReport({ url: 'https://cdn.example.com/movie/seg-1.m4s' }, { ot: 'v', d: 4000, br: [3000] })
console.log(report.url)
```

The session keeps no store. The player keeps its data, passes it with each call, and sends the `ps` event itself:

```typescript
import type { Cmcd } from '@svta/cml-cmcd'
import { CmcdEventType, createCmcdSession } from '@svta/cml-cmcd'

const session = createCmcdSession({
	cid: 'movie-42',
	enabledKeys: ['bl', 'br', 'cid', 'd', 'ot', 'sid', 'sn', 'v'],
	eventTargets: [{
		url: 'https://collector.example.com/cmcd',
		events: [CmcdEventType.PLAY_STATE],
		enabledKeys: ['cid', 'e', 'sid', 'sn', 'sta', 'ts', 'v'],
	}],
}, async (request) => {
	console.log(request.body)
	return { status: 200 }
})

const state: Cmcd = { sta: 'p', bl: [12000] }

session.recordEvent(CmcdEventType.PLAY_STATE, state)

const report = session.createRequestReport({ url: 'https://cdn.example.com/movie/seg-1.m4s' }, { ...state, ot: 'v', d: 4000, br: [3000] })
console.log(report.url)
```

## Member Map

| `CmcdReporter` | Session API |
|---|---|
| `new CmcdReporter(config, requester)` | `createCmcdSession(config, requester)` |
| `sid`, `cid`, `version`, `transmissionMode`, `enabledKeys`, `customHeaderMap`, `eventTargets` | The same names and types: `CmcdRequestReportConfig` and `CmcdEventReportConfig` |
| `update(data)` for values that persist | The player keeps the values and passes them with each call |
| The events that `update()` fires for `sta`, `pr`, `cid`, `bg`, and `br` | The player compares the new value with the old value, then calls `recordEvent()` |
| `update({ sid })` | A new session. The player calls `flush()` and `stop()` on the old session. |
| `update({ msd })` | `msd` in the data of any call. The session sends it once to each destination. |
| The data store in `t` reports | `snapshot` |
| `recordEvent()`, `createRequestReport()`, `recordResponseReceived()` | The same methods. The data includes the values that persist. |
| `start()`, `stop()`, `flush()` | The same methods. `stop(true)` becomes `flush()` and then `stop()`. |
| `isRequestReportingEnabled()` | No equivalent. The player decides whether to call `createRequestReport()`. |
| `applyRequestReport()`, deprecated | `createRequestReport()` |
| `transform` on an event target, to drop reports | `filter` |
| `transform` on the request configuration, to drop reports | No `createRequestReport()` call for that request |
| `transform`, to change a report | Other data in the call. A change for one target only has no equivalent. |
| `sessionRetention` and the provenance record | The player keeps the old session object and records late responses there |
| A new reporter for new request settings | `configure()` |
| A new reporter for a new `sid` or new event targets | A new session |
| A new reporter for a new `cid` | `cid` in the data of each call |

## Differences to Check

- Without `enabledKeys`, the session reports every key. In the same case, `CmcdReporter` reports nothing in request mode and only the required keys on a target.
- The session sends no event by itself. The player compares each new value with the old value, then calls `recordEvent()`.
- The session reads `msd`, `bs`, and `bsd` from the data of any call and sends them to every destination. `CmcdReporter` reads `msd` from `update()` only.
- The session ignores `transform` and `sessionRetention`. Version 3.0.0 removes `transform` from the configuration types.
- Every target receives the same data. A `transform` that changes the report of one target has no equivalent, and neither has the `bg=?0` opt-in.
- After a failed send, a target waits from 1 to 60 seconds before the retry. `CmcdReporter` sends a failed batch again with the next send.
- During a migration, report each `sid` through one API only. Each API keeps its own sequence numbers.
````

- [ ] **Step 3: Add the README section**

In `libs/cmcd/README.md`, before the line ``## Testing CMCD output with `CmcdReportRecorder` ``, add:

````markdown
## Reporting from a player

`createCmcdSession()` adds CMCD data to the requests of a player and sends event reports to collectors. One session reports one `sid`. The player passes its CMCD data with each call.

```typescript
import type { Cmcd } from '@svta/cml-cmcd'
import { CmcdEventType, createCmcdSession } from '@svta/cml-cmcd'

const session = createCmcdSession({
	cid: 'movie-42',
	eventTargets: [{
		url: 'https://collector.example.com/cmcd',
		events: [CmcdEventType.PLAY_STATE, CmcdEventType.RESPONSE_RECEIVED],
	}],
}, async (request) => {
	console.log(request.body)
	return { status: 200 }
})

const state: Cmcd = { sta: 'p', bl: [12000], mtp: [25000] }

const report = session.createRequestReport({ url: 'https://cdn.example.com/movie/seg-1.m4s' }, { ...state, ot: 'v', d: 4000, br: [3000] })
console.log(report.url)

session.recordEvent(CmcdEventType.PLAY_STATE, { ...state, sta: 'r' })
session.recordResponseReceived({ request: report, status: 200 })
```

The [session guide](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/cmcd/docs/session-guide.md) describes the API. The [migration guide](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/cmcd/docs/migration-guide.md) maps each member of `CmcdReporter` to the session API.
````

- [ ] **Step 4: Add the changelog entry**

In `libs/cmcd/CHANGELOG.md`, under `## [Unreleased]`, add:

````markdown
### Added

- `createCmcdSession()` reports CMCD for one `sid`. The player passes its CMCD data with each call. The session keeps one sequence number for each destination, the event queues, and the timers. Its configuration uses the types of `CmcdReporter`: `CmcdRequestReportConfig` and `CmcdEventReportConfig`. The new `filter` of `CmcdEventReportConfig` selects the reports of an event target. The session guide and the migration guide describe the API
- `CMCD_EVENT_HOSTNAME` and `CmcdEventType.HOSTNAME` for the `h` event of CTA-5004-B

### Changed

- `enabledKeys` of `CmcdReportConfig` accepts a read-only array
````

- [ ] **Step 5: Run every code block of the documents**

Write this script to `<scratchpad>/doc-blocks.mts`:

```ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

const [outDir, ...files] = process.argv.slice(2)
mkdirSync(outDir, { recursive: true })

for (const file of files) {
	const text = readFileSync(file, 'utf8')
	const blocks = [...text.matchAll(/^```typescript\n([\s\S]*?)^```$/gm)].map((match) => match[1])
	blocks.forEach((code, i) => writeFileSync(join(outDir, `${basename(file, '.md')}-${i + 1}.ts`), code))
	console.log(file, blocks.length)
}
```

Extract the blocks, and run each block from the worktree root, so that `@svta/cml-cmcd` resolves to the built package:

```bash
node <scratchpad>/doc-blocks.mts <scratchpad>/doc-check libs/cmcd/README.md libs/cmcd/docs/session-guide.md libs/cmcd/docs/migration-guide.md
for f in <scratchpad>/doc-check/*.ts; do node --input-type=module-typescript < "$f" > /dev/null || echo "FAIL $f"; done
node --input-type=module-typescript < <scratchpad>/doc-check/session-guide-3.ts
```

Expected: the script finds 2 blocks in the README, 7 in the session guide, and 2 in the migration guide. No block prints `FAIL`. The last command prints the two lines that the comments of the third session guide block show:

```text
https://cdn.example.com/movie/seg-2.m4s?CMCD=br=(3000),d=4000,nor=("seg-3.m4s"),ot=v,sid="session-1",sn=0,v=2
sn=1
```

- [ ] **Step 6: Build the docs**

```bash
npm run build -w docs
```

Expected: 0 errors. The warnings are the same 18 as on `main`: 17 for package `docs/*.md` globs that match no file, and one for the example tag in `validateCmcdEventReport.ts`.

- [ ] **Step 7: Commit**

```bash
git add libs/cmcd/docs/session-guide.md libs/cmcd/docs/migration-guide.md libs/cmcd/README.md libs/cmcd/CHANGELOG.md
git commit -s -m "docs(cmcd): add the session guide and the migration guide" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 11: Verification and Push

**Files:** none. The scripts go to the session scratchpad.

- [ ] **Step 1: Run the root test**

```bash
npm test
```

Expected: lint, the build of every package, the typecheck, and every package test pass.

- [ ] **Step 2: Review the API report**

```bash
git diff origin/main -- libs/cmcd/config/cml-cmcd.api.md
```

Expected: the diff has these changes, and nothing else:

- `CMCD_EVENT_HOSTNAME: "h"`, and `HOSTNAME` in `CmcdEventType`
- `enabledKeys?: readonly CmcdKey[]` in `CmcdReportConfig`, and `filter?: CmcdReportFilter` in `CmcdEventReportConfig`
- `CmcdReportFilter = (report: DeepReadonly<Cmcd>, request?: DeepReadonly<HttpRequest>) => boolean`
- `CmcdSession` with `sid`, `createRequestReport`, `recordEvent`, `recordResponseReceived`, `recordError`, `configure`, `start`, `stop`, and `flush`
- `CmcdSessionConfig = CmcdRequestReportConfig & { sid?, cid?, eventTargets?: readonly CmcdEventReportConfig[], snapshot? }`, and `configure(settings: CmcdRequestReportConfig)` in `CmcdSession`
- `createCmcdSession(config?: CmcdSessionConfig, requester?: (request: HttpRequest) => Promise<{ status: number; }>): CmcdSession`

The diff must have no `ae-forgotten-export` warning. Compare each declaration with the section "Types" of the RFC.

- [ ] **Step 3: Measure the bundle**

Write the three entry files and bundle them from the worktree root:

```bash
S=<scratchpad>/bundle
mkdir -p $S
D=$(pwd)/libs/cmcd/dist/index.js
printf "import { createCmcdSession } from '%s'\nglobalThis.x = createCmcdSession\n" "$D" > $S/session.mjs
printf "import { CmcdReporter } from '%s'\nglobalThis.x = CmcdReporter\n" "$D" > $S/reporter.mjs
printf "import { CmcdReporter, createCmcdSession } from '%s'\nglobalThis.x = [CmcdReporter, createCmcdSession]\n" "$D" > $S/both.mjs
for name in session reporter both; do npx rolldown $S/$name.mjs --format esm --minify --file $S/$name.min.js > /dev/null && printf "%s %s B\n" $name $(gzip -9 -c $S/$name.min.js | wc -c); done
```

Expected: about 6.9 KB for the session, 8.7 KB for `CmcdReporter`, and 10.5 KB for both. If the session measures more than 7.5 KB, stop and report.

- [ ] **Step 4: Run the bare-import probes**

```bash
printf "import './libs/cmcd/dist/index.js'\n" > temp-bare-probe.mjs
npx rollup temp-bare-probe.mjs --format es --file <scratchpad>/probe/rollup.js --silent
npx tsdown temp-bare-probe.mjs --format esm --out-dir <scratchpad>/probe/tsdown --no-dts -l warn --external @svta/cml-utils --external @svta/cml-structured-field-values
rm temp-bare-probe.mjs
cat <scratchpad>/probe/rollup.js <scratchpad>/probe/tsdown/temp-bare-probe.js
```

Expected: each output has only the two import lines of `@svta/cml-structured-field-values` and `@svta/cml-utils`, and the tsdown output also has an empty `export {  };`.

- [ ] **Step 5: Compare the speed with `CmcdReporter`**

Write this script to `<scratchpad>/bench.mjs`:

```js
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const { CmcdReporter, createCmcdSession } = await import(pathToFileURL(join(process.argv[2], 'libs/cmcd/dist/index.js')).href)

const keys = ['br', 'bl', 'cid', 'd', 'mtp', 'nor', 'ot', 'sf', 'sid', 'sn', 'st', 'sta', 'su', 'tb', 'v']
const data = { br: [3000], bl: [12000], d: 4000, mtp: [25000], nor: ['https://cdn.example.com/movie/seg-3.m4s'], ot: 'v', sf: 'd', st: 'v', sta: 'p', tb: [6000], cid: 'movie-42' }
const request = { url: 'https://cdn.example.com/movie/seg-2.m4s' }
const session = createCmcdSession({ sid: 'session-1', enabledKeys: keys })
const reporter = new CmcdReporter({ sid: 'session-1', enabledKeys: keys }, async () => ({ status: 200 }))

const sessionUrl = session.createRequestReport(request, data).url
const reporterUrl = reporter.createRequestReport(request, data).url
console.log('same output:', sessionUrl === reporterUrl)

function bench(name, fn) {
	for (let i = 0; i < 20000; i++) {
		fn()
	}

	const runs = []

	for (let run = 0; run < 5; run++) {
		const start = process.hrtime.bigint()

		for (let i = 0; i < 50000; i++) {
			fn()
		}

		runs.push(Number(process.hrtime.bigint() - start) / 50000 / 1000)
	}

	runs.sort((x, y) => x - y)
	console.log(name, runs[2].toFixed(2), 'µs, median of 5 runs')
}

bench('session', () => session.createRequestReport(request, data))
bench('reporter', () => reporter.createRequestReport(request, data))
```

```bash
node <scratchpad>/bench.mjs "$(pwd)"
```

Expected: `same output: true`. The session takes about half the time of `CmcdReporter`. If the session is slower than `CmcdReporter`, stop and report.

- [ ] **Step 6: Record the results and push**

Add the numbers of Steps 3 and 5 to the log of the roadmap. Check the state of the branch, and push:

```bash
git status --short
git push -u origin feat/cmcd-session
```

Casey opens the PR with `/create-pr main`.
