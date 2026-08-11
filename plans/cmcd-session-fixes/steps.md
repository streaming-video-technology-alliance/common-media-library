# CmcdReporter Session-Integrity Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the six verified `CmcdReporter` session-integrity bugs (issues #408, #409, #410) and land the two behavior-pinning tests from the child-reporters RFC, ahead of the child-reporters feature.

**Architecture:** All changes are internal to `libs/cmcd/src/CmcdReporter.ts` (see `design.md` in this folder). `sid` moves into a private reporter field stamped onto every report after transforms; `msd` gains real validation, session-reset clearing, and filter-aware gate consumption; HTTP 410 disposal becomes session-scoped via a `disposed` flag and a session epoch. No public API changes.

**Tech Stack:** TypeScript 5.8 strict, `node:test` + `node:assert`, Node >= 24, npm workspaces. Tests import the built `dist/` output.

## Global Constraints

- Build before testing: `npm run build -w libs/cmcd` (tests import `@svta/cml-cmcd` from `dist/`).
- Run tests: `npm test -w libs/cmcd`. Full validation: `npm test` at the root.
- Every commit: conventional format, `git commit -s`, trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Issue references (`Refs #408` etc.) go in commit bodies, not subjects.
- No em dashes in any file. No new public exports. `libs/cmcd/config/cml-cmcd.api.md` must be unchanged.
- Test style: import from `@svta/cml-cmcd` (never relative paths), reuse `createMockRequester`, `createConfig`, `EVENT_KEYS`, `RR_KEYS`, and the `mock.timers` idiom from `libs/cmcd/test/CmcdReporter.test.ts`.
- Pin tests (Task 1) must PASS against current code. Fix tests (Tasks 2-6) must FAIL first, then pass after the fix.

---

### Task 1: Land-first pin tests

**Files:**
- Modify: `libs/cmcd/test/CmcdReporter.test.ts` (the empty `resets session when sid changes` test at ~line 118; new re-queue test in the `event target response handling` describe at ~line 2469)

**Interfaces:**
- Consumes: current `CmcdReporter` behavior only.
- Produces: pinned behavior later tasks must not break: per-mode `sn` reset on `sid` change; re-queued batches re-sent as-is after later-`sn` batches.

- [x] **Step 1: Replace the assertion-less sid-change test**

Replace the body of `it('resets session when sid changes', ...)`:

```ts
it('resets session when sid changes', async () => {
	const { requester, requests } = createMockRequester()
	const reporter = new CmcdReporter(createConfig(), requester)

	reporter.recordEvent(CmcdEventType.ERROR)
	reporter.recordEvent(CmcdEventType.ERROR)
	const before = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

	await new Promise(resolve => setTimeout(resolve, 10))

	equal(requests.length, 2)
	ok((requests[0].body as string).includes('sn=0'))
	ok((requests[1].body as string).includes('sn=1'))
	ok((requests[1].body as string).includes('sid="test-session"'))
	ok(before.url.includes('sn%3D0'))
	ok(before.url.includes('sid%3D%22test-session%22'))

	reporter.update({ sid: 'new-session' })

	// Both mode counters restart at 0 and reports carry the new sid.
	reporter.recordEvent(CmcdEventType.ERROR)
	const after = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

	await new Promise(resolve => setTimeout(resolve, 10))

	equal(requests.length, 3)
	ok((requests[2].body as string).includes('sn=0'))
	ok((requests[2].body as string).includes('sid="new-session"'))
	ok(after.url.includes('sn%3D0'))
	ok(after.url.includes('sid%3D%22new-session%22'))
})
```

- [x] **Step 2: Add the re-queue ordering pin test**

Add to the `describe('event target response handling', ...)` block:

```ts
it('re-sends a re-queued batch after later batches have already been delivered', async () => {
	const requests: HttpRequest[] = []
	const pending: Array<(response: { status: number; }) => void> = []
	const requester = (request: HttpRequest): Promise<{ status: number; }> => {
		requests.push(request)
		return new Promise(resolve => pending.push(resolve))
	}

	const reporter = new CmcdReporter(createConfig(), requester)

	reporter.recordEvent(CmcdEventType.ERROR)
	reporter.recordEvent(CmcdEventType.ERROR)
	equal(requests.length, 2)

	// The second batch is delivered while the first is still in flight,
	// then the first fails with 429 and goes back on the queue.
	pending[1]({ status: 200 })
	pending[0]({ status: 429 })
	await new Promise(resolve => setTimeout(resolve, 10))

	// Nothing is re-sent until the next queue processing pass.
	equal(requests.length, 2)

	reporter.flush()
	await new Promise(resolve => setTimeout(resolve, 10))

	equal(requests.length, 3)
	ok((requests[0].body as string).includes('sn=0'))
	ok((requests[1].body as string).includes('sn=1'))
	// The re-queued batch goes out as-is: sn=0 after sn=1 was already
	// delivered. Delivery order is not guaranteed; sn orders the stream.
	ok((requests[2].body as string).includes('sn=0'))
	pending[2]({ status: 200 })
})
```

