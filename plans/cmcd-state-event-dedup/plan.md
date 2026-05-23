# CMCD State-Change Event Deduplication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Suppress duplicate state-change events in `CmcdReporter` and auto-fire them when `update()` mutates a tracked field.

**Architecture:** A module-scope `STATE_FIELDS` dispatch table maps each tracked CMCD field (`sta`, `pr`, `cid`, `bg`, `br`) to its corresponding `CmcdEventType` and an equality function. `recordEvent` checks the dispatch table for dedup + write-through. `update` iterates the same table and auto-triggers `recordEvent` for any changed tracked field. A new private `lastEmitted` map tracks the wire-emitted value per field; `resetSession` clears it.

**Tech Stack:** TypeScript (strict, isolatedDeclarations, verbatimModuleSyntax), `node:test` + `node:assert`. Tests run against bundled output, so a build is required before each test run.

**Spec reference:** `docs/superpowers/specs/2026-05-22-cmcd-state-event-dedup-design.md`

---

## File Structure

**Modify:**

- `libs/cmcd/src/CmcdEventType.ts` — add `CMCD_EVENT_PLAYBACK_RATE` constant and `PLAYBACK_RATE` collector entry.
- `libs/cmcd/src/CMCD_TOKEN_VALUES.ts` — add `'pr'` to the `e` token list.
- `libs/cmcd/src/CmcdReporter.ts` — add `cmcdObjectTypeListEqual` helper, `STATE_FIELDS` dispatch table, `lastEmitted` private field, dedup + write-through in `recordEvent`, auto-trigger in `update`, clear `lastEmitted` in `resetSession`.
- `libs/cmcd/test/CmcdReporter.test.ts` — add new `describe('state-change dedup', …)` block with ~16 tests.
- `libs/cmcd/docs/user-guide.md` — replace two-step pattern with `update()`-only pattern, document auto-trigger + dedup.
- `libs/cmcd/CHANGELOG.md` — note the behavioral changes under `[Unreleased]`.
- `libs/cmcd/package.json` — bump version (minor: `2.3.2` → `2.4.0`).

**No new files.** The equality helper is module-private inside `CmcdReporter.ts` per the spec.

---

## Reference Commands

Build (required before tests pick up source changes):
```bash
npm run build -w libs/cmcd
```

Test:
```bash
npm test -w libs/cmcd
```

Build + test in one shot (use this during the inner TDD loop):
```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Typecheck the whole project (run before final commit):
```bash
npm run typecheck
```

Lint:
```bash
npm run lint
```

---

## Task 1: Add `CmcdEventType.PLAYBACK_RATE` (prerequisite)

**Files:**
- Modify: `libs/cmcd/src/CmcdEventType.ts`
- Modify: `libs/cmcd/src/CMCD_TOKEN_VALUES.ts`

This is enabling work for later tasks. No new tests — later dedup tests exercise the new event type.

- [ ] **Step 1: Add the `CMCD_EVENT_PLAYBACK_RATE` constant and collector entry**

Edit `libs/cmcd/src/CmcdEventType.ts`. Insert the new constant after `CMCD_EVENT_PLAY_STATE` (around line 15) and the collector entry after `PLAY_STATE` in the `CmcdEventType` object (around line 140).

After `CMCD_EVENT_PLAY_STATE`:
```ts
/**
 * CMCD event type for the 'pr' key (playback rate change).
 *
 * @public
 */
export const CMCD_EVENT_PLAYBACK_RATE = 'pr' as const
```

After `PLAY_STATE` in the collector:
```ts
/**
 * A change in the playback rate.
 */
PLAYBACK_RATE: CMCD_EVENT_PLAYBACK_RATE as typeof CMCD_EVENT_PLAYBACK_RATE,
```

- [ ] **Step 2: Add `'pr'` to the `e` token list**

Edit `libs/cmcd/src/CMCD_TOKEN_VALUES.ts`. Insert `'pr'` after `'ps'` in the `e` array (line 7):

```ts
e: ['bc', 'ps', 'pr', 'e', 't', 'c', 'b', 'm', 'um', 'pe', 'pc', 'rr', 'as', 'ae', 'abs', 'abe', 'sk', 'ce'] as const,
```

- [ ] **Step 3: Build and run all tests**

```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Expected: all existing tests pass. No new tests yet.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: passes (ignore pre-existing tsdown errors in `node_modules`).

- [ ] **Step 5: Commit**

