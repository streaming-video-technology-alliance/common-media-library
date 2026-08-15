# CmcdReporter Internal Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `CmcdReporter`'s internals into four units with single ownership (session ledger, playback state, pure report pipeline, per-target outboxes) with zero public API change, fixing the five known defects from the #416 final review along the way, each with its own regression test.

**Architecture:** See [architecture.md](architecture.md). `CmcdReporter` becomes a thin facade over a `CmcdSessionLedger` (sid-keyed session storage, retention, archival, dirty tracking), a `CmcdPlaybackState` (per-playback data, provenance, and dedup baseline, per the child-reporters RFC's state partition), pure pipeline functions (`applyReportPolicy`, `stampReport`) with counter commits deferred until encoding succeeds, and `CmcdOutbox` instances (delivery only, callbacks bound at construction). Ordering invariants that are enforced today by call-site discipline become structural: policy runs before stamp, commits happen only after a report is safely queued, delivery never sees CMCD semantics.

**Tech Stack:** TypeScript (`isolatedDeclarations`, `verbatimModuleSyntax`), `node:test` + `node:assert`, tsdown build, api-extractor for public API surface tracking.

## Global Constraints

- **Base branch**: `main` at or after `18f38f041` (PR #416, the v13 session-retention implementation). Line references cite `libs/cmcd/src/CmcdReporter.ts` at that commit; symbols are authoritative, line numbers are hints.
- **Test policy**: existing test cases in `libs/cmcd/test/CmcdReporter.test.ts` MUST NOT be edited. New tests are added only where a task says so: a red-then-green regression test for each defect fix, appended to the same file. A step that seems to require editing an existing test is an unplanned behavior change; stop and escalate. The final task verifies the test-file diff contains additions only.
- **Defect-fix ledger**: exactly five behavior changes are in scope, all open findings from the #416 final review. (1) `sn`/`msdSent` committed before encode can throw (Task 4). (2) Eviction destroying a session an active fan-out still holds (Task 3). (3) `copyItemValue` sharing `SfToken` values and `Uint8Array` params/values (Task 1). (4) `stop()` during `start()`'s fan-out leaving later targets armed (Task 6). (5) Full retained-session scan on every processing pass (Task 5, performance only, no regression test). Anything else that changes observable behavior is out of scope.
- **Zero public API change**: no new exports from `libs/cmcd/src/index.ts`. After every task's build, `git diff --exit-code libs/cmcd/config/cml-cmcd.api.md` must pass.
- All new files are internal modules under `libs/cmcd/src/`, named for their primary export, no default exports, `type` not `interface`, tab indentation, no module-scope side effects. Preserve every existing `/* @__PURE__ */` annotation when moving module-scope constants.
- When moving code, move its TSDoc and comments with it verbatim. Do not add new rationale comments; rationale goes in the commit message.
- Development requires Node >= 24. Fresh worktrees: `npm install` and `git submodule update --init` before anything else (without a local `node_modules`, typecheck resolves against another checkout's stale `dist`).
- Tests import bundled output: always `npm run build -w libs/cmcd` before `npm test -w libs/cmcd`. Tests import from `@svta/cml-cmcd`, never relative paths.
- Every commit: `git commit -s`, conventional-commit format (`refactor(cmcd):` for extractions, `fix(cmcd):` for defect fixes), and an AI-assistance trailer in the AGENTS.md placeholder form, `Co-Authored-By: <agent-name> <model> <noreply@anthropic.com>`, filled in with the executing agent's own name and model.
- Do **not** bump any `package.json` version. Changelog entries land once, in Task 6.

---

### Task 1: Extract shared reporter internals; complete the structured-value copy

Code motion for three groups of module-scope helpers, plus defect fix (3): `copyItemValue` currently preserves the `SfItem` wrapper but shares mutable objects held in `value` and `params` (`SfToken` instances, `Uint8Array` byte sequences), so caller or transform mutation reaches the persistent store, sibling targets, and archived snapshots.

**Files:**
- Create: `libs/cmcd/src/copyReportValues.ts`
- Create: `libs/cmcd/src/createCmcdReporterConfig.ts`
- Create: `libs/cmcd/src/CMCD_REQUIRED_EVENT_KEYS.ts`
- Modify: `libs/cmcd/src/CmcdReporter.ts` (delete the moved code, add imports)
- Test: `libs/cmcd/test/CmcdReporter.test.ts` (append one regression test)

**Interfaces:**
- Consumes: existing types (`Cmcd`, `CmcdEncodeOptions`, `CmcdReporterConfig`, `CmcdEventReportConfig`, `CmcdKey`, `CmcdEventType`) and constants (`CMCD_V2`, `CMCD_DEFAULT_TIME_INTERVAL`, `CMCD_QUERY`, `CMCD_STATE_EVENT_FIELDS`, event-type constants), plus `uuid` from `@svta/cml-utils`.
- Produces:
  - `copyReportValues(data: Cmcd): Cmcd` (moved lines 173 to 228, deepened per Step 3; `copyItemValue` and `copyBareValue` stay module-private beside it)
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

Move each block verbatim (code, TSDoc, comments, `@__PURE__` annotations), changing only what an export keyword and import paths require. `copyReportValues.ts` exports `copyReportValues` and keeps `copyItemValue` private. `createCmcdReporterConfig.ts` exports the three normalized type aliases, `createEncodingOptions`, and `createCmcdReporterConfig`. `CMCD_REQUIRED_EVENT_KEYS.ts` exports the map constant. In `CmcdReporter.ts`, delete the moved blocks and add:

```ts
import { CMCD_REQUIRED_EVENT_KEYS } from './CMCD_REQUIRED_EVENT_KEYS.ts'
import { copyReportValues } from './copyReportValues.ts'
import type { CmcdEventReportConfigNormalized, CmcdReporterConfigNormalized } from './createCmcdReporterConfig.ts'
import { createCmcdReporterConfig, createEncodingOptions } from './createCmcdReporterConfig.ts'
```

Do NOT touch `libs/cmcd/src/index.ts`. Verify the move alone is green before the fix:

```bash
npm run typecheck && npm run build -w libs/cmcd && npm test -w libs/cmcd
```

- [ ] **Step 3: Commit the extraction**

```bash
git add libs/cmcd/src
git commit -s -m "refactor(cmcd): extract shared reporter internals into modules"
```

- [ ] **Step 4: Write the failing regression test for shared structured-value internals**

Append to `libs/cmcd/test/CmcdReporter.test.ts`, following the file's existing mock-requester pattern (a transform mutates nested objects it was handed; the persistent store must not see it):

```ts
it('detaches SfToken values and Uint8Array params from transform mutation', async () => {
	const bodies: string[] = []
	const reporter = new CmcdReporter({
		sid: 'sess-copy',
		eventTargets: [
			{
				url: 'https://collector.example.com/cmcd',
				events: [CmcdEventType.PLAY_STATE],
				enabledKeys: ['sta', 'com.example-tok', 'com.example-bin', 'sid', 'e', 'ts', 'sn'],
				batchSize: 1,
				transform: (data) => {
					const tok = data['com.example-tok'] as SfToken
					const bin = data['com.example-bin'] as SfItem<string, Record<string, unknown>>
					tok.description = 'mutated'
					;(bin.params!['data'] as Uint8Array)[0] = 9
					return data
				},
			},
		],
	}, async (request) => {
		bodies.push(String(request.body))
		return { status: 200 }
	})

	reporter.update({
		'com.example-tok': new SfToken('preload'),
		'com.example-bin': new SfItem('k', { data: new Uint8Array([1, 2, 3]) }),
	})

	reporter.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.PLAYING })
	reporter.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.PAUSED })
	await Promise.resolve()

	// The second report re-reads the persistent store: the first transform's
	// nested mutation must not have reached it.
	assert.match(bodies[1], /com.example-tok=preload/)
	assert.match(bodies[1], /:AQID:/) // base64 of [1, 2, 3]
})
```

Adjust the two assertions to the exact wire syntax the suite's neighboring token and byte-sequence tests assert (match their expected-line style); the load-bearing part is that the second report carries the pre-mutation values.

Run: `npm run build -w libs/cmcd && npm test -w libs/cmcd`
Expected: FAIL, second body reflects `mutated` and the altered byte.

- [ ] **Step 5: Deepen the copy**

In `copyReportValues.ts`, add a module-private helper and route nested objects through it:

```ts
/**
 * Copies a mutable object held inside an item: an SfToken-shaped value,
 * a byte sequence, or an inner list of either.
 */
function copyBareValue(value: unknown): unknown {
	if (value instanceof Uint8Array) {
		return value.slice()
	}

	if (Array.isArray(value)) {
		return value.map(copyBareValue)
	}

	if (value !== null && typeof value === 'object') {
		return Object.assign(Object.create(Object.getPrototypeOf(value)), value)
	}

	return value
}
```

Rework `copyItemValue` to use it for the item's `value` and each `params` member, and to copy a bare `Uint8Array` before the wrapper path:

```ts
function copyItemValue(value: unknown): unknown {
	if (value === null || typeof value !== 'object') {
		return value
	}

	if (value instanceof Uint8Array) {
		return value.slice()
	}

	const copy = Object.assign(Object.create(Object.getPrototypeOf(value)), value) as { value?: unknown; params?: Record<string, unknown>; }

	if (copy.value !== null && typeof copy.value === 'object') {
		copy.value = copyBareValue(copy.value)
	}

	if (copy.params !== null && typeof copy.params === 'object') {
		const params = copy.params = { ...copy.params }

		for (const key in params) {
			const member = params[key]

			if (member !== null && typeof member === 'object') {
				params[key] = copyBareValue(member)
			}
		}
	}

	return copy
}
```

Keep the existing prototype-preservation TSDoc on `copyItemValue`; it still states the constraint.

- [ ] **Step 6: Verify green and commit the fix**

```bash
npm run typecheck
npm run build -w libs/cmcd
npm test -w libs/cmcd
git diff --exit-code libs/cmcd/config/cml-cmcd.api.md
git add libs/cmcd/src libs/cmcd/test
git commit -s -m "fix(cmcd): detach SfToken and byte-sequence internals in report copies"
```

---

### Task 2: Split playback state from session state

The load-bearing task: `CmcdSession` stops holding the per-playback fields, which move to a new `CmcdPlaybackState` held by the reporter, per the child-reporters RFC's state partition. The name is `CmcdPlaybackState` because `CmcdPlayerState` is existing public API (the `sta` const enum, `src/CmcdPlayerState.ts`, re-exported at `index.ts:42`). `bg` and its dedup baseline move to session state, the playback gains a `pid`, an `epoch`, and the base provenance record, sessions gain per-playback `snapshots` and per-identity `requestTargets`, and state-change acceptance becomes a function.

**Files:**
- Create: `libs/cmcd/src/CmcdPlaybackState.ts`
- Create: `libs/cmcd/src/acceptStateChange.ts`
- Modify: `libs/cmcd/src/CmcdReporter.ts`

**Interfaces:**
- Consumes: `copyReportValues` (Task 1), `CMCD_STATE_EVENT_FIELDS`, `CmcdEventType`, `Cmcd`, `CmcdObjectTypeList`, `CmcdRequestProvenance`.
- Produces:
  - `CMCD_ROOT_PID: string`, `CmcdStateField` (`'sta' | 'pr' | 'cid' | 'br'`, no `bg`), `CmcdPlaybackState`, `mintProvenance(sid, cid): CmcdRequestProvenance` (moved lines 257 to 265), and `createCmcdPlaybackState(pid: string, sid: string, epoch: number, data: Cmcd): CmcdPlaybackState`, all from `CmcdPlaybackState.ts`
  - `CmcdBgState` (`{ bg?: boolean; bgEmitted?: boolean; }`), `CMCD_STATE_FIELDS: readonly CmcdStateFieldEntry[]` (each entry `{ event, field, equal, snapshot }` where `field` is `CmcdStateField | 'bg'`), and `acceptStateChange(playback: CmcdPlaybackState, session: CmcdBgState, type: CmcdEventType, data: Partial<Cmcd>): boolean` (false = suppress), from `acceptStateChange.ts`
  - `CmcdSession<C>` (still inline in `CmcdReporter.ts` until Task 3) reshaped to `{ sid, msd, bg?, bgEmitted?, snapshots: Map<string, Cmcd>, eventTargets, requestTargets: Map<string, CmcdTargetStamps> }`, plus the module constant `CMCD_DEFAULT_REQUEST_TARGET`

- [ ] **Step 1: Create `CmcdPlaybackState.ts`**

```ts
import type { Cmcd } from './Cmcd.ts'
import type { CmcdRequestProvenance } from './CmcdRequestProvenance.ts'

/**
 * The playback id of the reporter's own (root) playback. Children mint
 * distinct ids; records without a pid resolve to the root snapshot.
 */
export const CMCD_ROOT_PID = 'root'

/**
 * Tracked state field owned by a playback (dedup + auto-trigger).
 * `bg` is deliberately absent: its value and baseline are session-owned.
 */
export type CmcdStateField = 'sta' | 'pr' | 'cid' | 'br'

/**
 * The state owned by one playback: its persistent data store, its base
 * provenance record, and its state-change dedup baseline. Session-scoped
 * state (counters, gates, queues, bg) lives on the session; see the
 * child-reporters RFC state partition.
 */
export type CmcdPlaybackState = {
	pid: string;
	/** The ledger epoch this playback last observed; lazy baseline reset. */
	epoch: number;
	data: Cmcd;
	provenance: CmcdRequestProvenance;
	lastEmitted: Partial<Pick<Cmcd, CmcdStateField>>;
}

export function createCmcdPlaybackState(pid: string, sid: string, epoch: number, data: Cmcd): CmcdPlaybackState {
	return { pid, epoch, data, provenance: mintProvenance(sid, data.cid), lastEmitted: {} }
}
```

Move `mintProvenance` (lines 257 to 265) into this file with its TSDoc and export it (the facade re-mints on `cid` change and rotation). Delete the private `StateField` alias (line 63) in favor of `CmcdStateField`.

- [ ] **Step 2: Create `acceptStateChange.ts`**

Move `StateFieldEntry` (lines 65 to 78, renamed `CmcdStateFieldEntry` and exported as a type), `cmcdObjectTypeListEqual` (lines 80 to 111), `equal`, `identity` (lines 113 to 114), and the table construction (lines 116 to 137) into this file, keeping `@__PURE__` annotations. Export the table as `CMCD_STATE_FIELDS` and keep the by-event map private. Add:

```ts
export type CmcdBgState = {
	bg?: boolean;
	bgEmitted?: boolean;
}

export function acceptStateChange(playback: CmcdPlaybackState, session: CmcdBgState, type: CmcdEventType, data: Partial<Cmcd>): boolean {
	const entry = STATE_FIELDS_BY_EVENT.get(type)

	if (!entry) {
		return true
	}

	const field = entry.field
	const incoming = data[field]

	if (field === 'bg') {
		if (incoming !== undefined) {
			session.bg = incoming as boolean
		}

		if (session.bg === undefined || session.bg === session.bgEmitted) {
			return false
		}

		session.bgEmitted = session.bg
		return true
	}

	if (incoming !== undefined) {
		Object.assign(playback.data, { [field]: incoming })
	}

	const current = playback.data[field]

	if (current === undefined) {
		return false
	}

	if (entry.equal(current, playback.lastEmitted[field])) {
		return false
	}

	Object.assign(playback.lastEmitted, { [field]: entry.snapshot(current) })
	return true
}
```

Move the TSDoc from the inlined original (lines 739 to 762) onto this function.

- [ ] **Step 3: Rewire `CmcdReporter.ts`**

Each edit, by symbol:

- `CmcdSession<C>` (line 334): remove `data`, `lastEmitted`, and `provenance`; add `bg?: boolean;`, `bgEmitted?: boolean;`, `snapshots: Map<string, Cmcd>;` (empty on creation), and replace `requestTarget: CmcdTarget;` with `requestTargets: Map<string, CmcdTargetStamps>;` initialized with one entry under a new module constant `const CMCD_DEFAULT_REQUEST_TARGET = 'default'`.
- Class fields: add `private playback: CmcdPlaybackState` and `private epoch = 0` (moves into the ledger in Task 3).
- Constructor (line 401): `this.playback = createCmcdPlaybackState(CMCD_ROOT_PID, this.config.sid, 0, { cid: this.config.cid, v: this.config.version })`. `createSession` becomes `createSession(sid: string, bg: boolean | undefined)`: no data parameter, carries `bg` in, fresh `bgEmitted: undefined`, fresh maps.
- Add a private epoch sync, called at the top of `emitEvent` and `update` (inert for the eagerly-reset root; children rely on it later):

```ts
private syncPlayback(): void {
	if (this.playback.epoch !== this.epoch) {
		this.playback.epoch = this.epoch
		this.playback.lastEmitted = {}
	}
}
```

- `update()` (line 582): `sid` rotation check first, as today. Then `msd` validation writes `session.msd` unchanged. Route `bg` to the session: `if ('bg' in data) { session.bg = data.bg }` (dedup and emission stay in the event path). The persistent merge becomes `this.playback.data = { ...this.playback.data, ...data, sid: undefined, msd: undefined, bg: undefined }` (session-owned keys are stripped; `bg` joins `sid` and `msd`). The `cid` re-mint targets the playback record: `if (this.playback.data.cid !== this.playback.provenance.cid) { this.playback.provenance = mintProvenance(session.sid, this.playback.data.cid) }`. Replace the auto-fire loop (lines 620 to 624) with an allocation-free pass that lets the emit path's shared dedup do the suppression (the old pre-check duplicated it):

```ts
for (const entry of CMCD_STATE_FIELDS) {
	if (entry.field in data) {
		this.recordEvent(entry.event)
	}
}
```

- `startSession()` (line 642): archive under the root pid, recreate the playback (same pid, new sid, bumped epoch), and carry `bg` into the new session:

```ts
const snapshot = copyReportValues({ ...this.playback.data })
this.session.snapshots.set(this.playback.pid, snapshot)
this.epoch++
this.playback = createCmcdPlaybackState(this.playback.pid, sid, this.epoch, { ...snapshot })
this.session = this.createSession(sid, this.session.bg)
```

The map re-insert, drain, evict, and re-arm steps (lines 650 to 679) are unchanged in this task.

- `emitEvent()` (line 738): `this.syncPlayback()`, then replace the dedup block (lines 739 to 762) with:

```ts
if (!acceptStateChange(this.playback, session, type, data)) {
	return
}
```

This is safe for archived sessions because only `RESPONSE_RECEIVED` is ever emitted into one, and non-state events pass through `acceptStateChange` without touching playback or bg state.

- `recordTargetEvent()` (line 801): the item spread at line 808 becomes:

```ts
const item: Cmcd = {
	...(session.snapshots.get(CMCD_ROOT_PID) ?? this.playback.data),
	...(session.bg !== undefined && { bg: session.bg }),
	...data,
	sid: session.sid,
	e: type,
	ts: data.ts ?? Date.now(),
}
```

Sourcing per target call preserves today's mid-fan-out behavior: a transform that rotates the session synchronously leaves later targets reading the archived snapshot. The snapshot lookup is keyed by the root pid today; the children PR threads the provenance record's `pid` through this lookup (`record.pid ?? CMCD_ROOT_PID`), which is why the map exists now.

- `createRequestReport()` (line 1106): provenance comes from the playback (`const base = this.playback.provenance` in `createRequestProvenance`, line 1068). The merge at line 1136 becomes `{ ...this.playback.data, ...(session.bg !== undefined && { bg: session.bg }), ...data, sid: session.sid }`. Request-target stamps come from the map:

```ts
let stamps = session.requestTargets.get(CMCD_DEFAULT_REQUEST_TARGET)

if (!stamps) {
	stamps = { sn: 0, msdSent: false }
	session.requestTargets.set(CMCD_DEFAULT_REQUEST_TARGET, stamps)
}
```

with `stamps` replacing every `session.requestTarget` reference (lines 1156, 1164, 1185).

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npm run build -w libs/cmcd
npm test -w libs/cmcd
git diff --exit-code libs/cmcd/config/cml-cmcd.api.md
```

Expected: all green with zero test edits. Pay particular attention to the session-retention, dedup, and `bg` state-event test groups; they pin the exact semantics this task moves, including `bg` surviving rotation in the persistent store (now via the session's carried `bg`) and the fresh baseline re-emitting after a `sid` change.

- [ ] **Step 5: Commit**

```bash
git add libs/cmcd/src
git commit -s -m "refactor(cmcd): split playback state from session state"
```

---

### Task 3: Move session storage into a session ledger; defer eviction past active fan-outs

The `sessions` map, current pointer, epoch, rotation, structural resolution, and eviction move into a `CmcdSessionLedger`. Defect fix (2): with `sessionRetention: 0`, a transform that rotates the session mid-fan-out lets `startSession` evict the pinned session before later targets enqueue into it, so their reports land on an unreachable object and are never sent. Eviction requested while a fan-out is active is deferred until the outermost fan-out completes.

**Files:**
- Create: `libs/cmcd/src/CmcdSessionState.ts`
- Create: `libs/cmcd/src/CmcdSessionLedger.ts`
- Modify: `libs/cmcd/src/CmcdReporter.ts`
- Test: `libs/cmcd/test/CmcdReporter.test.ts` (append one regression test)

**Interfaces:**
- Consumes: `CmcdEventReportConfigNormalized<C>` (Task 1), `CmcdBgState` (Task 2), `Cmcd`.
- Produces:
  - `CmcdTargetStamps` (`{ sn: number; msdSent: boolean; }`), `CmcdEventTargetState` (`CmcdTargetStamps & { queue: string[]; disposed: boolean; }`, reshaped in Task 5), `CMCD_DEFAULT_REQUEST_TARGET`, `CmcdSessionState<C>` (`{ sid, seq, msd, bg?, bgEmitted?, snapshots, eventTargets, requestTargets }`, satisfies `CmcdBgState`), and `createCmcdSessionState<C>(sid: string, bg: boolean | undefined, targets: CmcdEventReportConfigNormalized<C>[]): CmcdSessionState<C>` (seq stamped by the ledger on insert), from `CmcdSessionState.ts`
  - `class CmcdSessionLedger<C>` with `epoch: number`, `current: CmcdSessionState<C>`, `resolve(provenance: unknown): CmcdSessionState<C> | undefined`, `rotate(next: CmcdSessionState<C>, pid: string, snapshot: Cmcd): void` (archives, bumps epoch, delete-first re-insert, seq-stamps), `evict(): void`, `markDirty(session): void`, `takeDirty(): CmcdSessionState<C>[]` (oldest-first by `seq`, clears the set; used from Task 5), `forEach(fn): void`
  - Facade: `private fanOutDepth = 0`, `private evictPending = false`, and `requestEvict()` which defers while `fanOutDepth > 0`

- [ ] **Step 1: Create `CmcdSessionState.ts`**

Move the target and session types out of `CmcdReporter.ts` (as reshaped by Task 2), renaming `CmcdSession` to `CmcdSessionState` and `CmcdTarget`/`CmcdEventTarget` to `CmcdTargetStamps`/`CmcdEventTargetState`, with their TSDoc, plus the `CMCD_DEFAULT_REQUEST_TARGET` constant. Add `seq: number;` to the session type (the ledger stamps it) and the factory:

```ts
export function createCmcdSessionState<C>(sid: string, bg: boolean | undefined, targets: CmcdEventReportConfigNormalized<C>[]): CmcdSessionState<C> {
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
		seq: 0,
		msd: NaN,
		bg,
		bgEmitted: undefined,
		snapshots: new Map(),
		eventTargets,
		requestTargets: new Map([[CMCD_DEFAULT_REQUEST_TARGET, { sn: 0, msdSent: false }]]),
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
	private seq = 0
	private dirty = new Set<CmcdSessionState<C>>()

	epoch = 0
	current: CmcdSessionState<C>

	constructor(retention: number, initial: CmcdSessionState<C>) {
		this.retention = retention
		this.current = initial
		initial.seq = this.seq++
		this.sessions.set(initial.sid, initial)
	}

	resolve(provenance: unknown): CmcdSessionState<C> | undefined {
		if (provenance === null || typeof provenance !== 'object') {
			return undefined
		}

		const { sid } = provenance as { sid?: unknown; }

		return typeof sid === 'string' ? this.sessions.get(sid) : undefined
	}

	rotate(next: CmcdSessionState<C>, pid: string, snapshot: Cmcd): void {
		this.current.snapshots.set(pid, snapshot)
		this.epoch++
		next.seq = this.seq++
		this.sessions.delete(next.sid)
		this.sessions.set(next.sid, next)
		this.current = next
	}

	evict(): void {
		for (const key of this.sessions.keys()) {
			if (this.sessions.size <= this.retention + 1) {
				break
			}

			const session = this.sessions.get(key)!
			this.dirty.delete(session)
			this.sessions.delete(key)
		}
	}

	markDirty(session: CmcdSessionState<C>): void {
		this.dirty.add(session)
	}

	takeDirty(): CmcdSessionState<C>[] {
		if (this.dirty.size === 0) {
			return []
		}

		const sessions = [...this.dirty].sort((a, b) => a.seq - b.seq)
		this.dirty.clear()
		return sessions
	}

	forEach(fn: (session: CmcdSessionState<C>) => void): void {
		this.sessions.forEach(fn)
	}
}
```

Move the TSDoc from `resolveSession`, the re-insert comment (lines 646 to 649), and the eviction comment (lines 657 to 660) onto the corresponding methods, and the retained-sessions field TSDoc (lines 373 to 379) onto the class. `markDirty`/`takeDirty` are wired up in Task 5; until then `processEventTargets` keeps using `forEach`.

- [ ] **Step 3: Rewire `CmcdReporter.ts`**

- Replace the `sessions`, `session`, and `epoch` fields with `private ledger: CmcdSessionLedger<C>`, `private fanOutDepth = 0`, and `private evictPending = false`; every `this.session` read becomes `this.ledger.current` and every `this.epoch` read becomes `this.ledger.epoch`.
- Constructor: `this.ledger = new CmcdSessionLedger(this.config.sessionRetention, createCmcdSessionState(this.config.sid, undefined, this.config.eventTargets))`. Delete the private `createSession` method in favor of the factory.
- Wrap both fan-outs (the per-target loops in `emitEvent`, lines 770 to 777, and `start()`, lines 466 to 485) with depth accounting. In `emitEvent`:

```ts
this.fanOutDepth++

try {
	session.eventTargets.forEach((target, config) => {
		try {
			this.recordTargetEvent(session, target, config, type, data, request)
		}
		catch (error) {
			failure ??= { error }
		}
	})
}
finally {
	this.fanOutDepth--
}

this.processEventTargets()
this.maybeEvict()
```

and the same increment/try/finally around `start()`'s `forEach`, followed by `this.maybeEvict()` after its loop.

- Add the deferral:

```ts
private requestEvict(): void {
	if (this.fanOutDepth > 0) {
		this.evictPending = true
	}
	else {
		this.ledger.evict()
	}
}

private maybeEvict(): void {
	if (this.fanOutDepth === 0 && this.evictPending) {
		this.evictPending = false
		this.ledger.evict()
	}
}
```

- `startSession()` becomes:

```ts
private startSession(sid: string): void {
	const snapshot = copyReportValues({ ...this.playback.data })
	const bg = this.ledger.current.bg
	this.ledger.rotate(createCmcdSessionState(sid, bg, this.config.eventTargets), this.playback.pid, snapshot)
	this.playback = createCmcdPlaybackState(this.playback.pid, sid, this.ledger.epoch, { ...snapshot })
	this.processEventTargets()
	this.requestEvict()
	// timer re-arm loop unchanged (lines 669 to 679)
}
```

- Delete `resolveSession`; `recordResponseReceived` calls `this.ledger.resolve(provenance)`.
- `processEventTargets`: `this.sessions.forEach` becomes `this.ledger.forEach`, and the `session !== this.session` drain check becomes `session !== this.ledger.current`.
- `disposeEventTarget`: the `session === this.session` timer check becomes `session === this.ledger.current`.

- [ ] **Step 4: Write the failing regression test for mid-fan-out eviction**

Append to `CmcdReporter.test.ts`:

```ts
it('sends reports queued into a session evicted mid-fan-out at sessionRetention 0', async () => {
	const bodies: string[] = []
	const reporter = new CmcdReporter({
		sid: 's1',
		sessionRetention: 0,
		eventTargets: [
			{
				url: 'https://a.example.com/cmcd',
				events: [CmcdEventType.PLAY_STATE],
				enabledKeys: ['sta', 'sid', 'e', 'ts', 'sn'],
				batchSize: 1,
				// Rotating inside the first target's transform leaves the
				// second target still fanning out on pinned s1.
				transform: (data) => {
					reporter.update({ sid: 's2' })
					return data
				},
			},
			{
				url: 'https://b.example.com/cmcd',
				events: [CmcdEventType.PLAY_STATE],
				enabledKeys: ['sta', 'sid', 'e', 'ts', 'sn'],
				batchSize: 1,
			},
		],
	}, async (request) => {
		bodies.push(`${request.url} ${String(request.body)}`)
		return { status: 200 }
	})

	reporter.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.PLAYING })
	await Promise.resolve()

	const bReports = bodies.filter((body) => body.startsWith('https://b.example.com/cmcd'))
	assert.equal(bReports.length, 1)
	assert.match(bReports[0], /sid="s1"/)
})
```

Run: `npm run build -w libs/cmcd && npm test -w libs/cmcd`
Expected: FAIL, target B's s1 report was destroyed by eager eviction.

- [ ] **Step 5: Verify green and commit twice**

```bash
npm run typecheck
npm run build -w libs/cmcd
npm test -w libs/cmcd
git diff --exit-code libs/cmcd/config/cml-cmcd.api.md
```

Commit the ledger extraction first (the two new files plus the facade rewire, with `requestEvict`/`maybeEvict` calling `ledger.evict()` directly), then the deferral and its regression test:

```bash
git add libs/cmcd/src/CmcdSessionState.ts libs/cmcd/src/CmcdSessionLedger.ts libs/cmcd/src/CmcdReporter.ts
git commit -s -m "refactor(cmcd): move session storage into a session ledger"
git add libs/cmcd/src libs/cmcd/test
git commit -s -m "fix(cmcd): defer session eviction past active fan-outs"
```

If the two changes will not stage separately in your working order, one `refactor(cmcd)` commit whose body names the fix is acceptable; the regression test must land in the same commit as the deferral either way. The changelog entry lands in Task 6.

- [ ] **Step 6: Verify the retention tests still pin rotation**

Re-run the retention normalization table tests and the sid-reuse tests specifically (node:test name filters are fine) and confirm they pass unmodified; they pin `rotate`/`evict` exactly.

---

### Task 4: Extract the report policy and stamp pipeline stages; commit counters after encode

The transform contract and reporter-owned stamping each become one pure function. Defect fix (1): today `sn++` runs (line 875) and the event-mode gate closes (line 886) before `encodeCmcd` can throw (line 892), so an unserializable value burns a sequence number and can eat the session's `msd` with nothing queued; request mode has the same ordering (lines 1156 to 1186). Stamps now write the current counter value, and commits happen only after the report is safely queued (event mode) or prepared and attached (request mode).

**Files:**
- Create: `libs/cmcd/src/applyReportPolicy.ts`
- Create: `libs/cmcd/src/stampReport.ts`
- Modify: `libs/cmcd/src/CmcdReporter.ts`
- Test: `libs/cmcd/test/CmcdReporter.test.ts` (append one regression test)

**Interfaces:**
- Consumes: `copyReportValues` (Task 1), `CmcdSessionState`/`CmcdTargetStamps` (Task 3), `CmcdKey`, `CmcdEventType`, `CmcdTransformRequest`.
- Produces:
  - `applyReportPolicy<C, R extends CmcdTransformRequest<C> | undefined>(report: Cmcd, transform: ((data: Cmcd, request: R) => Cmcd | null) | undefined, request: R, requiredKey: CmcdKey | undefined, restoreTs: boolean): Cmcd | null`
  - `stampReport<C>(report: Cmcd, session: CmcdSessionState<C>, stamps: CmcdTargetStamps, attachMsd: boolean, type?: CmcdEventType): boolean` (returns whether `msd` rode the report; writes `stamps.sn` without incrementing; the caller commits `sn` and the gate only after encode and enqueue succeed)

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

Extracted from `queueTargetEvent` (lines 873 to 891) and `createRequestReport` (lines 1155 to 1171); the msd-gate TSDoc from both sites moves onto the function, amended to state the two-phase contract:

```ts
export function stampReport<C>(report: Cmcd, session: CmcdSessionState<C>, stamps: CmcdTargetStamps, attachMsd: boolean, type?: CmcdEventType): boolean {
	if (type !== undefined) {
		report.e = type
	}

	report.sn = stamps.sn
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

`queueTargetEvent` becomes (commit after the push succeeds):

```ts
private queueTargetEvent(session: CmcdSessionState<C>, target: CmcdEventTargetState, config: CmcdEventReportConfigNormalized<C>, report: Cmcd, type: CmcdEventType): void {
	const attach = stampReport(report, session, target, config.enabledKeys?.includes('msd') ?? false, type)

	target.queue.push(encodeCmcd(report, createEncodingOptions(CMCD_EVENT_MODE, config)))

	target.sn++

	if (attach) {
		target.msdSent = true
	}
}
```

(Task 5 changes `target.queue.push` to `target.outbox.push`; the commit-after-push ordering is what matters here.)

- [ ] **Step 4: Rewire the request path**

In `createRequestReport`, the transform block (lines 1140 to 1153) becomes:

```ts
let cmcdData: Cmcd | null = applyReportPolicy(merged, transform, request as CmcdTransformRequest<C>, undefined, false)

if (cmcdData == null) {
	return report
}
```

The stamping block (lines 1155 to 1171) becomes `const sendMsd = stampReport(cmcdData, session, stamps, true)`, and the commits move to the end of the decoration path, after `prepareCmcdData`, `encodePreparedCmcd`, and the query/header attachment have all succeeded (replacing lines 1184 to 1186):

```ts
stamps.sn++

if (sendMsd && cmcd.msd !== undefined) {
	stamps.msdSent = true
}
```

Request mode confirms the gate against the prepared output because its key filter runs downstream of stamping; that rule is unchanged. What moves is `sn`'s increment, from stamp time to after the encode that can throw.

- [ ] **Step 5: Write the failing regression test for counter corruption**

Append to `CmcdReporter.test.ts`. A structured-field integer above the RFC 8941 maximum makes `encodeCmcd` throw at enqueue:

```ts
it('consumes no sequence number or msd gate when encoding throws at enqueue', async () => {
	const bodies: string[] = []
	const reporter = new CmcdReporter({
		sid: 'sess-encode',
		eventTargets: [
			{
				url: 'https://collector.example.com/cmcd',
				events: [CmcdEventType.PLAY_STATE, CmcdEventType.CUSTOM_EVENT],
				enabledKeys: ['sta', 'cen', 'com.example-big', 'msd', 'sid', 'e', 'ts', 'sn'],
				batchSize: 1,
			},
		],
	}, async (request) => {
		bodies.push(String(request.body))
		return { status: 200 }
	})

	reporter.update({ msd: 250 })

	assert.throws(() => {
		reporter.recordEvent(CmcdEventType.CUSTOM_EVENT, {
			cen: 'boom',
			'com.example-big': 1_000_000_000_000_000,
		})
	})

	reporter.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.PLAYING })
	await Promise.resolve()

	// The failed report consumed nothing: the next report is sn=0 and
	// still carries the session's msd.
	assert.match(bodies[0], /sn=0/)
	assert.match(bodies[0], /msd=250/)
})
```

Run: `npm run build -w libs/cmcd && npm test -w libs/cmcd`
Expected: FAIL on both assertions (`sn=1`, no `msd`) before the rewire in Steps 3 and 4 lands; green after.

- [ ] **Step 6: Verify green and commit**

```bash
npm run typecheck
npm run build -w libs/cmcd
npm test -w libs/cmcd
git diff --exit-code libs/cmcd/config/cml-cmcd.api.md
git add libs/cmcd/src libs/cmcd/test
git commit -s -m "refactor(cmcd): extract the report policy and stamp pipeline stages"
```

Split the commit as in Task 3 if the extraction and the ordering fix separate cleanly (`fix(cmcd): commit sn and msd gates only after encode succeeds`).

---

### Task 5: Move event delivery into per-target outboxes with dirty tracking

Queue, batch, POST, retry re-queue, and disposal become a `CmcdOutbox` with no CMCD knowledge, its two callbacks bound once at construction. Defect fix (5, performance): processing stops scanning every retained session and every target on every pass; the ledger's dirty set tracks exactly the sessions with queued lines, so `sessionRetention: Infinity` no longer makes ordinary reporting scale with session history.

**Files:**
- Create: `libs/cmcd/src/CmcdOutbox.ts`
- Modify: `libs/cmcd/src/CmcdSessionState.ts`
- Modify: `libs/cmcd/src/CmcdReporter.ts`

**Interfaces:**
- Consumes: `CMCD_MIME_TYPE`, `HttpRequest` from `@svta/cml-utils`, `CmcdSessionLedger.markDirty`/`takeDirty` (Task 3).
- Produces:
  - `type CmcdRequester = (request: HttpRequest) => Promise<{ status: number; }>` (from `CmcdOutbox.ts`, for internal modules only; the facade's public constructor signature and its private `requester` field keep their existing inline function type verbatim, because referencing a non-exported alias from the exported class would change `cml-cmcd.api.md` or trip api-extractor's forgotten-export check)
  - `class CmcdOutbox` with `constructor(url: string, batchSize: number, requester: CmcdRequester, onGone: () => void, onDirty: () => void)`, `disposed: boolean` (readable), `push(line: string): void`, `dispose(): void`, `process(drain: boolean): boolean` (returns whether lines remain queued after this pass)
  - `CmcdEventTargetState` becomes `CmcdTargetStamps & { outbox: CmcdOutbox; }`
  - `createCmcdSessionState` loses its `targets` parameter (event-target construction moves to the facade, which owns the callbacks): `createCmcdSessionState<C>(sid: string, bg: boolean | undefined): CmcdSessionState<C>` returns the session with an empty `eventTargets` map for the facade to populate

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
	private onGone: () => void
	private onDirty: () => void

	disposed = false

	constructor(url: string, batchSize: number, requester: CmcdRequester, onGone: () => void, onDirty: () => void) {
		this.url = url
		this.batchSize = batchSize
		this.requester = requester
		this.onGone = onGone
		this.onDirty = onDirty
	}

	push(line: string): void {
		this.queue.push(line)
	}

	dispose(): void {
		this.disposed = true
		this.queue.length = 0
	}

	process(drain: boolean): boolean {
		if (this.disposed || !this.queue.length) {
			return false
		}

		if (this.queue.length < this.batchSize && !drain) {
			return false
		}

		const deleteCount = drain ? this.queue.length : this.batchSize
		const events = this.queue.splice(0, deleteCount)

		this.send(events).catch(() => {
			this.queue.unshift(...events)
			this.onDirty()
		})

		return this.queue.length > 0
	}

	private async send(data: string[]): Promise<void> {
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
			this.onGone()
		} else if (status === 429 || (status > 499 && status < 600)) {
			throw new Error(`Event report failed with status ${status}`)
		}
	}
}
```

Re-queue after disposal intentionally still lands in the (cleared, disposed) queue and is never sent, matching lines 1226 to 1230. `onDirty` re-marks the session when an async failure restores lines outside a processing pass, so the next pass finds them without a scan.

- [ ] **Step 2: Update `CmcdSessionState.ts`**

`CmcdEventTargetState` becomes `CmcdTargetStamps & { outbox: CmcdOutbox; }` (move the encode-at-enqueue TSDoc from the old `queue` member onto the type). `createCmcdSessionState` drops the `targets` parameter and returns an empty `eventTargets` map; the facade populates it because the outbox callbacks close over the facade and the session.

- [ ] **Step 3: Rewire `CmcdReporter.ts`**

- Constructor: assign the requester field **before** any session construction (today it is assigned last, line 408, which Task 5's factory order would read too early under strict initialization):

```ts
constructor(config: Partial<CmcdReporterConfig<C>>, requester: (request: HttpRequest) => Promise<{ status: number; }> = defaultRequester) {
	this.config = createCmcdReporterConfig(config)
	this.requester = requester
	this.playback = createCmcdPlaybackState(CMCD_ROOT_PID, this.config.sid, 0, {
		cid: this.config.cid,
		v: this.config.version,
	})
	this.ledger = new CmcdSessionLedger(this.config.sessionRetention, this.createSession(this.config.sid, undefined))
}
```

- Add the facade session builder (callbacks bound once per outbox, per session):

```ts
private createSession(sid: string, bg: boolean | undefined): CmcdSessionState<C> {
	const session = createCmcdSessionState<C>(sid, bg)

	for (const config of this.config.eventTargets) {
		session.eventTargets.set(config, {
			sn: 0,
			msdSent: false,
			outbox: new CmcdOutbox(
				config.url,
				config.batchSize,
				this.requester,
				() => this.disposeEventTarget(session, config),
				() => this.ledger.markDirty(session),
			),
		})
	}

	return session
}
```

`startSession` calls `this.createSession(sid, bg)` in place of the bare factory.

- Every `target.disposed` read becomes `target.outbox.disposed` (`start` line 474, `recordTargetEvent` line 802).
- `queueTargetEvent`: `target.queue.push(...)` becomes `target.outbox.push(...)` followed by `this.ledger.markDirty(session)` (before the counter commits; a marked session with an already-sent queue costs one set lookup on the next pass).
- `processEventTargets` becomes dirty-driven, oldest session first by `seq`:

```ts
private processEventTargets(flush: boolean = false): void {
	let reprocess = false

	for (const session of this.ledger.takeDirty()) {
		const drain = flush || session !== this.ledger.current

		session.eventTargets.forEach((target) => {
			if (target.outbox.process(drain)) {
				this.ledger.markDirty(session)
				reprocess = true
			}
		})
	}

	if (reprocess) {
		this.processEventTargets(flush)
	}
}
```

Keep the oldest-session-first and archived-sessions-always-drain comments (lines 1214 to 1221) on this method. The dirty-set invariant (a session is marked whenever any of its outboxes holds lines) is maintained by `queueTargetEvent`, the outbox's `onDirty` re-queue callback, and the re-mark above when a pass leaves a remainder.

- `disposeEventTarget`: the per-sibling body becomes `target.outbox.dispose()` plus the unchanged current-session `disarmInterval` call.
- Delete `sendEventReport`.

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npm run build -w libs/cmcd
npm test -w libs/cmcd
git diff --exit-code libs/cmcd/config/cml-cmcd.api.md
```