- [x] **Step 3: Build and run, expect PASS (these pin current behavior)**

Run: `npm run build -w libs/cmcd && npm test -w libs/cmcd`
Expected: PASS. If either fails, current understanding of the code is wrong: stop and investigate before continuing.

- [x] **Step 4: Commit**

```bash
git add libs/cmcd/test/CmcdReporter.test.ts
git commit -s -m "test(cmcd): pin re-queue ordering and session reset behavior"
```

---

### Task 2: msd validation (#409 part 1)

**Files:**
- Modify: `libs/cmcd/src/CmcdReporter.ts` (`update()`, ~line 434)
- Test: `libs/cmcd/test/CmcdReporter.test.ts` (new `describe('msd validation', ...)` inside the `update` describe)

**Interfaces:**
- Produces: `this.msd` only ever holds `NaN` or a finite non-negative integer. Later tasks rely on this (the gate check stays `!isNaN(this.msd)`).

- [x] **Step 1: Write the failing tests**

```ts
describe('msd validation', () => {
	const cases = [
		{ name: 'accepts 0 as a valid instant-start value', input: 0, wire: 'msd%3D0' },
		{ name: 'rounds fractional milliseconds to the nearest integer', input: 12.5, wire: 'msd%3D13' },
		{ name: 'rejects Infinity', input: Infinity, wire: null },
		{ name: 'rejects negative values', input: -1, wire: null },
		{ name: 'rejects NaN', input: NaN, wire: null },
	] as const

	for (const { name, input, wire } of cases) {
		it(name, () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['sid', 'msd', 'v'],
			}, requester)

			reporter.update({ msd: input })

			const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

			if (wire) {
				ok(req.url.includes(wire), `expected ${req.url} to include ${wire}`)
			}
			else {
				ok(!req.url.includes('msd'), `expected ${req.url} to omit msd`)
			}
		})
	}

	it('does not let a rejected value consume the once-per-session gate', () => {
		const { requester } = createMockRequester()
		const reporter = new CmcdReporter({
			sid: 'test-session',
			enabledKeys: ['sid', 'msd', 'v'],
		}, requester)

		reporter.update({ msd: Infinity })
		const first = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
		ok(!first.url.includes('msd'))

		reporter.update({ msd: 800 })
		const second = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
		ok(second.url.includes('msd%3D800'))
	})
})
```

- [x] **Step 2: Run, expect FAIL**

Run: `npm run build -w libs/cmcd && npm test -w libs/cmcd`
Expected failures: `accepts 0` (rejected today), `rounds fractional` (12.5 goes out unrounded), `rejects negative` (-1 goes out), `gate` test (Infinity consumes `msdSent`). The `Infinity` and `NaN` wire cases pass today (the encoder drops non-finite values); they pin the table.

- [x] **Step 3: Implement**

In `update()`, replace:

```ts
if (data.msd && !isNaN(data.msd)) {
	this.msd = data.msd
}
```

with:

```ts
const { msd } = data

// CTA-5004-B defines msd as integer milliseconds, sent once per session.
// 0 is a valid instant-start value; anything non-finite or negative is
// ignored so it can neither reach the wire nor consume the send gate.
if (typeof msd === 'number' && Number.isFinite(msd) && msd >= 0) {
	this.msd = Math.round(msd)
}
```

Extend the `update()` TSDoc `@param data` section with one sentence: `msd` must be a finite, non-negative number of milliseconds; it is rounded to the nearest integer, and invalid values are ignored.

- [x] **Step 4: Run, expect PASS**

Run: `npm run build -w libs/cmcd && npm test -w libs/cmcd`
Expected: PASS, including the whole existing suite.

- [x] **Step 5: Commit**

```bash
git add libs/cmcd/src/CmcdReporter.ts libs/cmcd/test/CmcdReporter.test.ts
git commit -s -m "fix(cmcd): validate msd as finite non-negative integer milliseconds"
```

Body: `Refs #409.`

---

### Task 3: Session-owned sid and msd stamping (#408)

**Files:**
- Modify: `libs/cmcd/src/CmcdReporter.ts` (field declarations, constructor, `update()`, `recordTargetEvent()`, `queueTargetEvent()`, `createRequestReport()`)
- Modify: `libs/cmcd/src/CmcdEventReportTransform.ts`, `libs/cmcd/src/CmcdRequestReportTransform.ts` (contract TSDoc)
- Modify: `libs/cmcd/docs/user-guide.md` (transform contract bullet, if it lists the stamped keys)
- Test: `libs/cmcd/test/CmcdReporter.test.ts` (new `describe('reserved session keys', ...)`)

**Interfaces:**
- Consumes: Task 2's invariant (`this.msd` is `NaN` or a valid integer).
- Produces: `private sid: string` (canonical session ID; `this.data` no longer carries `sid`); every queued/prepared report has `sid` stamped post-transform; `msd` on a report is exclusively gate-produced. Task 4 reshapes the gate; Task 5/6 rely on `this.sid` existing.

- [x] **Step 1: Write the failing tests**