```bash
git add libs/cmcd/src/CmcdEventType.ts libs/cmcd/src/CMCD_TOKEN_VALUES.ts
git commit -s -m "feat(cmcd): add PLAYBACK_RATE event type

The 'pr' (playback rate change) event is defined in CTA-5004-B and
documented in CmcdEvent.ts but was missing from CmcdEventType. Adds
the constant, collector entry, and 'pr' token.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: PLAY_STATE dedup baseline

**Files:**
- Modify: `libs/cmcd/src/CmcdReporter.ts`
- Modify: `libs/cmcd/test/CmcdReporter.test.ts`

Introduces the dispatch table with a single entry (`sta`), the `lastEmitted` field, dedup + write-through in `recordEvent`, and the `resetSession` clear. Subsequent tasks add more entries and the auto-trigger.

- [ ] **Step 1: Write failing tests for PLAY_STATE dedup**

Edit `libs/cmcd/test/CmcdReporter.test.ts`. Add this `describe` block at the bottom of the outer `describe('CmcdReporter', …)` block (before its closing brace, currently around line 861):

```ts
describe('state-change dedup', () => {
    describe('PLAY_STATE', () => {
        it('first PLAY_STATE event passes through', async () => {
            const { requester, requests } = createMockRequester()
            const reporter = new CmcdReporter(createConfig(), requester)

            reporter.update({ sta: 'p' })
            reporter.recordEvent(CmcdEventType.PLAY_STATE)

            await new Promise(resolve => setTimeout(resolve, 10))

            equal(requests.length, 1)
            ok((requests[0].body as string)?.includes('e=ps'))
            ok((requests[0].body as string)?.includes('sta=p'))
        })

        it('drops consecutive PLAY_STATE events with the same sta', async () => {
            const { requester, requests } = createMockRequester()
            const reporter = new CmcdReporter(createConfig(), requester)

            reporter.update({ sta: 'p' })
            reporter.recordEvent(CmcdEventType.PLAY_STATE)
            reporter.recordEvent(CmcdEventType.PLAY_STATE)

            await new Promise(resolve => setTimeout(resolve, 10))

            equal(requests.length, 1)
        })

        it('emits when sta transitions', async () => {
            const { requester, requests } = createMockRequester()
            const reporter = new CmcdReporter(createConfig(), requester)

            reporter.update({ sta: 'p' })
            reporter.recordEvent(CmcdEventType.PLAY_STATE)
            reporter.update({ sta: 'a' })
            reporter.recordEvent(CmcdEventType.PLAY_STATE)

            await new Promise(resolve => setTimeout(resolve, 10))

            equal(requests.length, 2)
            ok((requests[0].body as string)?.includes('sta=p'))
            ok((requests[1].body as string)?.includes('sta=a'))
        })

        it('recordEvent with sta in data writes through to persistent data', async () => {
            const { requester } = createMockRequester()
            const reporter = new CmcdReporter({
                sid: 'test-session',
                enabledKeys: ['sta'],
                eventTargets: [{
                    url: 'https://example.com/cmcd',
                    events: [CmcdEventType.PLAY_STATE],
                    enabledKeys: ['sta', 'e', 'sid'],
                    batchSize: 1,
                }],
            }, requester)

            reporter.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

            await new Promise(resolve => setTimeout(resolve, 10))

            // Verify the write-through: subsequent request reports include sta=p
            const req = reporter.createRequestReport({ url: 'https://cdn.example.com/seg.mp4' })
            ok(req.url.includes('sta=p'))
        })

        it('deduplicates across mixed entry points', async () => {
            const { requester, requests } = createMockRequester()
            const reporter = new CmcdReporter(createConfig(), requester)

            reporter.update({ sta: 'p' })
            reporter.recordEvent(CmcdEventType.PLAY_STATE)
            reporter.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

            await new Promise(resolve => setTimeout(resolve, 10))

            equal(requests.length, 1)
        })
    })
})
```

- [ ] **Step 2: Build and run tests to confirm failures**

```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Expected: the five new `state-change dedup > PLAY_STATE` tests fail (existing tests still pass). The "drops consecutive" and "deduplicates across mixed entry points" tests fail because dedup isn't implemented yet. The "write-through" test fails because `recordEvent` doesn't persist `sta`. The "first emit" and "emits when sta transitions" tests may already pass under existing behavior — that's expected; they lock in correct behavior so future changes don't regress.

- [ ] **Step 3: Add the `StateField` type, `STATE_FIELDS` table, and `lastEmitted` field**

Edit `libs/cmcd/src/CmcdReporter.ts`. Add new module-level declarations after the imports and existing types, just before the `function defaultRequester` declaration (around line 50):