Expected: all green. The batching, 429 re-queue, 410 same-URL disposal, delayed-410 session scoping, drain-before-evict, and Task 3's mid-fan-out eviction tests pin the outbox and the dirty tracking exactly. No regression test is added for the scan removal itself (it is a performance change with no wire-visible behavior).

- [ ] **Step 5: Commit**

```bash
git add libs/cmcd/src
git commit -s -m "refactor(cmcd): move event delivery into per-target outboxes"
```

---

### Task 6: Facade cleanup, stop-during-start fix, changelog, and full validation

Unify the two interval-tick call sites, fix defect (4), write the changelog, and run the full repo validation. The defect: `stop()` called synchronously from a transform during `start()`'s fan-out sets `started = false` and disarms existing timers, but the loop continues and arms the remaining targets' timers, which then report for the rest of the session (open #416 finding at line 466).

**Files:**
- Modify: `libs/cmcd/src/CmcdReporter.ts`
- Modify: `libs/cmcd/CHANGELOG.md`
- Test: `libs/cmcd/test/CmcdReporter.test.ts` (append one regression test)

**Interfaces:**
- Consumes: everything produced by Tasks 1 through 5.
- Produces: no new symbols. `CmcdReporter.ts` should now contain only: the config field, the ledger, the playback, the timers map, the requester, the fan-out depth fields, the public methods, and thin private helpers (`emitEvent`, `recordTargetEvent`, `queueTargetEvent`, `emitIntervalTick`, `processEventTargets`, `disposeEventTarget`, `armInterval`, `disarmInterval`, `startSession`, `createSession`, `createRequestProvenance`, `syncPlayback`, `requestEvict`, `maybeEvict`, `decodeSnapshot` as a module-private function, `defaultRequester`).

- [ ] **Step 1: Write the failing regression test for stop() during start()**

Append to `CmcdReporter.test.ts`, using the suite's existing mock-timer pattern for interval tests:

```ts
it('does not arm remaining targets when a start() transform calls stop()', (t) => {
	t.mock.timers.enable({ apis: ['setInterval'] })

	const urls: string[] = []
	const reporter = new CmcdReporter({
		sid: 'sess-stop',
		eventTargets: [
			{
				url: 'https://a.example.com/cmcd',
				events: [CmcdEventType.TIME_INTERVAL],
				enabledKeys: ['sid', 'e', 'ts', 'sn'],
				interval: 1,
				batchSize: 1,
				transform: (data) => {
					reporter.stop()
					return data
				},
			},
			{
				url: 'https://b.example.com/cmcd',
				events: [CmcdEventType.TIME_INTERVAL],
				enabledKeys: ['sid', 'e', 'ts', 'sn'],
				interval: 1,
				batchSize: 1,
			},
		],
	}, async (request) => {
		urls.push(request.url)
		return { status: 200 }
	})

	reporter.start()
	const armed = urls.length

	t.mock.timers.tick(4000)

	// stop() ran during start()'s fan-out: no timer may fire afterward.
	assert.equal(urls.length, armed)
})
```

Run: `npm run build -w libs/cmcd && npm test -w libs/cmcd`
Expected: FAIL, target B's timer stayed armed and fired ticks after `stop()`.

- [ ] **Step 2: Unify the interval tick and respect stop()**

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

In `start()`, guard each iteration on the started flag so a synchronous `stop()` halts the remaining fan-out instead of arming targets after it:

```ts
session.eventTargets.forEach((target, config) => {
	if (!this.started) {
		return
	}

	this.disarmInterval(config)

	if (target.outbox.disposed || !this.armInterval(config)) {
		return
	}

	try {
		this.emitIntervalTick(session, config)
	}
	catch (error) {
		failure ??= { error }
	}
})
```

In `armInterval`, the callback body becomes `this.emitIntervalTick(this.ledger.current, config)`.

- [ ] **Step 3: Verify green and commit the fix**

```bash
npm run typecheck
npm run build -w libs/cmcd
npm test -w libs/cmcd
git add libs/cmcd/src libs/cmcd/test
git commit -s -m "fix(cmcd): halt start() fan-out when a transform stops the reporter"
```

- [ ] **Step 4: Confirm the facade shape**

Read `CmcdReporter.ts` top to bottom once. It must contain no module-scope logic beyond imports, `decodeSnapshot`, `defaultRequester`, and `CMCD_DEFAULT_REQUEST_TARGET` if it has not moved to `CmcdSessionState.ts`, and no method longer than roughly a screen. If anything else remains inline (a leftover comment block, a dead import, an unused type), remove it now.

- [ ] **Step 5: Changelog**

Under `## [Unreleased]` in `libs/cmcd/CHANGELOG.md` add (merging into existing `### Changed`/`### Fixed` headings if present):

```markdown
### Changed

- Internal restructuring of `CmcdReporter` into session-ledger, playback-state, report-pipeline, and outbox units in preparation for child reporters and automatic session counters. No public API change. Event-report processing now tracks only sessions with queued reports instead of scanning every retained session.

### Fixed

- A report value that fails structured-field encoding no longer consumes a sequence number or the session's once-per-target `msd` gate.
- Reports queued while a transform rotates the session mid-event are no longer lost when the outgoing session is evicted (`sessionRetention: 0`).
- `SfToken` values and `Uint8Array` parameters are now detached when reports are copied, so caller or transform mutation cannot alter the persistent store, sibling targets, or archived session snapshots.
- Calling `stop()` from a transform during `start()` no longer leaves the remaining targets' interval timers armed.
```

- [ ] **Step 6: Full validation**

```bash
npm test
git diff --exit-code libs/cmcd/config/cml-cmcd.api.md
git diff origin/main -- libs/cmcd/test/CmcdReporter.test.ts | grep -c '^-[^-]'
```

Expected: the full root suite (lint, build all, typecheck, every package's tests) passes; api.md unchanged; the last command prints `0` (the test-file diff contains additions only, so no existing test was edited or removed).

- [ ] **Step 7: Commit**

```bash
git add libs/cmcd/CHANGELOG.md libs/cmcd/src
git commit -s -m "refactor(cmcd): finish reporter facade cleanup"
```

---

## Self-review checklist (for the plan author, completed)

- Spec coverage: all four units from architecture.md have tasks (ledger: 3, playback state: 2, pipeline: 4, outbox: 5); the facade and event-source unification land in 2 and 6; all five defect fixes are placed (1: Task 4, 2: Task 3, 3: Task 1, 4: Task 6, 5: Task 5), each with a regression test except the scan removal (performance only).
- No placeholders: every new module's full code is present; moves cite exact symbols and line ranges at `18f38f041`; regression tests are written out (wire-syntax assertions to be matched to the suite's neighboring tests where noted).
- Type consistency: `CmcdPlaybackState`/`CMCD_ROOT_PID`/`mintProvenance` (Task 2) are consumed by Tasks 2, 3, 5, 6; `CmcdSessionState`/`CmcdTargetStamps`/`CmcdEventTargetState`/`CMCD_DEFAULT_REQUEST_TARGET` (Task 3) are consumed by Tasks 4, 5, 6 with the Task 5 shape change called out in both places; `CmcdBgState` (Task 2) is satisfied structurally by `CmcdSessionState` (Task 3); `CmcdRequester` (Task 5) stays out of the public facade's declared types.