```ts
describe('reserved session keys', () => {
	it('stamps the reporter sid over a per-call sid on recordEvent', async () => {
		const { requester, requests } = createMockRequester()
		const reporter = new CmcdReporter(createConfig(), requester)

		reporter.recordEvent(CmcdEventType.ERROR, { sid: 'INJECTED' })

		await new Promise(resolve => setTimeout(resolve, 10))

		equal(requests.length, 1)
		ok((requests[0].body as string).includes('sid="test-session"'))
		ok(!(requests[0].body as string).includes('INJECTED'))
	})

	it('stamps the reporter sid over a per-call sid on recordResponseReceived', async () => {
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

	it('stamps the reporter sid over a per-call sid on createRequestReport', () => {
		const { requester } = createMockRequester()
		const reporter = new CmcdReporter(createConfig(), requester)

		const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' }, { sid: 'INJECTED' })

		ok(req.url.includes('sid%3D%22test-session%22'))
		ok(!req.url.includes('INJECTED'))
	})

	it('stamps the reporter sid over a transform-written sid in event mode', async () => {
		const { requester, requests } = createMockRequester()
		const reporter = new CmcdReporter(createConfig({
			eventTargets: [{
				url: 'https://example.com/cmcd',
				events: [CmcdEventType.ERROR],
				enabledKeys: [...EVENT_KEYS],
				batchSize: 1,
				transform: report => ({ ...report, sid: 'EVIL' }),
			}],
		}), requester)

		reporter.recordEvent(CmcdEventType.ERROR)

		await new Promise(resolve => setTimeout(resolve, 10))

		equal(requests.length, 1)
		ok((requests[0].body as string).includes('sid="test-session"'))
		ok(!(requests[0].body as string).includes('EVIL'))
	})

	it('stamps the reporter sid over a transform-written sid in request mode', () => {
		const { requester } = createMockRequester()
		const reporter = new CmcdReporter(createConfig({
			transform: data => ({ ...data, sid: 'EVIL' }),
		}), requester)

		const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

		ok(req.url.includes('sid%3D%22test-session%22'))
		ok(!req.url.includes('EVIL'))
	})

	it('shows transforms the canonical sid even when a per-call sid is supplied', async () => {
		const { requester } = createMockRequester()
		const seen: Array<string | undefined> = []
		const reporter = new CmcdReporter(createConfig({
			eventTargets: [{
				url: 'https://example.com/cmcd',
				events: [CmcdEventType.ERROR],
				enabledKeys: [...EVENT_KEYS],
				batchSize: 1,
				transform: (report) => {
					seen.push(report.sid)
					return report
				},
			}],
		}), requester)

		reporter.recordEvent(CmcdEventType.ERROR, { sid: 'INJECTED' })

		await new Promise(resolve => setTimeout(resolve, 10))

		deepEqual(seen, ['test-session'])
	})

	it('strips a per-call msd when the gate is closed on recordEvent', async () => {
		const { requester, requests } = createMockRequester()
		const reporter = new CmcdReporter(createConfig(), requester)

		reporter.recordEvent(CmcdEventType.ERROR, { msd: 5000 })

		await new Promise(resolve => setTimeout(resolve, 10))

		equal(requests.length, 1)
		ok(!(requests[0].body as string).includes('msd'))
	})

	it('strips a per-call msd when the gate is closed on recordResponseReceived', async () => {
		const { requester, requests } = createMockRequester()
		const reporter = new CmcdReporter(createConfig({
			eventTargets: [{
				url: 'https://example.com/cmcd',
				events: [CmcdEventType.RESPONSE_RECEIVED],
				enabledKeys: [...RR_KEYS, 'msd'],
				batchSize: 1,
			}],
		}), requester)

		reporter.recordResponseReceived({
			status: 200,
			request: { url: 'https://cdn.example.com/segment.mp4' },
		}, { msd: 5000 })

		await new Promise(resolve => setTimeout(resolve, 10))

		equal(requests.length, 1)
		ok(!(requests[0].body as string).includes('msd'))
	})

	it('strips a per-call msd when the gate is closed on createRequestReport', () => {
		const { requester } = createMockRequester()
		const reporter = new CmcdReporter(createConfig(), requester)

		const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' }, { msd: 5000 })

		ok(!req.url.includes('msd'))
	})

	it('sends the canonical msd when a per-call msd rides an open gate', async () => {
		const { requester, requests } = createMockRequester()
		const reporter = new CmcdReporter(createConfig(), requester)

		reporter.update({ msd: 800 })
		reporter.recordEvent(CmcdEventType.ERROR, { msd: 5000 })

		await new Promise(resolve => setTimeout(resolve, 10))

		equal(requests.length, 1)
		ok((requests[0].body as string).includes('msd=800'))
		ok(!(requests[0].body as string).includes('5000'))
	})

	it('strips a transform-written msd when the gate is closed', async () => {
		const { requester, requests } = createMockRequester()
		const reporter = new CmcdReporter(createConfig({
			eventTargets: [{
				url: 'https://example.com/cmcd',
				events: [CmcdEventType.ERROR],
				enabledKeys: [...EVENT_KEYS],
				batchSize: 1,
				transform: report => ({ ...report, msd: 4444 }),
			}],
		}), requester)

		reporter.recordEvent(CmcdEventType.ERROR)

		await new Promise(resolve => setTimeout(resolve, 10))

		equal(requests.length, 1)
		ok(!(requests[0].body as string).includes('msd'))
	})

	it('ignores update({ sid: undefined }) and keeps reporting under the current sid', async () => {
		const { requester, requests } = createMockRequester()
		const reporter = new CmcdReporter(createConfig(), requester)

		reporter.recordEvent(CmcdEventType.ERROR)
		reporter.update({ sid: undefined })
		reporter.recordEvent(CmcdEventType.ERROR)

		await new Promise(resolve => setTimeout(resolve, 10))

		equal(requests.length, 2)
		ok((requests[1].body as string).includes('sid="test-session"'))
		// No session reset happened: the sequence number kept counting.
		ok((requests[1].body as string).includes('sn=1'))
	})
})
```