```ts
/**
 * Tracked state field for dedup + auto-trigger.
 */
type StateField = 'sta' | 'pr' | 'cid' | 'bg' | 'br'

type StateFieldEntry = {
    field: StateField
    event: CmcdEventType
    equal: (a: unknown, b: unknown) => boolean
}

/**
 * Maps each tracked state field to its event type and equality function.
 * Order matters: `update()` fires events in this order for multi-field updates.
 */
const STATE_FIELDS: ReadonlyArray<StateFieldEntry> = [
    { field: 'sta', event: CmcdEventType.PLAY_STATE, equal: (a, b) => a === b },
]
```

Then add the `lastEmitted` private instance field. Find the `private requestTarget` declaration (around line 110) and insert above it:

```ts
private lastEmitted: Partial<Pick<Cmcd, StateField>> = {}
```

- [ ] **Step 4: Modify `recordEvent` to perform write-through + dedup**

Edit `libs/cmcd/src/CmcdReporter.ts`. Replace the existing `recordEvent` method body (currently around lines 222-228):

```ts
recordEvent(type: CmcdEventType, data: Partial<Cmcd> = {}): void {
    const entry = STATE_FIELDS.find(e => e.event === type)
    if (entry) {
        const field = entry.field
        const incoming = data[field]
        if (incoming !== undefined) {
            // Write-through: persist before deciding to emit.
            // Object.assign sidesteps TS heterogeneous-union narrowing on a string-union index.
            Object.assign(this.data, { [field]: incoming })
        }
        const current = this.data[field]
        if (entry.equal(current, this.lastEmitted[field])) {
            return
        }
        Object.assign(this.lastEmitted, { [field]: current })
    }

    this.eventTargets.forEach((target, config) => {
        this.recordTargetEvent(target, config, type, data)
    })

    this.processEventTargets()
}
```

- [ ] **Step 5: Modify `resetSession` to clear `lastEmitted`**

Edit `libs/cmcd/src/CmcdReporter.ts`. Replace the existing `resetSession` (currently around lines 480-483):

```ts
private resetSession(): void {
    this.eventTargets.forEach(target => target.sn = 0)
    this.requestTarget.sn = 0
    this.lastEmitted = {}
}
```

- [ ] **Step 6: Build and run tests to confirm they pass**

```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Expected: all `state-change dedup > PLAY_STATE` tests pass. All existing tests still pass.

- [ ] **Step 7: Typecheck**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 8: Commit**

```bash
git add libs/cmcd/src/CmcdReporter.ts libs/cmcd/test/CmcdReporter.test.ts
git commit -s -m "feat(cmcd): dedup consecutive PLAY_STATE events

Adds STATE_FIELDS dispatch table (sta only for now), lastEmitted
tracking, and write-through + dedup logic to recordEvent. resetSession
clears the dedup baseline on sid change.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Auto-trigger events from `update()`

**Files:**
- Modify: `libs/cmcd/src/CmcdReporter.ts`
- Modify: `libs/cmcd/test/CmcdReporter.test.ts`

`update()` now scans STATE_FIELDS and calls `recordEvent` for any tracked field whose value changed.

- [ ] **Step 1: Write failing tests for the auto-trigger**

Edit `libs/cmcd/test/CmcdReporter.test.ts`. Add inside the `describe('state-change dedup', …)` block, after the `PLAY_STATE` sub-describe:

```ts
describe('update() auto-trigger', () => {
    it('update({ sta }) auto-fires PLAY_STATE when sta changes', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createConfig(), requester)

        reporter.update({ sta: 'p' })

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 1)
        ok((requests[0].body as string)?.includes('e=ps'))
        ok((requests[0].body as string)?.includes('sta=p'))
    })

    it('update({ sta }) with unchanged value does not fire', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createConfig(), requester)

        reporter.update({ sta: 'p' })
        reporter.update({ sta: 'p' })

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 1)
    })

    it('subsequent manual recordEvent after update is deduped', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createConfig(), requester)

        reporter.update({ sta: 'p' })
        reporter.recordEvent(CmcdEventType.PLAY_STATE)

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 1)
    })

    it('update with non-tracked-only fields fires no event', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createConfig(), requester)

        reporter.update({ bl: [3000] })

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 0)
    })
})
```

- [ ] **Step 2: Build and run tests to confirm failures**

