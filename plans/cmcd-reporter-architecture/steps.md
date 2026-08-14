# CmcdReporter Internal Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `CmcdReporter`'s internals into four units with single ownership (session ledger, player state, pure report pipeline, per-target outboxes) with zero public API change and zero behavior change.

**Architecture:** See [architecture.md](architecture.md). `CmcdReporter` becomes a thin facade over a `CmcdSessionLedger` (sid-keyed session storage, retention, archival), a `CmcdPlayerState` (per-playback data and dedup baseline, per the child-reporters RFC's state partition), pure pipeline functions (`applyReportPolicy`, `stampReport`), and `CmcdOutbox` instances (delivery only). Ordering invariants that are enforced today by call-site discipline become structural: policy runs before stamp, stamp is the only stage that consumes counters and gates, delivery never sees CMCD semantics.

**Tech Stack:** TypeScript (`isolatedDeclarations`, `verbatimModuleSyntax`), `node:test` + `node:assert`, tsdown build, api-extractor for public API surface tracking.

## Global Constraints

- **Base branch**: `main` at or after `18f38f041` (PR #416, the v13 session-retention implementation). Line references cite `libs/cmcd/src/CmcdReporter.ts` at that commit; symbols are authoritative, line numbers are hints.
- **Behavior-preserving refactor**: `libs/cmcd/test/CmcdReporter.test.ts` is the specification and MUST NOT be edited. TDD is inverted here: the existing suite is the test harness, it must be green after every task, and a step that seems to require a test edit is a behavior change; stop and escalate rather than edit.
- **Zero public API change**: no new exports from `libs/cmcd/src/index.ts`. After every task's build, `git diff --exit-code libs/cmcd/config/cml-cmcd.api.md` must pass.
- All new files are internal modules under `libs/cmcd/src/`, named for their primary export, no default exports, `type` not `interface`, tab indentation, no module-scope side effects. Preserve every existing `/* @__PURE__ */` annotation when moving module-scope constants.
- When moving code, move its TSDoc and comments with it verbatim. Do not add new rationale comments; rationale goes in the commit message.
- Development requires Node >= 24. Fresh worktrees: `npm install` and `git submodule update --init` before anything else (without a local `node_modules`, typecheck resolves against another checkout's stale `dist`).
- Tests import bundled output: always `npm run build -w libs/cmcd` before `npm test -w libs/cmcd`.
- Every commit: `git commit -s`, conventional-commit format, trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Do **not** bump any `package.json` version. The changelog entry lands once, in Task 6.

---

### Task 1: Extract shared reporter internals into modules

Pure code motion. Three groups of module-scope helpers leave `CmcdReporter.ts` so later tasks can import them from outside the class file.

**Files:**
- Create: `libs/cmcd/src/copyReportValues.ts`
- Create: `libs/cmcd/src/createCmcdReporterConfig.ts`
- Create: `libs/cmcd/src/CMCD_REQUIRED_EVENT_KEYS.ts`
- Modify: `libs/cmcd/src/CmcdReporter.ts` (delete the moved code, add imports)

**Interfaces:**
- Consumes: existing types (`Cmcd`, `CmcdEncodeOptions`, `CmcdReporterConfig`, `CmcdEventReportConfig`, `CmcdKey`, `CmcdEventType`) and constants (`CMCD_V2`, `CMCD_DEFAULT_TIME_INTERVAL`, `CMCD_QUERY`, `CMCD_STATE_EVENT_FIELDS`, event-type constants), plus `uuid` from `@svta/cml-utils`.
- Produces:
  - `copyReportValues(data: Cmcd): Cmcd` (moved lines 173 to 228; `copyItemValue` stays module-private beside it)
  - `createCmcdReporterConfig<C>(config: Partial<CmcdReporterConfig<C>>): CmcdReporterConfigNormalized<C>` (moved lines 272 to 310)
  - `createEncodingOptions(reportingMode, config, baseUrl?): CmcdEncodeOptions` (moved lines 48 to 58)
  - Exported types `CmcdReportConfigNormalized`, `CmcdEventReportConfigNormalized<C>`, `CmcdReporterConfigNormalized<C>` (moved lines 32 to 46), all from `createCmcdReporterConfig.ts`
  - `CMCD_REQUIRED_EVENT_KEYS: ReadonlyMap<CmcdEventType, CmcdKey>` (moved lines 139 to 149, keeping its `/* @__PURE__ */` annotations)

- [ ] **Step 1: Worktree setup and green baseline**

Run from the repo root:

```bash
npm install
git submodule update --init
npm run build
npm test -w libs/cmcd
```

Expected: all cmcd tests pass. This is the baseline every later step must return to.

- [ ] **Step 2: Create the three modules with the moved code**

Move each block verbatim (code, TSDoc, comments, `@__PURE__` annotations), changing only what an export keyword and import paths require. `copyReportValues.ts` exports `copyReportValues` and keeps `copyItemValue` private. `createCmcdReporterConfig.ts` exports the three normalized type aliases, `createEncodingOptions`, and `createCmcdReporterConfig`. `CMCD_REQUIRED_EVENT_KEYS.ts` exports the map constant.

- [ ] **Step 3: Rewire `CmcdReporter.ts`**

Delete the moved blocks, add imports:

```ts
import { CMCD_REQUIRED_EVENT_KEYS } from './CMCD_REQUIRED_EVENT_KEYS.ts'
import { copyReportValues } from './copyReportValues.ts'
import type { CmcdEventReportConfigNormalized, CmcdReporterConfigNormalized } from './createCmcdReporterConfig.ts'
import { createCmcdReporterConfig, createEncodingOptions } from './createCmcdReporterConfig.ts'
```

Do NOT touch `libs/cmcd/src/index.ts`.

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npm run build -w libs/cmcd
npm test -w libs/cmcd
git diff --exit-code libs/cmcd/config/cml-cmcd.api.md
```

Expected: typecheck clean, all tests pass, api.md unchanged.

- [ ] **Step 5: Commit**

```bash
git add libs/cmcd/src
git commit -s -m "refactor(cmcd): extract shared reporter internals into modules"
```

---

### Task 2: Split player state from session state

The load-bearing task: `CmcdSession` stops holding the per-playback fields (`data`, `lastEmitted`), which move to a new `CmcdPlayerState` held by the reporter, per the child-reporters RFC's state partition. Archived sessions gain an explicit frozen `snapshot`. State-change acceptance becomes a function over player state.

**Files:**
- Create: `libs/cmcd/src/CmcdPlayerState.ts`
- Create: `libs/cmcd/src/acceptStateChange.ts`
- Modify: `libs/cmcd/src/CmcdReporter.ts`

**Interfaces:**
- Consumes: `copyReportValues` (Task 1), `CMCD_STATE_EVENT_FIELDS`, `CmcdEventType`, `Cmcd`, `CmcdObjectTypeList`.
- Produces:
  - `CmcdStateField` and `CmcdPlayerState` types, `createCmcdPlayerState(data: Cmcd): CmcdPlayerState`
  - `acceptStateChange(player: CmcdPlayerState, type: CmcdEventType, data: Partial<Cmcd>): boolean` (false = suppress the event)
  - `pendingStateEvents(player: CmcdPlayerState, data: Partial<Cmcd>): CmcdEventType[]` (must be called after `data` is merged into `player.data`)
  - `CmcdSession<C>` loses `data` and `lastEmitted`, gains `snapshot?: Cmcd`

- [ ] **Step 1: Create `CmcdPlayerState.ts`**

```ts
import type { Cmcd } from './Cmcd.ts'

/**
 * Tracked state field for dedup + auto-trigger.
 */
export type CmcdStateField = 'sta' | 'pr' | 'cid' | 'bg' | 'br'

/**
 * The state owned by one player's playback: its persistent data store and
 * its state-change dedup baseline. Session-scoped state (counters, gates,
 * queues) lives on the session; see the child-reporters RFC state partition.
 */
export type CmcdPlayerState = {
	data: Cmcd;
	lastEmitted: Partial<Pick<Cmcd, CmcdStateField>>;
}

export function createCmcdPlayerState(data: Cmcd): CmcdPlayerState {
	return { data, lastEmitted: {} }
}
```

The existing private `StateField` alias (line 63) is deleted in favor of `CmcdStateField`.

- [ ] **Step 2: Create `acceptStateChange.ts`**

Move `StateFieldEntry` (lines 65 to 78), `cmcdObjectTypeListEqual` (lines 80 to 111), `equal`, `identity` (lines 113 to 114), `STATE_FIELDS` (lines 116 to 133), and `STATE_FIELDS_BY_EVENT` (lines 135 to 137) into this file as module-private members (keep `@__PURE__` annotations). Add the two exports; their bodies are the logic currently inlined at lines 739 to 762 (`emitEvent`) and 620 to 624 (`update`):

```ts
export function acceptStateChange(player: CmcdPlayerState, type: CmcdEventType, data: Partial<Cmcd>): boolean {
	const entry = STATE_FIELDS_BY_EVENT.get(type)

	if (!entry) {
		return true
	}

	const field = entry.field
	const incoming = data[field]

	if (incoming !== undefined) {
		Object.assign(player.data, { [field]: incoming })
	}

	const current = player.data[field]

	if (current === undefined) {
		return false
	}

	if (entry.equal(current, player.lastEmitted[field])) {
		return false
	}

	Object.assign(player.lastEmitted, { [field]: entry.snapshot(current) })
	return true
}

export function pendingStateEvents(player: CmcdPlayerState, data: Partial<Cmcd>): CmcdEventType[] {
	const events: CmcdEventType[] = []

	for (const entry of STATE_FIELDS) {
		if (entry.field in data && !entry.equal(player.data[entry.field], player.lastEmitted[entry.field])) {
			events.push(entry.event)
		}
	}

	return events
}
```

Move the TSDoc from the inlined originals onto these functions.

- [ ] **Step 3: Rewire `CmcdReporter.ts`**

Each edit, by symbol:

- `CmcdSession<C>` (line 334): remove `data: Cmcd;` and `lastEmitted: Partial<Pick<Cmcd, StateField>>;`, add `snapshot?: Cmcd;`.
- Class fields: add `private player: CmcdPlayerState`.
- Constructor (line 401): before creating the session, `this.player = createCmcdPlayerState({ cid: this.config.cid, v: this.config.version })`. `createSession` signature becomes `createSession(sid: string, cid: string | undefined)`; it no longer stores data, and mints provenance from the `cid` parameter.
- `update()` (line 582): every `session.data` read/write becomes `this.player.data` (the merge at line 606, the `cid` re-mint comparison at line 612). Replace the `STATE_FIELDS` loop (lines 620 to 624) with:

```ts
for (const event of pendingStateEvents(this.player, data)) {
	this.recordEvent(event)
}
```

- `startSession()` (line 642): replace lines 643 to 644 with:

```ts
const snapshot = copyReportValues({ ...this.player.data })
this.session.snapshot = snapshot
this.player = createCmcdPlayerState({ ...snapshot })
this.session = this.createSession(sid, this.player.data.cid)
```

The map re-insert, drain, evict, and re-arm steps (lines 650 to 679) are unchanged.

- `emitEvent()` (line 738): replace the dedup block (lines 739 to 762) with:

```ts
if (!acceptStateChange(this.player, type, data)) {
	return
}
```

This is safe for archived sessions because only `RESPONSE_RECEIVED` is ever emitted into one (via `resolveSession`), and non-state events pass through `acceptStateChange` without touching player state.

- `recordTargetEvent()` (line 801): the item spread at line 808 becomes `{ ...(session.snapshot ?? this.player.data), ...data, sid: session.sid, e: type, ts: data.ts ?? Date.now() }`. Sourcing per target call preserves today's mid-fan-out behavior: a transform that rotates the session synchronously leaves later targets reading the archived snapshot, exactly as they read the detached `session.data` today.
- `createRequestReport()` (line 1106): the merge at line 1136 becomes `{ ...this.player.data, ...data, sid: session.sid }`.

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npm run build -w libs/cmcd
npm test -w libs/cmcd
git diff --exit-code libs/cmcd/config/cml-cmcd.api.md
```

Expected: all green with zero test edits. Pay particular attention to the session-retention and dedup test groups; they pin the exact semantics this task moves.

- [ ] **Step 5: Commit**

```bash
git add libs/cmcd/src
git commit -s -m "refactor(cmcd): split player state from session state"
```

---

### Task 3: Move session storage into a session ledger

The `sessions` map, current-session pointer, retention normalization consumer, structural `sid` resolution, rotation re-insert, and eviction move into a `CmcdSessionLedger`. The session type and its factory move to their own file.

**Files:**
- Create: `libs/cmcd/src/CmcdSessionState.ts`
- Create: `libs/cmcd/src/CmcdSessionLedger.ts`
- Modify: `libs/cmcd/src/CmcdReporter.ts`

**Interfaces:**
- Consumes: `CmcdEventReportConfigNormalized<C>` (Task 1), `CmcdRequestProvenance`, `Cmcd`.
- Produces:
  - `CmcdTargetStamps` (`{ sn: number; msdSent: boolean; }`), `CmcdEventTargetState` (`CmcdTargetStamps & { queue: string[]; disposed: boolean; }`), `CmcdSessionState<C>`, `mintProvenance(sid, cid): CmcdRequestProvenance`, and `createCmcdSessionState<C>(sid: string, cid: string | undefined, targets: CmcdEventReportConfigNormalized<C>[]): CmcdSessionState<C>`, all from `CmcdSessionState.ts`
  - `class CmcdSessionLedger<C>` with `current: CmcdSessionState<C>`, `resolve(provenance: unknown): CmcdSessionState<C> | undefined`, `rotate(next: CmcdSessionState<C>, snapshot: Cmcd): void`, `evict(): void`, `forEach(fn: (session: CmcdSessionState<C>) => void): void` (insertion order, oldest first)

- [ ] **Step 1: Create `CmcdSessionState.ts`**

Rename `CmcdSession` to `CmcdSessionState` and `CmcdTarget`/`CmcdEventTarget` to `CmcdTargetStamps`/`CmcdEventTargetState`, moving them (lines 312 to 352, minus the Task 2 edits) with their TSDoc. Move `mintProvenance` (lines 257 to 265) here and export it (the facade still re-mints on `cid` change). Add the factory, extracted from `createSession` (lines 415 to 441):

```ts
export function createCmcdSessionState<C>(sid: string, cid: string | undefined, targets: CmcdEventReportConfigNormalized<C>[]): CmcdSessionState<C> {
	const eventTargets = new Map<CmcdEventReportConfigNormalized<C>, CmcdEventTargetState>()

	for (const target of targets) {
		eventTargets.set(target, {
			sn: 0,
			msdSent: false,
			queue: [],
			disposed: false,
		})
	}

	return {
		sid,
		provenance: mintProvenance(sid, cid),
		msd: NaN,
		eventTargets,
		requestTarget: {
			sn: 0,
			msdSent: false,
		},
	}
}
```

- [ ] **Step 2: Create `CmcdSessionLedger.ts`**

The map manipulation moves from the facade (constructor line 407, `resolveSession` lines 1015 to 1032, re-insert lines 645 to 651, eviction lines 657 to 667) into named operations, keeping each comment with the code it documents:

```ts
import type { Cmcd } from './Cmcd.ts'
import type { CmcdSessionState } from './CmcdSessionState.ts'

export class CmcdSessionLedger<C> {
	private sessions = new Map<string, CmcdSessionState<C>>()
	private retention: number

	current: CmcdSessionState<C>

	constructor(retention: number, initial: CmcdSessionState<C>) {
		this.retention = retention
		this.current = initial
		this.sessions.set(initial.sid, initial)
	}

	resolve(provenance: unknown): CmcdSessionState<C> | undefined {
		if (provenance === null || typeof provenance !== 'object') {
			return undefined
		}

		const { sid } = provenance as { sid?: unknown; }

		return typeof sid === 'string' ? this.sessions.get(sid) : undefined
	}

	rotate(next: CmcdSessionState<C>, snapshot: Cmcd): void {
		this.current.snapshot = snapshot
		this.sessions.delete(next.sid)
		this.sessions.set(next.sid, next)
		this.current = next
	}

	evict(): void {
		for (const key of this.sessions.keys()) {
			if (this.sessions.size <= this.retention + 1) {
				break
			}

			this.sessions.delete(key)
		}
	}

	forEach(fn: (session: CmcdSessionState<C>) => void): void {
		this.sessions.forEach(fn)
	}
}
```

Move the TSDoc from `resolveSession`, the re-insert comment (lines 646 to 649), and the eviction comment (lines 657 to 660) onto the corresponding methods, and the retained-sessions field TSDoc (lines 373 to 379) onto the class.

- [ ] **Step 3: Rewire `CmcdReporter.ts`**

- Replace the `sessions` and `session` fields with `private ledger: CmcdSessionLedger<C>`; every `this.session` read becomes `this.ledger.current`.
- Constructor: `this.ledger = new CmcdSessionLedger(this.config.sessionRetention, createCmcdSessionState(this.config.sid, this.config.cid, this.config.eventTargets))`. Delete the private `createSession` method.
- `startSession()` becomes:

```ts
private startSession(sid: string): void {
	const snapshot = copyReportValues({ ...this.player.data })
	this.player = createCmcdPlayerState({ ...snapshot })
	this.ledger.rotate(createCmcdSessionState(sid, this.player.data.cid, this.config.eventTargets), snapshot)
	this.processEventTargets()
	this.ledger.evict()
	// timer re-arm loop unchanged (lines 669 to 679)
}
```

- Delete `resolveSession`; `recordResponseReceived` calls `this.ledger.resolve(provenance)`.
- `processEventTargets`: `this.sessions.forEach` becomes `this.ledger.forEach`, and the `session !== this.session` drain check becomes `session !== this.ledger.current`.
- `disposeEventTarget`: the `session === this.session` timer check becomes `session === this.ledger.current`.

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npm run build -w libs/cmcd
npm test -w libs/cmcd
git diff --exit-code libs/cmcd/config/cml-cmcd.api.md
```

Expected: all green. The retention normalization table tests and the sid-reuse tests pin `rotate`/`evict` exactly.

- [ ] **Step 5: Commit**

```bash
git add libs/cmcd/src
git commit -s -m "refactor(cmcd): move session storage into a session ledger"
```

---

### Task 4: Extract the report policy and stamp pipeline stages

The transform contract (copy isolation, cancellation, required-key and `ts` restoration) and the reporter-owned-field stamping (with counter and gate consumption) each become one pure function, replacing the two divergent inline copies on the event and request paths.

**Files:**
- Create: `libs/cmcd/src/applyReportPolicy.ts`
- Create: `libs/cmcd/src/stampReport.ts`
- Modify: `libs/cmcd/src/CmcdReporter.ts`

**Interfaces:**
- Consumes: `copyReportValues` (Task 1), `CmcdSessionState`/`CmcdTargetStamps` (Task 3), `CmcdKey`, `CmcdEventType`, `CmcdTransformRequest`.
- Produces:
  - `applyReportPolicy<C, R extends CmcdTransformRequest<C> | undefined>(report: Cmcd, transform: ((data: Cmcd, request: R) => Cmcd | null) | undefined, request: R, requiredKey: CmcdKey | undefined, restoreTs: boolean): Cmcd | null`
  - `stampReport<C>(report: Cmcd, session: CmcdSessionState<C>, stamps: CmcdTargetStamps, attachMsd: boolean, type?: CmcdEventType): boolean` (returns whether `msd` rode the report; the caller consumes the gate per its mode's rule)

- [ ] **Step 1: Create `applyReportPolicy.ts`**

Move `isUsableRequiredValue` (lines 151 to 171) here as a module-private helper with its TSDoc. The exported function unifies lines 816 to 854 (event path) and 1140 to 1153 (request path); `restoreTs: false` encodes that request-mode reports have no `ts` obligation, so request-path behavior is unchanged:

```ts
export function applyReportPolicy<C, R extends CmcdTransformRequest<C> | undefined>(
	report: Cmcd,
	transform: ((data: Cmcd, request: R) => Cmcd | null) | undefined,
	request: R,
	requiredKey: CmcdKey | undefined,
	restoreTs: boolean,
): Cmcd | null {
	if (!transform) {
		return report
	}

	copyReportValues(report)

	const ts = report.ts
	const requiredValue = requiredKey ? (report as Record<string, unknown>)[requiredKey] : undefined

	const out = transform(report, request)

	if (out == null) {
		return null
	}

	if (restoreTs && !isUsableRequiredValue(out.ts)) {
		out.ts = ts
	}

	if (requiredKey && isUsableRequiredValue(requiredValue) && !isUsableRequiredValue((out as Record<string, unknown>)[requiredKey])) {
		Object.assign(out, { [requiredKey]: requiredValue })
	}

	return out
}
```

Move the deep-copy comment (lines 821 to 825), the required-key capture comment (lines 828 to 829), the cancellation comment (line 836), and the restore-never-fabricate comment (lines 841 to 845) with the logic they document.

- [ ] **Step 2: Create `stampReport.ts`**

Extracted from `queueTargetEvent` (lines 873 to 891) and `createRequestReport` (lines 1155 to 1171); the msd-gate TSDoc from both sites moves onto the function:

```ts
export function stampReport<C>(report: Cmcd, session: CmcdSessionState<C>, stamps: CmcdTargetStamps, attachMsd: boolean, type?: CmcdEventType): boolean {
	if (type !== undefined) {
		report.e = type
	}

	report.sn = stamps.sn++
	report.sid = session.sid

	if (attachMsd && !isNaN(session.msd) && !stamps.msdSent) {
		report.msd = session.msd
		return true
	}

	delete report.msd
	return false
}
```

- [ ] **Step 3: Rewire the event path**

`recordTargetEvent` keeps its guards and item assembly, then becomes:

```ts
const report = applyReportPolicy(item, config.transform, request, CMCD_REQUIRED_EVENT_KEYS.get(type), true)

if (report == null) {
	return
}

this.queueTargetEvent(session, target, config, report, type)
```

`queueTargetEvent` becomes:

```ts
private queueTargetEvent(session: CmcdSessionState<C>, target: CmcdEventTargetState, config: CmcdEventReportConfigNormalized<C>, report: Cmcd, type: CmcdEventType): void {
	if (stampReport(report, session, target, config.enabledKeys?.includes('msd') ?? false, type)) {
		target.msdSent = true
	}

	target.queue.push(encodeCmcd(report, createEncodingOptions(CMCD_EVENT_MODE, config)))
}
```

Event mode consumes the gate at enqueue because its key filter is checked up front (`attachMsd`), exactly as today at lines 884 to 887.

- [ ] **Step 4: Rewire the request path**

In `createRequestReport`, the transform block (lines 1140 to 1153) becomes:

```ts
let cmcdData: Cmcd | null = applyReportPolicy(merged, transform, request as CmcdTransformRequest<C>, undefined, false)

if (cmcdData == null) {
	return report
}
```

and the stamping block (lines 1155 to 1171) becomes:

```ts
const sendMsd = stampReport(cmcdData, session, session.requestTarget, true)
```

The post-prepare gate consumption at lines 1184 to 1186 (`if (sendMsd && cmcd.msd !== undefined) session.requestTarget.msdSent = true`) is unchanged: request mode confirms against the prepared output because its filter runs downstream of stamping.

- [ ] **Step 5: Verify**

```bash
npm run typecheck
npm run build -w libs/cmcd
npm test -w libs/cmcd
git diff --exit-code libs/cmcd/config/cml-cmcd.api.md
```

Expected: all green. The transform test groups (cancellation, required-key restoration, `bg: false` non-restoration, msd-gate-with-filter) pin both functions.

- [ ] **Step 6: Commit**

```bash
git add libs/cmcd/src
git commit -s -m "refactor(cmcd): extract the report policy and stamp pipeline stages"
```

---

### Task 5: Move event delivery into per-target outboxes

Queue, batch, POST, retry re-queue, and disposal become a `CmcdOutbox` class with no CMCD knowledge. `CmcdEventTargetState` swaps its raw `queue`/`disposed` fields for an outbox instance.

**Files:**
- Create: `libs/cmcd/src/CmcdOutbox.ts`
- Modify: `libs/cmcd/src/CmcdSessionState.ts`
- Modify: `libs/cmcd/src/CmcdReporter.ts`

**Interfaces:**
- Consumes: `CMCD_MIME_TYPE`, `HttpRequest` from `@svta/cml-utils`.
- Produces:
  - `type CmcdRequester = (request: HttpRequest) => Promise<{ status: number; }>` (from `CmcdOutbox.ts`, for internal modules only; the facade's public constructor signature and its private `requester` field keep their existing inline function type verbatim, because referencing a non-exported alias from the exported class would change `cml-cmcd.api.md` or trip api-extractor's forgotten-export check)
  - `class CmcdOutbox` with `disposed: boolean` (readable), `push(line: string): void`, `dispose(): void`, `process(drain: boolean, onGone: () => void): boolean` (returns whether lines remain queued after this pass)
  - `CmcdEventTargetState` becomes `CmcdTargetStamps & { outbox: CmcdOutbox; }`
  - `createCmcdSessionState` gains a trailing `requester: CmcdRequester` parameter and constructs one outbox per target

- [ ] **Step 1: Create `CmcdOutbox.ts`**

The batch-extraction logic moves from `processEventTargets` (lines 1223 to 1245) and the send/response handling from `sendEventReport` (lines 1254 to 1281), with their comments:

```ts
import type { HttpRequest } from '@svta/cml-utils'
import { CMCD_MIME_TYPE } from './CMCD_MIME_TYPE.ts'

export type CmcdRequester = (request: HttpRequest) => Promise<{ status: number; }>

export class CmcdOutbox {
	private queue: string[] = []
	private url: string
	private batchSize: number
	private requester: CmcdRequester

	disposed = false

	constructor(url: string, batchSize: number, requester: CmcdRequester) {
		this.url = url
		this.batchSize = batchSize
		this.requester = requester
	}

	push(line: string): void {
		this.queue.push(line)
	}

	dispose(): void {
		this.disposed = true
		this.queue.length = 0
	}

	process(drain: boolean, onGone: () => void): boolean {
		if (this.disposed || !this.queue.length) {
			return false
		}

		if (this.queue.length < this.batchSize && !drain) {
			return false
		}

		const deleteCount = drain ? this.queue.length : this.batchSize
		const events = this.queue.splice(0, deleteCount)

		this.send(events, onGone).catch(() => {
			this.queue.unshift(...events)
		})

		return this.queue.length > 0
	}

	private async send(data: string[], onGone: () => void): Promise<void> {
		const response = await this.requester({
			url: this.url,
			method: 'POST',
			headers: {
				'Content-Type': CMCD_MIME_TYPE,
			},
			body: data.join('\n') + '\n',
		})

		const { status } = response

		if (status === 410) {
			onGone()
		} else if (status === 429 || (status > 499 && status < 600)) {
			throw new Error(`Event report failed with status ${status}`)
		}
	}
}
```

Re-queue after disposal intentionally still lands in the (cleared, disposed) queue and is never sent, matching lines 1226 to 1230.

- [ ] **Step 2: Update `CmcdSessionState.ts`**

`CmcdEventTargetState` becomes `CmcdTargetStamps & { outbox: CmcdOutbox; }` (move the encode-at-enqueue TSDoc from the old `queue` member onto the type). `createCmcdSessionState` gains the requester parameter:

```ts
export function createCmcdSessionState<C>(sid: string, cid: string | undefined, targets: CmcdEventReportConfigNormalized<C>[], requester: CmcdRequester): CmcdSessionState<C> {
	const eventTargets = new Map<CmcdEventReportConfigNormalized<C>, CmcdEventTargetState>()

	for (const target of targets) {
		eventTargets.set(target, {
			sn: 0,
			msdSent: false,
			outbox: new CmcdOutbox(target.url, target.batchSize, requester),
		})
	}

	return {
		sid,
		provenance: mintProvenance(sid, cid),
		msd: NaN,
		eventTargets,
		requestTarget: {
			sn: 0,
			msdSent: false,
		},
	}
}
```

- [ ] **Step 3: Rewire `CmcdReporter.ts`**

- Both `createCmcdSessionState` call sites (constructor, `startSession`) pass `this.requester`. Leave the constructor parameter's and the `requester` field's declared types exactly as they are (the inline function type is assignable to `CmcdRequester` where the factory consumes it).
- Every `target.disposed` read becomes `target.outbox.disposed` (`start` line 474, `recordTargetEvent` line 802).
- `queueTargetEvent`: `target.queue.push(...)` becomes `target.outbox.push(...)`.
- `processEventTargets` becomes:

```ts
private processEventTargets(flush: boolean = false): void {
	let reprocess = false

	this.ledger.forEach((session) => {
		const drain = flush || session !== this.ledger.current

		session.eventTargets.forEach((target, config) => {
			reprocess = target.outbox.process(drain, () => this.disposeEventTarget(session, config)) || reprocess
		})
	})

	if (reprocess) {
		this.processEventTargets()
	}
}
```

Keep the oldest-session-first and archived-sessions-always-drain comments (lines 1214 to 1221) on this method.

- `disposeEventTarget`: the per-sibling body becomes `target.outbox.dispose()` plus the unchanged current-session `disarmInterval` call; the `target.disposed`/`queue.length = 0` lines are deleted.
- Delete `sendEventReport`.

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npm run build -w libs/cmcd
npm test -w libs/cmcd
git diff --exit-code libs/cmcd/config/cml-cmcd.api.md
```

Expected: all green. The batching, 429 re-queue, 410 same-URL disposal, delayed-410 session scoping, and drain-before-evict tests pin the outbox exactly.

- [ ] **Step 5: Commit**

```bash
git add libs/cmcd/src
git commit -s -m "refactor(cmcd): move event delivery into per-target outboxes"
```

---

### Task 6: Facade cleanup, changelog, and full validation

Unify the two interval-tick call sites, confirm the facade contains only translation, and run the full repo validation.

**Files:**
- Modify: `libs/cmcd/src/CmcdReporter.ts`
- Modify: `libs/cmcd/CHANGELOG.md`

**Interfaces:**
- Consumes: everything produced by Tasks 1 through 5.
- Produces: no new symbols. `CmcdReporter.ts` should now contain only: the config field, the ledger, the player, the timers map, the requester, the public methods, and thin private helpers (`emitEvent`, `recordTargetEvent`, `queueTargetEvent`, `emitIntervalTick`, `processEventTargets`, `disposeEventTarget`, `armInterval`, `disarmInterval`, `startSession`, `createRequestProvenance`, `decodeSnapshot` as a module-private function, `defaultRequester`).

- [ ] **Step 1: Unify the interval tick**

`start()` (lines 478 to 481) and the `armInterval` timer callback (lines 503 to 511) both perform "record a TIME_INTERVAL for one target of one session, then process". Extract the shared private helper and call it from both sites, preserving `start()`'s session pinning and per-target error isolation exactly as they are:

```ts
private emitIntervalTick(session: CmcdSessionState<C>, config: CmcdEventReportConfigNormalized<C>): void {
	const target = session.eventTargets.get(config)

	if (target) {
		this.recordTargetEvent(session, target, config, CMCD_EVENT_TIME_INTERVAL)
		this.processEventTargets()
	}
}
```

In `start()`, the try block becomes `this.emitIntervalTick(session, config)` (note `start()` already holds the `target`; the lookup returning the same object is harmless). In `armInterval`, the callback body becomes `this.emitIntervalTick(this.ledger.current, config)`.

- [ ] **Step 2: Confirm the facade shape**

Read `CmcdReporter.ts` top to bottom once. It must contain no module-scope logic beyond imports, `decodeSnapshot`, and `defaultRequester`, and no method longer than roughly a screen. If anything else remains inline (a leftover comment block, a dead import, an unused type), remove it now.

- [ ] **Step 3: Changelog entry**

Under `## [Unreleased]` in `libs/cmcd/CHANGELOG.md` add:

```markdown
### Changed

- Internal restructuring of `CmcdReporter` into session-ledger, player-state, report-pipeline, and outbox units in preparation for child reporters and automatic session counters. No public API or behavior change.
```

(If an `### Changed` heading already exists under Unreleased, add only the bullet.)

- [ ] **Step 4: Full validation**

```bash
npm test
git diff --exit-code libs/cmcd/config/cml-cmcd.api.md
git status --porcelain libs/cmcd/test/
```

Expected: the full root suite (lint, build all, typecheck, every package's tests) passes; api.md unchanged; the last command prints nothing (zero test edits across the whole plan).

- [ ] **Step 5: Commit**

```bash
git add libs/cmcd/src libs/cmcd/CHANGELOG.md
git commit -s -m "refactor(cmcd): finish reporter facade cleanup"
```

---

## Self-review checklist (for the plan author, completed)

- Spec coverage: all four units from architecture.md have tasks (ledger: 3, player state: 2, pipeline: 4, outbox: 5); the facade and event-source unification land in 2 and 6.
- No placeholders: every new module's full code is present; moves cite exact symbols and line ranges at `18f38f041`.
- Type consistency: `CmcdPlayerState` (Task 2) is consumed by Tasks 2, 3, 6; `CmcdSessionState`/`CmcdTargetStamps`/`CmcdEventTargetState` (Task 3) are consumed by Tasks 4, 5, 6 with the Task 5 shape change called out; `CmcdRequester` (Task 5) threads through the factory and facade.