- [x] **Step 2: Run, expect FAIL**

Run: `npm run build -w libs/cmcd && npm test -w libs/cmcd`
Expected: every test in the new describe fails except `sends the canonical msd when a per-call msd rides an open gate` (the gate already overwrites it today; that one pins the winner).

- [x] **Step 3: Implement**

In `libs/cmcd/src/CmcdReporter.ts`:

1. Field and constructor:

```ts
private sid: string
```

```ts
constructor(config: Partial<CmcdReporterConfig<C>>, requester: (request: HttpRequest) => Promise<{ status: number; }> = defaultRequester) {
	this.config = createCmcdReporterConfig(config)
	this.sid = this.config.sid
	this.data = {
		cid: this.config.cid,
		v: this.config.version,
	}
	// ... rest unchanged
```

2. `update()`: adopt the new sid into the field and strip both session-owned keys from the store:

```ts
update(data: Partial<Cmcd>): void {
	if (data.sid && data.sid !== this.sid) {
		this.resetSession()
		this.sid = data.sid
	}

	const { msd } = data

	// (validation block from Task 2 unchanged)

	// sid and msd are session-owned: tracked in their own fields, stripped
	// from the persistent store, and stamped onto each report at queue time.
	this.data = { ...this.data, ...data, sid: undefined, msd: undefined }

	// (state-field loop unchanged)
}
```

3. `recordTargetEvent()`: stamp the canonical sid into the pre-transform merge so transforms keep seeing it:

```ts
const item: Cmcd = {
	...this.data,
	...data,
	sid: this.sid,
	e: type,
	ts: data.ts ?? Date.now(),
}
```

4. `queueTargetEvent()`: stamp `sid` and make `msd` gate-exclusive:

```ts
private queueTargetEvent(target: CmcdEventTarget, report: Cmcd, type: CmcdEventType): void {
	report.e = type
	report.sn = target.sn++
	report.sid = this.sid

	// msd may only ride a report through the once-per-target gate; a value
	// smuggled in via per-call data or a transform is stripped, so the gate
	// stays the single source of once-per-session semantics.
	if (!isNaN(this.msd) && !target.msdSent) {
		report.msd = this.msd
		target.msdSent = true
	}
	else {
		delete report.msd
	}

	target.queue.push(report)
}
```

5. `createRequestReport()`: stamp into the merge and after the transform:

```ts
const merged: Cmcd = { ...this.data, ...data, sid: this.sid }
```

```ts
// Reporter-owned fields are stamped after the transform runs.
cmcdData.sn = this.requestTarget.sn++
cmcdData.sid = this.sid

if (!isNaN(this.msd) && !this.requestTarget.msdSent) {
	cmcdData.msd = this.msd
	this.requestTarget.msdSent = true
}
else {
	delete cmcdData.msd
}
```

6. TSDoc: on `update()`, note that `sid` and `msd` are session-owned and stamped by the reporter (a per-call value on `recordEvent()`, `recordResponseReceived()`, or `createRequestReport()` has no effect); on `recordEvent()`'s `@param data`, the same one-liner. In `CmcdEventReportTransform.ts` change "The reporter re-stamps `e` and assigns `sn` and `msd` after this function returns" to "The reporter re-stamps `e` and `sid`, and assigns `sn` and `msd` after this function returns"; in `CmcdRequestReportTransform.ts` add `sid` to the equivalent sentence. If `libs/cmcd/docs/user-guide.md` states the stamped-keys contract (search for "stamped after"), add `sid` there too.

- [x] **Step 4: Run, expect PASS**

Run: `npm run build -w libs/cmcd && npm test -w libs/cmcd`
Expected: PASS, including the whole existing suite (wire output for well-behaved callers is unchanged).

- [x] **Step 5: Commit**

```bash
git add libs/cmcd/src libs/cmcd/docs libs/cmcd/test/CmcdReporter.test.ts
git commit -s -m "fix(cmcd): stamp session-owned sid and msd after caller data and transforms"
```