```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Expected: the four new `update() auto-trigger` tests fail (the first three expect 1 request, currently get 0; the fourth incidentally passes since `bl` is not tracked).

- [ ] **Step 3: Modify `update()` to auto-trigger events**

Edit `libs/cmcd/src/CmcdReporter.ts`. Replace the existing `update` method (currently around lines 200-212):

```ts
update(data: Partial<Cmcd>): void {
    if (data.sid && data.sid !== this.data.sid) {
        this.resetSession()
    }

    if (data.msd && !isNaN(data.msd)) {
        this.msd = data.msd
    }

    const prev = this.data
    // msd is tracked separately via this.msd and sent once per target,
    // so it is stripped from the persistent data store after each update.
    this.data = { ...prev, ...data, msd: undefined }

    // Auto-trigger state-change events for any tracked field whose value changed.
    for (const entry of STATE_FIELDS) {
        if (entry.field in data && !entry.equal(data[entry.field], prev[entry.field])) {
            this.recordEvent(entry.event)
        }
    }
}
```

- [ ] **Step 4: Build and run tests to confirm they pass**

```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Expected: all `state-change dedup` tests pass, including auto-trigger. All existing tests still pass.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add libs/cmcd/src/CmcdReporter.ts libs/cmcd/test/CmcdReporter.test.ts
git commit -s -m "feat(cmcd): auto-fire state-change events from update()

update() now iterates STATE_FIELDS and calls recordEvent for any
tracked field whose value differs from its pre-update value. The
manual recordEvent() pattern still works and is harmlessly deduped.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Extend dispatch to `pr`, `cid`, `bg`

**Files:**
- Modify: `libs/cmcd/src/CmcdReporter.ts`
- Modify: `libs/cmcd/test/CmcdReporter.test.ts`

Three more scalar entries use the same `=== `equality. No machinery changes.

- [ ] **Step 1: Write failing tests for the three new events**

Edit `libs/cmcd/test/CmcdReporter.test.ts`. Add inside the `describe('state-change dedup', …)` block, after the `update() auto-trigger` sub-describe:

```ts
describe('PLAYBACK_RATE', () => {
    function createPrConfig(): Partial<CmcdReporterConfig> {
        return {
            sid: 'test-session',
            cid: 'test-content',
            enabledKeys: ['pr', 'sid', 'cid', 'v', 'e', 'ts', 'sn'],
            eventTargets: [{
                url: 'https://example.com/cmcd',
                events: [CmcdEventType.PLAYBACK_RATE],
                enabledKeys: ['pr', 'sid', 'cid', 'v', 'e', 'ts', 'sn'],
                batchSize: 1,
            }],
        }
    }

    it('update({ pr }) auto-fires PLAYBACK_RATE on change', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createPrConfig(), requester)

        reporter.update({ pr: 1.5 })

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 1)
        ok((requests[0].body as string)?.includes('e=pr'))
        ok((requests[0].body as string)?.includes('pr=1.5'))
    })

    it('deduplicates consecutive same pr', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createPrConfig(), requester)

        reporter.update({ pr: 1.5 })
        reporter.update({ pr: 1.5 })

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 1)
    })
})

describe('CONTENT_ID', () => {
    function createCidConfig(): Partial<CmcdReporterConfig> {
        return {
            sid: 'test-session',
            enabledKeys: ['cid', 'sid', 'v', 'e', 'ts', 'sn'],
            eventTargets: [{
                url: 'https://example.com/cmcd',
                events: [CmcdEventType.CONTENT_ID],
                enabledKeys: ['cid', 'sid', 'v', 'e', 'ts', 'sn'],
                batchSize: 1,
            }],
        }
    }

    it('update({ cid }) auto-fires CONTENT_ID on change', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createCidConfig(), requester)

        reporter.update({ cid: 'content-1' })
        reporter.update({ cid: 'content-2' })

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 2)
        ok((requests[0].body as string)?.includes('cid="content-1"'))
        ok((requests[1].body as string)?.includes('cid="content-2"'))
    })

    it('deduplicates consecutive same cid', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createCidConfig(), requester)

        reporter.update({ cid: 'content-1' })
        reporter.update({ cid: 'content-1' })

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 1)
    })
})

describe('BACKGROUNDED_MODE', () => {
    function createBgConfig(): Partial<CmcdReporterConfig> {
        return {
            sid: 'test-session',
            enabledKeys: ['bg', 'sid', 'v', 'e', 'ts', 'sn'],
            eventTargets: [{
                url: 'https://example.com/cmcd',
                events: [CmcdEventType.BACKGROUNDED_MODE],
                enabledKeys: ['bg', 'sid', 'v', 'e', 'ts', 'sn'],
                batchSize: 1,
            }],
        }
    }

    it('update({ bg }) auto-fires BACKGROUNDED_MODE on change', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createBgConfig(), requester)

        reporter.update({ bg: true })

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 1)
        ok((requests[0].body as string)?.includes('e=b'))
        ok((requests[0].body as string)?.includes('bg'))
    })

    it('deduplicates consecutive same bg', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createBgConfig(), requester)

        reporter.update({ bg: true })
        reporter.update({ bg: true })

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 1)
    })
})
```