Body: `Refs #408. Also makes update({ sid: undefined }) a no-op, since reports now carry the reporter-held sid.`

---

### Task 4: Filter-aware msd gate consumption (#409 part 3)

**Files:**
- Modify: `libs/cmcd/src/CmcdReporter.ts` (`queueTargetEvent()` signature and gate, its two call sites in `recordTargetEvent()`, the post-transform block in `createRequestReport()`)
- Test: `libs/cmcd/test/CmcdReporter.test.ts` (new tests in an `msd gate` describe)

**Interfaces:**
- Consumes: Task 3's gate shape (`report.msd` is gate-exclusive).
- Produces: `queueTargetEvent(target, config, report, type)` (config added). `msdSent` flips only when the output retains `msd`. Task 5 resets these flags; Task 6 does not touch them.

- [x] **Step 1: Write the failing tests**

```ts
describe('msd gate', () => {
	it('does not consume the gate when msd is not an enabled key in request mode', () => {
		const { requester } = createMockRequester()
		const reporter = new CmcdReporter({
			sid: 'test-session',
			enabledKeys: ['sid', 'v'],
		}, requester)

		reporter.update({ msd: 800 })
		const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

		ok(!req.url.includes('msd'))
		// The gate must stay open: the report never carried msd. Asserted on
		// the private flag because a fixed config has no observable follow-up.
		equal((reporter as unknown as { requestTarget: { msdSent: boolean; }; }).requestTarget.msdSent, false)
	})

	it('does not consume a target gate when msd is not in the target enabledKeys', async () => {
		const { requester, requests } = createMockRequester()
		const reporter = new CmcdReporter(createConfig({
			eventTargets: [
				{
					url: 'https://example.com/cmcd-no-msd',
					events: [CmcdEventType.ERROR],
					enabledKeys: ['sid', 'v', 'e', 'ts', 'sn'],
					batchSize: 1,
				},
				{
					url: 'https://example.com/cmcd-msd',
					events: [CmcdEventType.ERROR],
					enabledKeys: [...EVENT_KEYS],
					batchSize: 1,
				},
			],
		}), requester)

		reporter.update({ msd: 800 })
		reporter.recordEvent(CmcdEventType.ERROR)

		await new Promise(resolve => setTimeout(resolve, 10))

		equal(requests.length, 2)
		ok(!(requests[0].body as string).includes('msd'))
		ok((requests[1].body as string).includes('msd=800'))

		const targets = [...(reporter as unknown as { eventTargets: Map<unknown, { msdSent: boolean; }>; }).eventTargets.values()]
		equal(targets[0].msdSent, false)
		equal(targets[1].msdSent, true)
	})
})
```

- [x] **Step 2: Run, expect FAIL**

Run: `npm run build -w libs/cmcd && npm test -w libs/cmcd`
Expected: both fail on the `msdSent` assertions (`true` today).

- [x] **Step 3: Implement**

1. `queueTargetEvent()` takes the target config and checks its key filter. `msd` is never force-added by `prepareCmcdData`, so `enabledKeys` is exactly the encode-time survival condition. Consumption must stay at enqueue time or a batch could stamp `msd` twice before the first send:

```ts
private queueTargetEvent(target: CmcdEventTarget, config: CmcdEventReportConfigNormalized<C>, report: Cmcd, type: CmcdEventType): void {
	report.e = type
	report.sn = target.sn++
	report.sid = this.sid

	// msd may only ride a report through the once-per-target gate, and only
	// when the target's key filter will retain it; consuming the gate for a
	// report that filters msd out would silently drop it for the session.
	if (!isNaN(this.msd) && !target.msdSent && config.enabledKeys?.includes('msd')) {
		report.msd = this.msd
		target.msdSent = true
	}
	else {
		delete report.msd
	}

	target.queue.push(report)
}
```

Update both call sites in `recordTargetEvent()`: `this.queueTargetEvent(target, config, item, type)` and `this.queueTargetEvent(target, config, report, type)`.

2. `createRequestReport()`: flip the flag only after preparation retained `msd`:

```ts
// msd may only ride a report through the once-per-session gate; a value
// smuggled in via per-call data or the transform is stripped. The gate is
// consumed after preparation, and only if the key filter retained msd.
const sendMsd = !isNaN(this.msd) && !this.requestTarget.msdSent

if (sendMsd) {
	cmcdData.msd = this.msd
}
else {
	delete cmcdData.msd
}

const url = new URL(report.url)
const options = createEncodingOptions(CMCD_REQUEST_MODE, this.config, report.url)

const cmcd = report.customData.cmcd = prepareCmcdData(cmcdData, options)

if (sendMsd && cmcd.msd !== undefined) {
	this.requestTarget.msdSent = true
}
```

- [x] **Step 4: Run, expect PASS**

Run: `npm run build -w libs/cmcd && npm test -w libs/cmcd`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add libs/cmcd/src/CmcdReporter.ts libs/cmcd/test/CmcdReporter.test.ts
git commit -s -m "fix(cmcd): consume the msd gate only when the report retains msd"
```

Body: `Refs #409.`