- [ ] **Step 2: Build and run tests to confirm failures**

```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Expected: the six new tests fail because PLAYBACK_RATE, CONTENT_ID, and BACKGROUNDED_MODE are not in `STATE_FIELDS` yet, so `update()` doesn't auto-trigger them.

- [ ] **Step 3: Add the three new entries to `STATE_FIELDS`**

Edit `libs/cmcd/src/CmcdReporter.ts`. Replace the `STATE_FIELDS` declaration:

```ts
const STATE_FIELDS: ReadonlyArray<StateFieldEntry> = [
    { field: 'sta', event: CmcdEventType.PLAY_STATE,        equal: (a, b) => a === b },
    { field: 'pr',  event: CmcdEventType.PLAYBACK_RATE,     equal: (a, b) => a === b },
    { field: 'cid', event: CmcdEventType.CONTENT_ID,        equal: (a, b) => a === b },
    { field: 'bg',  event: CmcdEventType.BACKGROUNDED_MODE, equal: (a, b) => a === b },
]
```

- [ ] **Step 4: Build and run tests to confirm they pass**

```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Expected: all `state-change dedup` tests pass.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add libs/cmcd/src/CmcdReporter.ts libs/cmcd/test/CmcdReporter.test.ts
git commit -s -m "feat(cmcd): dedup PLAYBACK_RATE, CONTENT_ID, BACKGROUNDED_MODE events

Extends the STATE_FIELDS dispatch table with three more scalar entries.
All four scalar state-change events now dedup and auto-trigger from
update().

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Add `cmcdObjectTypeListEqual` helper and `br` dispatch entry

**Files:**
- Modify: `libs/cmcd/src/CmcdReporter.ts`
- Modify: `libs/cmcd/test/CmcdReporter.test.ts`

`br` is `CmcdObjectTypeList`, a heterogeneous list. Needs a deep-equality helper. The helper goes in `CmcdReporter.ts` as a module-level non-exported function per the spec.

- [ ] **Step 1: Write failing tests for `br` dedup**

Edit `libs/cmcd/test/CmcdReporter.test.ts`. First, add the `SfItem` import near the top of the file (with the other imports, currently around line 1-5):

```ts
import { SfItem } from '@svta/cml-structured-field-values'
```

Then add inside the `describe('state-change dedup', …)` block, after the `BACKGROUNDED_MODE` sub-describe:

```ts
describe('BITRATE_CHANGE', () => {
    function createBrConfig(): Partial<CmcdReporterConfig> {
        return {
            sid: 'test-session',
            enabledKeys: ['br', 'sid', 'v', 'e', 'ts', 'sn'],
            eventTargets: [{
                url: 'https://example.com/cmcd',
                events: [CmcdEventType.BITRATE_CHANGE],
                enabledKeys: ['br', 'sid', 'v', 'e', 'ts', 'sn'],
                batchSize: 1,
            }],
        }
    }

    it('update({ br }) auto-fires BITRATE_CHANGE on change', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createBrConfig(), requester)

        reporter.update({ br: [5000] })

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 1)
        ok((requests[0].body as string)?.includes('e=bc'))
    })

    it('deduplicates same content, different array reference', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createBrConfig(), requester)

        reporter.update({ br: [5000] })
        reporter.update({ br: [5000] })

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 1)
    })

    it('deduplicates SfItems with same value and params', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createBrConfig(), requester)

        reporter.update({ br: [new SfItem(5000, { v: true })] })
        reporter.update({ br: [new SfItem(5000, { v: true })] })

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 1)
    })

    it('emits when SfItem params differ', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createBrConfig(), requester)

        reporter.update({ br: [new SfItem(5000, { v: true })] })
        reporter.update({ br: [new SfItem(5000, { a: true })] })

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 2)
    })

    it('emits when order changes', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createBrConfig(), requester)

        reporter.update({ br: [1000, 5000] })
        reporter.update({ br: [5000, 1000] })

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 2)
    })

    it('emits when length changes', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createBrConfig(), requester)

        reporter.update({ br: [5000] })
        reporter.update({ br: [5000, 1000] })

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 2)
    })
})
```

- [ ] **Step 2: Build and run tests to confirm failures**