---

### Task 5: Session reset clears msd state (#409 part 2)

**Files:**
- Modify: `libs/cmcd/src/CmcdReporter.ts` (`resetSession()`)
- Test: `libs/cmcd/test/CmcdReporter.test.ts` (in the `msd gate` describe)

**Interfaces:**
- Consumes: `this.sid` (Task 3), gate flags (Task 4).
- Produces: `resetSession()` clears `this.msd` and every `msdSent` flag. Task 6 extends the same method.

- [x] **Step 1: Write the failing tests**

```ts
it('re-arms the msd gate when the session changes', async () => {
	const { requester, requests } = createMockRequester()
	const reporter = new CmcdReporter(createConfig(), requester)

	reporter.update({ msd: 800 })
	reporter.recordEvent(CmcdEventType.ERROR)
	const first = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

	reporter.update({ sid: 'new-session', msd: 950 })
	reporter.recordEvent(CmcdEventType.ERROR)
	const second = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

	await new Promise(resolve => setTimeout(resolve, 10))

	equal(requests.length, 2)
	ok((requests[0].body as string).includes('msd=800'))
	ok(first.url.includes('msd%3D800'))
	ok((requests[1].body as string).includes('msd=950'))
	ok(second.url.includes('msd%3D950'))
})

it('clears an unsent msd when the session changes', () => {
	const { requester } = createMockRequester()
	const reporter = new CmcdReporter(createConfig(), requester)

	reporter.update({ msd: 800 })
	reporter.update({ sid: 'new-session' })

	const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

	// The stored msd belonged to the previous session and was never sent;
	// it must not leak into the new one.
	ok(!req.url.includes('msd'))
})
```

- [x] **Step 2: Run, expect FAIL**

Run: `npm run build -w libs/cmcd && npm test -w libs/cmcd`
Expected: `re-arms` fails (second reports carry no msd today); `clears an unsent msd` fails (msd=800 leaks into the new session today).

- [x] **Step 3: Implement**

```ts
private resetSession(): void {
	// msd is once per Session ID: a new session re-arms the gate, and a
	// stored-but-unsent value from the old session must not leak forward.
	this.msd = NaN

	this.eventTargets.forEach((target) => {
		target.sn = 0
		target.msdSent = false
	})

	this.requestTarget.sn = 0
	this.requestTarget.msdSent = false
	this.lastEmitted = {}
}
```

- [x] **Step 4: Run, expect PASS**

Run: `npm run build -w libs/cmcd && npm test -w libs/cmcd`
Expected: PASS. (`update({ sid, msd })` in one call works because the reset runs before the msd guard in `update()`.)

- [x] **Step 5: Commit**

```bash
git add libs/cmcd/src/CmcdReporter.ts libs/cmcd/test/CmcdReporter.test.ts
git commit -s -m "fix(cmcd): clear msd state on session reset"
```

Body: `Refs #409.`

---

### Task 6: Session-scoped HTTP 410 disposal (#410)

**Files:**
- Modify: `libs/cmcd/src/CmcdReporter.ts` (`CmcdEventTarget` type, constructor init, `start()`, `stop()`, new `armInterval()`, `recordTargetEvent()`, `processEventTargets()`, `sendEventReport()`, `disposeEventTarget()`, `resetSession()`)
- Test: `libs/cmcd/test/CmcdReporter.test.ts` (in `describe('event target response handling', ...)`)

**Interfaces:**
- Consumes: `resetSession()` from Task 5.
- Produces: `CmcdEventTarget.disposed: boolean`; `private sessionEpoch: number`; `private started: boolean`; `private armInterval(target, config): boolean`.

- [x] **Step 1: Write the failing tests**

```ts
it('restores a 410-disposed target when the session changes', async () => {
	const { requester, requests } = createMockRequester(410)
	const reporter = new CmcdReporter(createConfig(), requester)

	reporter.recordEvent(CmcdEventType.ERROR)
	await new Promise(resolve => setTimeout(resolve, 10))
	equal(requests.length, 1)

	// Disposed for the remainder of the session: nothing more is sent.
	reporter.recordEvent(CmcdEventType.ERROR)
	await new Promise(resolve => setTimeout(resolve, 10))
	equal(requests.length, 1)

	// A new session lifts the suppression.
	reporter.update({ sid: 'new-session' })
	reporter.recordEvent(CmcdEventType.ERROR)
	await new Promise(resolve => setTimeout(resolve, 10))
	equal(requests.length, 2)
	ok((requests[1].body as string).includes('sid="new-session"'))
	ok((requests[1].body as string).includes('sn=0'))
})

it('re-arms a disposed target interval on session change while started', async () => {
	const timers = mock.timers
	timers.enable({ apis: ['setInterval'] })

	const { requester, requests } = createMockRequester(410)
	const reporter = new CmcdReporter(createConfig({
		eventTargets: [{
			url: 'https://example.com/cmcd',
			events: [CmcdEventType.TIME_INTERVAL],
			enabledKeys: [...EVENT_KEYS],
			interval: 30,
			batchSize: 1,
		}],
	}), requester)

	reporter.start()
	equal(requests.length, 1)
	await new Promise(resolve => setTimeout(resolve, 10))

	// The 410 disposed the target: the interval is dead.
	timers.tick(30_000)
	equal(requests.length, 1)

	reporter.update({ sid: 'new-session' })
	// Restoration does not fire an immediate report; the next tick does.
	equal(requests.length, 1)

	timers.tick(30_000)
	equal(requests.length, 2)
	ok((requests[1].body as string).includes('sid="new-session"'))

	reporter.stop()
	timers.reset()
})

it('does not re-arm restored targets when the reporter is stopped', async () => {
	const timers = mock.timers
	timers.enable({ apis: ['setInterval'] })

	const { requester, requests } = createMockRequester(410)
	const reporter = new CmcdReporter(createConfig({
		eventTargets: [{
			url: 'https://example.com/cmcd',
			events: [CmcdEventType.TIME_INTERVAL],
			enabledKeys: [...EVENT_KEYS],
			interval: 30,
			batchSize: 1,
		}],
	}), requester)

	reporter.start()
	equal(requests.length, 1)
	await new Promise(resolve => setTimeout(resolve, 10))

	reporter.stop()
	reporter.update({ sid: 'new-session' })

	timers.tick(30_000)
	equal(requests.length, 1)

	timers.reset()
})

it('ignores a 410 from a previous session (delayed response)', async () => {
	const requests: HttpRequest[] = []
	const pending: Array<(response: { status: number; }) => void> = []
	const requester = (request: HttpRequest): Promise<{ status: number; }> => {
		requests.push(request)
		return new Promise(resolve => pending.push(resolve))
	}

	const reporter = new CmcdReporter(createConfig(), requester)

	reporter.recordEvent(CmcdEventType.ERROR)
	equal(requests.length, 1)

	// The session ends while the report is in flight; the 410 then lands.
	reporter.update({ sid: 'new-session' })
	pending[0]({ status: 410 })
	await new Promise(resolve => setTimeout(resolve, 10))

	// The 410 belonged to the old session: the target must stay alive.
	reporter.recordEvent(CmcdEventType.ERROR)
	equal(requests.length, 2)
	ok((requests[1].body as string).includes('sid="new-session"'))
	pending[1]({ status: 200 })
})

it('applies a delayed 410 from the current session', async () => {
	const requests: HttpRequest[] = []
	const pending: Array<(response: { status: number; }) => void> = []
	const requester = (request: HttpRequest): Promise<{ status: number; }> => {
		requests.push(request)
		return new Promise(resolve => pending.push(resolve))
	}

	const reporter = new CmcdReporter(createConfig(), requester)

	reporter.recordEvent(CmcdEventType.ERROR)
	pending[0]({ status: 410 })
	await new Promise(resolve => setTimeout(resolve, 10))

	reporter.recordEvent(CmcdEventType.ERROR)
	equal(requests.length, 1)
})
```

- [x] **Step 2: Run, expect FAIL**

Run: `npm run build -w libs/cmcd && npm test -w libs/cmcd`
Expected: `restores`, `re-arms`, and `ignores a 410 from a previous session` fail (target is deleted forever today). `does not re-arm when stopped` and `applies a delayed 410 from the current session` pass today; they pin the boundaries of the fix.

- [x] **Step 3: Implement**

1. Type and constructor:

```ts
type CmcdEventTarget = CmcdTarget & {
	intervalId: ReturnType<typeof setInterval> | undefined;
	queue: Cmcd[];
	disposed: boolean;
}
```

Constructor init adds `disposed: false`. Add fields:

```ts
private sessionEpoch = 0
private started = false
```

2. Extract arming from `start()`:

```ts
/**
 * Arms the time-interval timer for an event target when its config calls
 * for one. Returns whether a timer was armed.
 */
private armInterval(target: CmcdEventTarget, config: CmcdEventReportConfigNormalized<C>): boolean {
	// If the interval is 0 or the TIME_INTERVAL event is not enabled, do not start the interval.
	if (config.interval === 0 || !config.events.includes(CMCD_EVENT_TIME_INTERVAL)) {
		return false
	}

	target.intervalId = setInterval(() => {
		this.recordTargetEvent(target, config, CMCD_EVENT_TIME_INTERVAL)
		this.processEventTargets()
	}, config.interval * 1000)

	return true
}
```

3. `start()` sets `this.started = true` first, skips disposed targets, and keeps the armed-before-initial-event contract and the continue-then-rethrow failure contract:

```ts
start(): void {
	this.started = true

	// (existing failure-collection comment stays)
	let failure: { error: unknown; } | undefined

	this.eventTargets.forEach((target, config) => {
		// Disarm any existing timer so repeated start() calls do not leak intervals.
		this.disarmInterval(target)

		// A target disposed via HTTP 410 stays silent for the rest of the session.
		if (target.disposed || !this.armInterval(target, config)) {
			return
		}

		// Armed before the initial event so a throwing transform leaves the
		// timer in the same state a successful start() would.
		try {
			this.recordTargetEvent(target, config, CMCD_EVENT_TIME_INTERVAL)
			this.processEventTargets()
		}
		catch (error) {
			failure ??= { error }
		}
	})

	if (failure) {
		throw failure.error
	}
}
```