```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Expected: the six `BITRATE_CHANGE` tests fail (no BITRATE_CHANGE entry in STATE_FIELDS yet).

- [ ] **Step 3: Add the `cmcdObjectTypeListEqual` helper**

Edit `libs/cmcd/src/CmcdReporter.ts`. First, add `CmcdObjectTypeList` to the imports near the top:

```ts
import type { CmcdObjectTypeList } from './CmcdObjectTypeList.ts'
```

Then insert this module-level helper function just before the `function defaultRequester` declaration (around line 50, after the type declarations from Task 2):

```ts
/**
 * Deep equality for CmcdObjectTypeList (used for `br` dedup).
 *
 * Order-sensitive: arrays with the same elements in different positions
 * are treated as different. Players that construct `br` consistently
 * get correct dedup; shuffling produces spurious emits, which is the
 * safer failure mode.
 */
function cmcdObjectTypeListEqual(a: CmcdObjectTypeList, b: CmcdObjectTypeList): boolean {
    if (a === b) return true
    if (a.length !== b.length) return false

    for (let i = 0; i < a.length; i++) {
        const ai = a[i]
        const bi = b[i]
        if (ai === bi) continue
        if (typeof ai === 'number' || typeof bi === 'number') return false

        // Both are SfItem<number, ExclusiveRecord<CmcdObjectType, boolean>>
        if (ai.value !== bi.value) return false

        // ExclusiveRecord: params (when defined) has exactly one key
        const ap = ai.params
        const bp = bi.params
        const ak = ap && Object.keys(ap)[0]
        if (ak !== (bp && Object.keys(bp)[0])) return false
        if (ak !== undefined && ap![ak as keyof typeof ap] !== bp![ak as keyof typeof bp]) return false
    }

    return true
}
```

- [ ] **Step 4: Add the `br` entry to `STATE_FIELDS`**

Edit `libs/cmcd/src/CmcdReporter.ts`. Replace the `STATE_FIELDS` declaration:

```ts
const STATE_FIELDS: ReadonlyArray<StateFieldEntry> = [
    { field: 'sta', event: CmcdEventType.PLAY_STATE,        equal: (a, b) => a === b },
    { field: 'pr',  event: CmcdEventType.PLAYBACK_RATE,     equal: (a, b) => a === b },
    { field: 'cid', event: CmcdEventType.CONTENT_ID,        equal: (a, b) => a === b },
    { field: 'bg',  event: CmcdEventType.BACKGROUNDED_MODE, equal: (a, b) => a === b },
    {
        field: 'br',
        event: CmcdEventType.BITRATE_CHANGE,
        equal: (a, b) => (a === undefined || b === undefined)
            ? a === b
            : cmcdObjectTypeListEqual(a as CmcdObjectTypeList, b as CmcdObjectTypeList),
    },
]
```

- [ ] **Step 5: Build and run tests to confirm they pass**

```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Expected: all `state-change dedup` tests pass, including the six BITRATE_CHANGE cases.

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 7: Commit**

```bash
git add libs/cmcd/src/CmcdReporter.ts libs/cmcd/test/CmcdReporter.test.ts
git commit -s -m "feat(cmcd): dedup BITRATE_CHANGE events via deep-equal on br

Adds cmcdObjectTypeListEqual helper (module-private) and a br entry
in STATE_FIELDS using a dispatch-site wrapper that handles undefined.
Equality is order-sensitive; players constructing br consistently get
correct dedup.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Cross-cutting tests

**Files:**
- Modify: `libs/cmcd/test/CmcdReporter.test.ts`

Verify the cross-cutting invariants from the spec. Implementation should already satisfy them — these tests lock in the behavior.

- [ ] **Step 1: Write the cross-cutting tests**

Edit `libs/cmcd/test/CmcdReporter.test.ts`. Add inside the `describe('state-change dedup', …)` block, after the `BITRATE_CHANGE` sub-describe:

```ts
describe('cross-cutting', () => {
    it('fires multi-field updates in dispatch order (sta then pr)', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter({
            sid: 'test-session',
            enabledKeys: ['sta', 'pr', 'sid', 'v', 'e', 'ts', 'sn'],
            eventTargets: [{
                url: 'https://example.com/cmcd',
                events: [CmcdEventType.PLAY_STATE, CmcdEventType.PLAYBACK_RATE],
                enabledKeys: ['sta', 'pr', 'sid', 'v', 'e', 'ts', 'sn'],
                batchSize: 1,
            }],
        }, requester)

        // Order in input differs from dispatch table; output must follow dispatch order.
        reporter.update({ pr: 1.5, sta: 'a' })

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 2)
        ok((requests[0].body as string)?.includes('e=ps'))
        ok((requests[1].body as string)?.includes('e=pr'))
    })

    it('dropped event does not consume sn', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createConfig(), requester)

        reporter.update({ sta: 'p' })
        reporter.recordEvent(CmcdEventType.PLAY_STATE)  // dropped (dedup)
        reporter.recordEvent(CmcdEventType.ERROR)

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 2)
        ok((requests[0].body as string)?.includes('sn=0'))  // PLAY_STATE (from update auto-trigger)
        ok((requests[1].body as string)?.includes('sn=1'))  // ERROR (next sn, not 2)
    })

    it('sid change resets dedup baseline', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createConfig(), requester)

        reporter.update({ sta: 'p' })
        reporter.update({ sid: 'new-session' })
        reporter.update({ sta: 'p' })

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 2)
    })

    it('non-tracked events are unaffected by dedup', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createConfig(), requester)

        reporter.recordEvent(CmcdEventType.ERROR)
        reporter.recordEvent(CmcdEventType.ERROR)

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 2)
    })

    it('drops PLAY_STATE with no sta defined anywhere', async () => {
        const { requester, requests } = createMockRequester()
        const reporter = new CmcdReporter(createConfig(), requester)

        reporter.recordEvent(CmcdEventType.PLAY_STATE)

        await new Promise(resolve => setTimeout(resolve, 10))

        equal(requests.length, 0)
    })
})
```

- [ ] **Step 2: Build and run tests**

```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Expected: all five new tests pass (no implementation changes needed). All existing tests still pass.