4. `stop()` sets `this.started = false` before the existing body.

5. `recordTargetEvent()` early return becomes `if (target.disposed || !config.events.includes(type))`. `processEventTargets()` per-target early return becomes `if (target.disposed || !queue.length)` (a 429 re-queue landing after disposal must not resurrect sends).

6. `sendEventReport()` captures the epoch before the await and applies the 410 only when still current:

```ts
private async sendEventReport(config: CmcdEventReportConfigNormalized<C>, data: Cmcd[]): Promise<void> {
	// Captured before the await: CTA-5004-B scopes 410 suppression to "the
	// remainder of the current session", so a 410 that resolves after a
	// session change belongs to a session that has already ended.
	const epoch = this.sessionEpoch
	const options = createEncodingOptions(CMCD_EVENT_MODE, config)
	const response = await this.requester({
		url: config.url,
		method: 'POST',
		headers: {
			'Content-Type': CMCD_MIME_TYPE,
		},
		body: data.map(item => encodeCmcd(item, options)).join('\n') + '\n',
	})

	const { status } = response

	if (status === 410) {
		if (epoch === this.sessionEpoch) {
			this.disposeEventTarget(config)
		}
	}
	else if (status === 429 || (status > 499 && status < 600)) {
		throw new Error(`Event report failed with status ${status}`)
	}
}
```

7. `disposeEventTarget()` marks instead of deletes:

```ts
/**
 * Silences an event target for the remainder of the current session: cancels
 * its timer, drops its queue, and blocks further enqueues. Used when the
 * collector signals the target is gone (HTTP 410). A session change via
 * `update({ sid })` restores the target.
 */
private disposeEventTarget(config: CmcdEventReportConfigNormalized<C>): void {
	const target = this.eventTargets.get(config)

	if (!target) {
		return
	}

	this.disarmInterval(target)
	target.disposed = true
	target.queue.length = 0
}
```

8. `resetSession()` bumps the epoch and restores disposed targets:

```ts
private resetSession(): void {
	this.sessionEpoch++

	// msd is once per Session ID: a new session re-arms the gate, and a
	// stored-but-unsent value from the old session must not leak forward.
	this.msd = NaN

	this.eventTargets.forEach((target, config) => {
		target.sn = 0
		target.msdSent = false

		// 410 disposal is scoped to the session that received it. Timers
		// re-arm only if the reporter is started, without the immediate
		// initial report start() fires.
		if (target.disposed) {
			target.disposed = false

			if (this.started) {
				this.armInterval(target, config)
			}
		}
	})

	this.requestTarget.sn = 0
	this.requestTarget.msdSent = false
	this.lastEmitted = {}
}
```

- [x] **Step 4: Run, expect PASS**

Run: `npm run build -w libs/cmcd && npm test -w libs/cmcd`
Expected: PASS, including the two existing 410 tests (same-session behavior is unchanged) and the start-lifecycle tests.

- [x] **Step 5: Commit**

```bash
git add libs/cmcd/src/CmcdReporter.ts libs/cmcd/test/CmcdReporter.test.ts
git commit -s -m "fix(cmcd): scope HTTP 410 target disposal to the session"
```

Body: `Refs #410.`

---

### Task 7: Changelog, full validation, PR

**Files:**
- Modify: `libs/cmcd/CHANGELOG.md` (`## [Unreleased]`, new `### Fixed` section)
- Verify: `libs/cmcd/config/cml-cmcd.api.md` diff is empty

- [x] **Step 1: Add changelog entries**

Three bullets under `## [Unreleased]` / `### Fixed`, one per issue, in the repo's prose style, each ending with the issue link (`[#408](https://github.com/streaming-video-technology-alliance/common-media-library/issues/408)` etc.): session-owned `sid`/`msd` stamping (including the `update({ sid: undefined })` no-op), the `msd` lifecycle fixes (validation with `0` accepted and rounding, session-reset re-arm, filter-aware gate consumption), and session-scoped 410 disposal (restore on `sid` change, delayed-response epoch guard).

- [x] **Step 2: Full validation**

Run: `npm test` (root: lint, build all, typecheck, every package's tests; this is what PR CI runs)
Expected: PASS. Then `git diff libs/cmcd/config/cml-cmcd.api.md` must be empty.

- [x] **Step 3: Commit and create the PR**

```bash
git add libs/cmcd/CHANGELOG.md
git commit -s -m "docs(cmcd): add changelog entries for session-integrity fixes"
```

Create the PR with the `/create-pr` skill against `main`. PR body: summary of the three fixes and the pin tests, `Fixes #408`, `Fixes #409`, `Fixes #410`, and a note that these are the prerequisite fixes for the child-reporters RFC (#398).