- [ ] **Step 3: Commit**

```bash
git add libs/cmcd/test/CmcdReporter.test.ts
git commit -s -m "test(cmcd): cross-cutting invariants for state-change dedup

Adds tests covering dispatch order, sn preservation across dropped
events, sid-reset of dedup baseline, non-tracked event passthrough,
and missing-field drop behavior.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Update documentation, CHANGELOG, and version

**Files:**
- Modify: `libs/cmcd/docs/user-guide.md`
- Modify: `libs/cmcd/src/CmcdReporter.ts` (TSDoc on `update` and `recordEvent`)
- Modify: `libs/cmcd/CHANGELOG.md`
- Modify: `libs/cmcd/package.json`

- [ ] **Step 1: Update `user-guide.md` — replace the two-step PLAY_STATE example**

Edit `libs/cmcd/docs/user-guide.md`. Find the section around line 186-199 that currently shows:

```typescript
import { CmcdEventType } from "@svta/cml-cmcd";

// Persistent data should be updated using `update()` before recording events
reporter.update({ sta: "p" });
reporter.recordEvent(CmcdEventType.PLAY_STATE);

// Event specific data should be passed as the second argument to `recordEvent()`
reporter.recordEvent(CmcdEventType.CUSTOM_EVENT, { cen: "custom-event-name" });
```

Replace with:

```typescript
import { CmcdEventType } from "@svta/cml-cmcd";

// State-change events fire automatically from update() when the value differs
// from the previously reported value. The reporter emits the corresponding
// event without an explicit recordEvent() call.
reporter.update({ sta: "p" });
// → fires CmcdEventType.PLAY_STATE
reporter.update({ pr: 1.5 });
// → fires CmcdEventType.PLAYBACK_RATE
reporter.update({ cid: "movie-42" });
// → fires CmcdEventType.CONTENT_ID
reporter.update({ bg: true });
// → fires CmcdEventType.BACKGROUNDED_MODE
reporter.update({ br: [5000] });
// → fires CmcdEventType.BITRATE_CHANGE

// Consecutive same-value updates are deduplicated.
reporter.update({ sta: "p" }); // emits
reporter.update({ sta: "p" }); // dropped

// recordEvent() still works for attaching extra context at a transition,
// and for non-state events like CUSTOM_EVENT and ERROR.
reporter.recordEvent(CmcdEventType.PLAY_STATE, { sta: "a", bl: [3000] });
reporter.recordEvent(CmcdEventType.CUSTOM_EVENT, { cen: "custom-event-name" });
```

- [ ] **Step 2: Update TSDoc on `recordEvent`**

Edit `libs/cmcd/src/CmcdReporter.ts`. Replace the TSDoc above the `recordEvent` method (currently around lines 214-221):

```ts
/**
 * Records an event. Called by the player when an event occurs.
 *
 * For state-change events (`PLAY_STATE`, `PLAYBACK_RATE`, `CONTENT_ID`,
 * `BACKGROUNDED_MODE`, `BITRATE_CHANGE`), this method:
 * 1. Persists the dedup field from `data` (if present) into the reporter's
 *    persistent data store — equivalent to a write-through `update()`.
 * 2. Suppresses the event if the field's current value matches the
 *    last-emitted value (no state transition).
 *
 * For all other event types, the event is always emitted.
 *
 * Most callers can rely on {@link update} to auto-fire state-change events.
 * Use `recordEvent` directly when you need to attach extra context to the
 * event report (e.g., `bl`, `pt` at the moment of a play-state transition).
 *
 * @param type - The type of event to record.
 * @param data - Additional data to record with the event. This data
 *               only applies to this event report, except for the dedup
 *               field of a state-change event, which is also persisted
 *               into the reporter's data store.
 */
```

- [ ] **Step 3: Update TSDoc on `update`**

Edit `libs/cmcd/src/CmcdReporter.ts`. Replace the TSDoc above the `update` method (currently around lines 196-199):

```ts
/**
 * Updates the CMCD data.
 *
 * Called by the player when data changes. For tracked state fields
 * (`sta`, `pr`, `cid`, `bg`, `br`), if the new value differs from the
 * current value, the corresponding state-change event is automatically
 * fired (subject to dedup against the last-emitted value).
 *
 * Multi-field updates fire multiple events in the order: `sta` → `pr` →
 * `cid` → `bg` → `br`. The order of keys in the input object does not
 * affect the firing order.
 *
 * A `sid` change resets the dedup baseline so the next state-change
 * event in the new session always emits.
 *
 * @param data - The data to update.
 */
```

- [ ] **Step 4: Update `CHANGELOG.md`**

Edit `libs/cmcd/CHANGELOG.md`. Under the `## [Unreleased]` heading (line 10), add:

```markdown
## [Unreleased]

### Added

- `CmcdEventType.PLAYBACK_RATE` (token `'pr'`) for playback-rate-change events, per CTA-5004-B.

### Changed

- `CmcdReporter.update()` now auto-fires the corresponding state-change event (`PLAY_STATE`, `PLAYBACK_RATE`, `CONTENT_ID`, `BACKGROUNDED_MODE`, `BITRATE_CHANGE`) when a tracked field's value changes. The two-step `update()` + `recordEvent()` pattern still works and is harmlessly deduplicated.
- `CmcdReporter.recordEvent()` with a state-change event now persists the dedup field from its `data` argument into the persistent data store (write-through), keeping `this.data` consistent with the most recently reported value.
- Consecutive state-change events with the same effective field value are now suppressed, matching CTA-5004-B's definition of these events as state transitions.
```

- [ ] **Step 5: Bump package version**

Edit `libs/cmcd/package.json`. Change the `version` field from `"2.3.2"` to `"2.4.0"` (minor bump for added behavior).

**Dependent package check:** `libs/request` depends on `@svta/cml-cmcd` via `"*"` (wildcard), so no explicit version bump is needed there. If a future dep moves to a pinned version, it would need a patch bump per AGENTS.md.

- [ ] **Step 6: Build, typecheck, lint, test**

```bash
npm run build -w libs/cmcd && npm run typecheck && npm run lint && npm test -w libs/cmcd
```

Expected: all pass.

- [ ] **Step 7: Final commit**

```bash
git add libs/cmcd/docs/user-guide.md libs/cmcd/src/CmcdReporter.ts libs/cmcd/CHANGELOG.md libs/cmcd/package.json
git commit -s -m "docs(cmcd): document state-change dedup and update() auto-trigger

Updates user-guide, TSDoc on update/recordEvent, CHANGELOG, and bumps
version to 2.4.0 (minor: additive behavior).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Spec coverage check

| Spec section | Task(s) |
|---|---|
| Prerequisite: add `CmcdEventType.PLAYBACK_RATE` | Task 1 |
| Dispatch table `STATE_FIELDS` | Task 2 (sta), Task 4 (pr/cid/bg), Task 5 (br) |
| `cmcdObjectTypeListEqual` helper | Task 5 |
| `lastEmitted` private field | Task 2 |
| `recordEvent` dedup + write-through | Task 2 |
| `update` auto-trigger | Task 3 |
| `resetSession` clears `lastEmitted` | Task 2 |
| Invariants: no `sn` consumption on drop, sid reset, etc. | Task 6 |
| Edge case: missing dedup field drops | Task 6 |
| Documentation: user-guide + TSDoc | Task 7 |
| CHANGELOG + version bump | Task 7 |
| Tests 1-5 (per-event dedup, parameterized) | Tasks 2 (PS), 4 (PR/CID/BG), 5 (BR) |
| Test 6 (multi-field dispatch order) | Task 6 |
| Test 7 (sn preservation) | Task 6 |
| Test 8 (sid resets dedup) | Task 6 |
| Test 9 (non-tracked unaffected) | Task 6 |
| Test 10 (missing field dropped) | Task 6 |
| Test 11 (update with non-tracked) | Task 3 |
| Tests 12-16 (br-specific) | Task 5 |
