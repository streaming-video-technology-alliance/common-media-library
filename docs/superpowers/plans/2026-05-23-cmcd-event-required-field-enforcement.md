# CMCD Event Required Field Enforcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure CMCD state-change events always carry their required field on both the emit side (encoder) and detect side (validator) per CTA-5004-B, with one shared event-type → required-field map across encoder, reporter dedup, and validator.

**Architecture:** Extract the event-type → field mapping into a new module-scope `ReadonlyMap` (`CMCD_STATE_EVENT_FIELDS`). Wire it into `prepareCmcdData` (force-include post-filter), `validateCmcdStructure` (replace single hardcoded `e=ps`/`sta` check with a loop), and refactor `CmcdReporter.STATE_FIELDS` to derive from it. Fix a related encoder bug where `pr === 1` in an `e=pr` event was incorrectly stripped.

**Tech Stack:** TypeScript, node:test, npm workspaces. Tests live in `libs/cmcd/test/`, source in `libs/cmcd/src/`.

**Spec:** `docs/superpowers/specs/2026-05-23-cmcd-force-include-state-event-required-field-design.md`

---

## File Map

**Create:**
- `libs/cmcd/src/CMCD_STATE_EVENT_FIELDS.ts` — shared event-type → required-field mapping.

**Modify:**
- `libs/cmcd/src/prepareCmcdData.ts` — force-include required field; gate `pr === 1` skip on event type.
- `libs/cmcd/src/CmcdReporter.ts` — derive `STATE_FIELDS` from shared map; drop now-unused event-constant imports.
- `libs/cmcd/src/validateCmcdStructure.ts` — replace single `e=ps`/`sta` check with loop; drop now-unused `CMCD_EVENT_PLAY_STATE` import.

**Test (modify):**
- `libs/cmcd/test/encodeCmcd.test.ts` — encoder tests in existing `describe('filtering', ...)` block.
- `libs/cmcd/test/validateCmcdStructure.test.ts` — validator tests adjacent to existing `e=ps`/`sta` test.

---

## Note on existing test message

The existing validator test (line 59-63 of `validateCmcdStructure.test.ts`) checks only `i.key === 'sta'` and `i.severity === 'error'` — it does NOT assert on message text. The new loop emits a slightly different message wording (`State-change event (e="ps") requires...` instead of `Play state event (e="ps") requires...`). The existing test continues to pass because it doesn't check message text. No test changes required for the `e=ps` regression case.

---

### Task 1: Create the shared `CMCD_STATE_EVENT_FIELDS` constant

**Files:**
- Create: `libs/cmcd/src/CMCD_STATE_EVENT_FIELDS.ts`

- [ ] **Step 1: Create the shared constant file**

Create `libs/cmcd/src/CMCD_STATE_EVENT_FIELDS.ts` with:

```ts
import {
	CMCD_EVENT_BACKGROUNDED_MODE,
	CMCD_EVENT_BITRATE_CHANGE,
	CMCD_EVENT_CONTENT_ID,
	CMCD_EVENT_PLAY_STATE,
	CMCD_EVENT_PLAYBACK_RATE,
	type CmcdEventType,
} from './CmcdEventType.ts'
import type { CmcdKey } from './CmcdKey.ts'

/**
 * Maps each state-change event type to the persistent field whose value
 * the event signals.
 *
 * Per CTA-5004-B, the state-change events `ps`, `pr`, `c`, `b`, `bc` are
 * state-transition markers and must carry the field whose value they signal.
 * Consumers force-include the field post-filter (`prepareCmcdData`), dedup
 * against its value (`CmcdReporter`), and check its presence in payloads
 * (`validateCmcdStructure`).
 *
 * @internal
 */
export const CMCD_STATE_EVENT_FIELDS: ReadonlyMap<CmcdEventType, CmcdKey> = new Map([
	[CMCD_EVENT_PLAY_STATE, 'sta'],
	[CMCD_EVENT_PLAYBACK_RATE, 'pr'],
	[CMCD_EVENT_CONTENT_ID, 'cid'],
	[CMCD_EVENT_BACKGROUNDED_MODE, 'bg'],
	[CMCD_EVENT_BITRATE_CHANGE, 'br'],
])
```

- [ ] **Step 2: Verify the file compiles**

Run: `npm run typecheck`
Expected: PASS (no new errors). The new file is not yet imported, but it must compile cleanly.

- [ ] **Step 3: Commit**

```bash
git add libs/cmcd/src/CMCD_STATE_EVENT_FIELDS.ts
git commit -s -m "$(cat <<'EOF'
feat(cmcd): add CMCD_STATE_EVENT_FIELDS shared map

Internal mapping from state-change event type to the persistent field
whose value the event signals (sta, pr, cid, bg, br). To be consumed
by prepareCmcdData, CmcdReporter, and validateCmcdStructure.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Validator — extend required-field check to all 5 state events

**Files:**
- Modify: `libs/cmcd/src/validateCmcdStructure.ts` (lines 4, 113-120)
- Modify: `libs/cmcd/test/validateCmcdStructure.test.ts` (add tests after line 67)

- [ ] **Step 1: Write the four new failing tests**

Add these tests to `libs/cmcd/test/validateCmcdStructure.test.ts` immediately after the existing "accepts ps event with sta" test (currently line 65-68). The tests cover the four state-change events that the validator does not currently check.

```ts
it('reports error for pr event without pr', () => {
    const result = validateCmcdStructure({ e: 'pr', ts: 123 }, { reportingMode: 'event' })
    equal(result.valid, false)
    equal(result.issues.some(i => i.key === 'pr' && i.severity === 'error'), true)
})

it('accepts pr event with pr', () => {
    const result = validateCmcdStructure({ e: 'pr', pr: 1.5, ts: 123 }, { reportingMode: 'event' })
    equal(result.valid, true)
})

it('reports error for c event without cid', () => {
    const result = validateCmcdStructure({ e: 'c', ts: 123 }, { reportingMode: 'event' })
    equal(result.valid, false)
    equal(result.issues.some(i => i.key === 'cid' && i.severity === 'error'), true)
})

it('accepts c event with cid', () => {
    const result = validateCmcdStructure({ e: 'c', cid: 'content-123', ts: 123 }, { reportingMode: 'event' })
    equal(result.valid, true)
})

it('reports error for b event without bg', () => {
    const result = validateCmcdStructure({ e: 'b', ts: 123 }, { reportingMode: 'event' })
    equal(result.valid, false)
    equal(result.issues.some(i => i.key === 'bg' && i.severity === 'error'), true)
})

it('accepts b event with bg', () => {
    const result = validateCmcdStructure({ e: 'b', bg: true, ts: 123 }, { reportingMode: 'event' })
    equal(result.valid, true)
})

it('reports error for bc event without br', () => {
    const result = validateCmcdStructure({ e: 'bc', ts: 123 }, { reportingMode: 'event' })
    equal(result.valid, false)
    equal(result.issues.some(i => i.key === 'br' && i.severity === 'error'), true)
})

it('accepts bc event with br', () => {
    const result = validateCmcdStructure({ e: 'bc', br: [3000], ts: 123 }, { reportingMode: 'event' })
    equal(result.valid, true)
})
```

- [ ] **Step 2: Run tests to verify the four "reports error" tests fail**

Run: `npm test -w libs/cmcd 2>&1 | grep -E "reports error for (pr|c|b|bc) event"`
Expected: All four "reports error for ..." tests FAIL. The four "accepts ... event with ..." tests should already PASS (validator doesn't reject valid payloads).

- [ ] **Step 3: Modify the validator to loop over `CMCD_STATE_EVENT_FIELDS`**

In `libs/cmcd/src/validateCmcdStructure.ts`:

**Replace the import on line 4:**
```ts
import { CMCD_EVENT_CUSTOM_EVENT, CMCD_EVENT_ERROR, CMCD_EVENT_PLAY_STATE, CMCD_EVENT_RESPONSE_RECEIVED } from './CmcdEventType.ts'
```
with:
```ts
import { CMCD_EVENT_CUSTOM_EVENT, CMCD_EVENT_ERROR, CMCD_EVENT_RESPONSE_RECEIVED } from './CmcdEventType.ts'
import { CMCD_STATE_EVENT_FIELDS } from './CMCD_STATE_EVENT_FIELDS.ts'
```

**Replace the block at lines 113-120** (`// Play state change requires sta` through closing `}`):

```ts
		// Play state change requires sta
		if (data['e'] === CMCD_EVENT_PLAY_STATE && !('sta' in data)) {
			issues.push({
				key: 'sta',
				message: 'Play state event (e="ps") requires the "sta" key to be present.',
				severity: CMCD_VALIDATION_SEVERITY_ERROR
			})
		}
```

with:

```ts
		// State-change events require their associated field
		for (const [eventType, requiredField] of CMCD_STATE_EVENT_FIELDS) {
			if (data['e'] === eventType && !(requiredField in data)) {
				issues.push({
					key: requiredField,
					message: `State-change event (e="${eventType}") requires the "${requiredField}" key to be present.`,
					severity: CMCD_VALIDATION_SEVERITY_ERROR
				})
			}
		}
```

- [ ] **Step 4: Run validator tests to verify all pass**

Run: `npm test -w libs/cmcd 2>&1 | grep -E "validateCmcdStructure|reports error for|accepts"`
Expected: All `validateCmcdStructure` tests PASS, including the existing `ps event without sta` test (which still works because it only checks `key === 'sta'` and severity, not message text).

- [ ] **Step 5: Run full cmcd test suite**

Run: `npm test -w libs/cmcd`
Expected: All tests PASS. No regressions.

- [ ] **Step 6: Commit**

```bash
git add libs/cmcd/src/validateCmcdStructure.ts libs/cmcd/test/validateCmcdStructure.test.ts
git commit -s -m "$(cat <<'EOF'
fix(cmcd): validate required field for all 5 state-change events

validateCmcdStructure previously only checked e=ps for sta. Loop over
CMCD_STATE_EVENT_FIELDS to also enforce pr->pr, c->cid, b->bg, bc->br
per CTA-5004-B.

Existing e=ps/sta check is replaced by the loop; message wording shifts
slightly ("State-change event" vs "Play state event") but issue shape
(key, severity) is unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Encoder — force-include required field for state-change events (Case 1)

**Files:**
- Modify: `libs/cmcd/src/prepareCmcdData.ts` (lines 6, 129-143)
- Modify: `libs/cmcd/test/encodeCmcd.test.ts` (add tests in the existing `describe('filtering', ...)` block)

- [ ] **Step 1: Write failing tests for required field force-include**

Add these tests to `libs/cmcd/test/encodeCmcd.test.ts` inside the existing `describe('filtering', () => {` block, immediately after the existing "doesn't filter cen key in event mode when event type is ce" test (currently ends around line 70):

```ts
it('doesn\'t filter sta key in event mode when event type is ps', (context) => {
    context.mock.timers.enable({ apis: ['Date'], now: 1234 })
    const input = { e: CmcdEventType.PLAY_STATE, sta: 'p', cid: 'content-id' }
    const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'cid' })
    ok(output.includes('sta='), 'sta key must not be filtered out in event mode when e=ps')
})

it('doesn\'t filter pr key in event mode when event type is pr', (context) => {
    context.mock.timers.enable({ apis: ['Date'], now: 1234 })
    const input = { e: CmcdEventType.PLAYBACK_RATE, pr: 1.5, cid: 'content-id' }
    const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'cid' })
    ok(output.includes('pr='), 'pr key must not be filtered out in event mode when e=pr')
})

it('doesn\'t filter cid key in event mode when event type is c', (context) => {
    context.mock.timers.enable({ apis: ['Date'], now: 1234 })
    const input = { e: CmcdEventType.CONTENT_ID, cid: 'content-id' }
    const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'sid' })
    ok(output.includes('cid='), 'cid key must not be filtered out in event mode when e=c')
})

it('doesn\'t filter bg key in event mode when event type is b', (context) => {
    context.mock.timers.enable({ apis: ['Date'], now: 1234 })
    const input = { e: CmcdEventType.BACKGROUNDED_MODE, bg: true, cid: 'content-id' }
    const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'cid' })
    ok(output.includes('bg'), 'bg key must not be filtered out in event mode when e=b')
})

it('doesn\'t filter br key in event mode when event type is bc', (context) => {
    context.mock.timers.enable({ apis: ['Date'], now: 1234 })
    const input = { e: CmcdEventType.BITRATE_CHANGE, br: [3000], cid: 'content-id' }
    const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'cid' })
    ok(output.includes('br='), 'br key must not be filtered out in event mode when e=bc')
})

it('doesn\'t force-include sta when value is undefined', (context) => {
    context.mock.timers.enable({ apis: ['Date'], now: 1234 })
    const input = { e: CmcdEventType.PLAY_STATE, cid: 'content-id' }
    const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'cid' })
    equal(output.includes('sta='), false)
})

it('doesn\'t force-include required field in request mode', () => {
    const input = { e: CmcdEventType.PLAY_STATE, sta: 'p', cid: 'content-id', br: 3000 }
    const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.REQUEST, filter: key => key === 'br' })
    equal(output.includes('sta='), false, 'sta should be filtered out in request mode')
})
```

- [ ] **Step 2: Run tests to verify the new positive tests fail**

Run: `npm test -w libs/cmcd 2>&1 | grep -E "doesn't filter (sta|pr|cid|bg|br) key in event mode"`
Expected: All five positive tests FAIL — the encoder strips the required field today. The two negative tests (`undefined` and request mode) should already PASS.

- [ ] **Step 3: Add the force-include block in `prepareCmcdData.ts`**

In `libs/cmcd/src/prepareCmcdData.ts`:

**Replace the import on line 6:**
```ts
import { CMCD_EVENT_CUSTOM_EVENT, CMCD_EVENT_RESPONSE_RECEIVED } from './CmcdEventType.ts'
```
with:
```ts
import { CMCD_EVENT_CUSTOM_EVENT, CMCD_EVENT_RESPONSE_RECEIVED } from './CmcdEventType.ts'
import { CMCD_STATE_EVENT_FIELDS } from './CMCD_STATE_EVENT_FIELDS.ts'
```

**Replace the `if (isEventMode)` block (lines 129-143):**

```ts
	if (isEventMode) {
		const eventType = data['e']

		if (!keys.includes('e') && eventType != null) {
			keys.push('e')
		}

		if (!keys.includes('ts')) {
			keys.push('ts')
		}

		if (!keys.includes('cen') && data['cen'] != null && eventType === CMCD_EVENT_CUSTOM_EVENT) {
			keys.push('cen')
		}
	}
```

with:

```ts
	if (isEventMode) {
		const eventType = data['e']

		if (!keys.includes('e') && eventType != null) {
			keys.push('e')
		}

		if (!keys.includes('ts')) {
			keys.push('ts')
		}

		if (!keys.includes('cen') && data['cen'] != null && eventType === CMCD_EVENT_CUSTOM_EVENT) {
			keys.push('cen')
		}

		const requiredField = eventType ? CMCD_STATE_EVENT_FIELDS.get(eventType) : undefined
		if (requiredField && data[requiredField] != null && !keys.includes(requiredField)) {
			keys.push(requiredField)
		}
	}
```

- [ ] **Step 4: Run the new tests to verify they pass**

Run: `npm test -w libs/cmcd 2>&1 | grep -E "doesn't filter (sta|pr|cid|bg|br) key in event mode|doesn't force-include"`
Expected: All seven new tests PASS.

- [ ] **Step 5: Run full cmcd test suite**

Run: `npm test -w libs/cmcd`
Expected: All tests PASS. No regressions.

- [ ] **Step 6: Commit**

```bash
git add libs/cmcd/src/prepareCmcdData.ts libs/cmcd/test/encodeCmcd.test.ts
git commit -s -m "$(cat <<'EOF'
fix(cmcd): force-include required field for state-change events

prepareCmcdData's enabledKeys filter stripped the state-change required
field (sta/pr/cid/bg/br) before encoding, producing CTA-5004-B-non-
compliant payloads like e=ps with no sta. Force-include the required
field post-filter, symmetric with the existing e/ts/cen enforcement.

The data[requiredField] != null guard preserves the reporter's existing
short-circuit (PR #367) and prevents direct callers from synthesizing
empty keys.

Closes #368

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Encoder — preserve `pr=1` in `e=pr` events (Case 2)

**Files:**
- Modify: `libs/cmcd/src/prepareCmcdData.ts` (line 6 import, line 180-182 skip)
- Modify: `libs/cmcd/test/encodeCmcd.test.ts` (add tests in the existing `describe('filtering', ...)` block)

- [ ] **Step 1: Write failing test for `pr=1` preservation in `e=pr` event**

Add these tests to `libs/cmcd/test/encodeCmcd.test.ts` inside the existing `describe('filtering', () => {` block, immediately after the tests added in Task 3:

```ts
it('preserves pr=1 in event mode when event type is pr', (context) => {
    context.mock.timers.enable({ apis: ['Date'], now: 1234 })
    const input = { e: CmcdEventType.PLAYBACK_RATE, pr: 1, cid: 'content-id' }
    const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT })
    ok(output.includes('pr=1'), 'pr=1 must be preserved when event type is pr')
})

it('still skips pr=1 in request mode', () => {
    const input = { pr: 1, cid: 'content-id' }
    const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.REQUEST })
    equal(output.includes('pr=1'), false, 'pr=1 should still be skipped in request mode')
})

it('still skips pr=1 in non-pr event mode', (context) => {
    context.mock.timers.enable({ apis: ['Date'], now: 1234 })
    const input = { e: CmcdEventType.RESPONSE_RECEIVED, pr: 1, url: 'https://example.com/v.mp4' }
    const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT })
    equal(output.includes('pr=1'), false, 'pr=1 should still be skipped when e is not pr')
})
```

- [ ] **Step 2: Run tests to verify the positive test fails**

Run: `npm test -w libs/cmcd 2>&1 | grep -E "preserves pr=1|still skips pr=1"`
Expected: "preserves pr=1 in event mode when event type is pr" FAILS. The two "still skips pr=1" tests should PASS already (existing behavior).

- [ ] **Step 3: Add `CMCD_EVENT_PLAYBACK_RATE` import and gate the skip on event type**

In `libs/cmcd/src/prepareCmcdData.ts`:

**Replace the import on line 6:**
```ts
import { CMCD_EVENT_CUSTOM_EVENT, CMCD_EVENT_RESPONSE_RECEIVED } from './CmcdEventType.ts'
```
with:
```ts
import { CMCD_EVENT_CUSTOM_EVENT, CMCD_EVENT_PLAYBACK_RATE, CMCD_EVENT_RESPONSE_RECEIVED } from './CmcdEventType.ts'
```

**Replace the `pr === 1` skip block (lines 180-182):**

```ts
		// Playback rate should only be sent if not equal to 1.
		if (key === 'pr' && value === 1) {
			continue
		}
```

with:

```ts
		// Playback rate should only be sent if not equal to 1, except as
		// the value of a PLAYBACK_RATE state-change event (where pr=1 is
		// the data being reported, not a default to skip).
		if (key === 'pr' && value === 1 && data['e'] !== CMCD_EVENT_PLAYBACK_RATE) {
			continue
		}
```

- [ ] **Step 4: Run the new tests to verify they pass**

Run: `npm test -w libs/cmcd 2>&1 | grep -E "preserves pr=1|still skips pr=1"`
Expected: All three tests PASS.

- [ ] **Step 5: Run full cmcd test suite**

Run: `npm test -w libs/cmcd`
Expected: All tests PASS. No regressions.

- [ ] **Step 6: Commit**

```bash
git add libs/cmcd/src/prepareCmcdData.ts libs/cmcd/test/encodeCmcd.test.ts
git commit -s -m "$(cat <<'EOF'
fix(cmcd): preserve pr=1 in e=pr state-change events

The pr=1 value-skip is correct for request-mode reports (v1 guidance:
omit default values) but wrong in event mode when e=pr: the value IS
the data being reported, even when it equals 1. Gate the skip on the
event type.

Walkthrough: player drops from 1.5x to 1x speed. The reporter's
auto-trigger fires e=pr with pr=1; without this fix the encoder strips
pr and emits a malformed e=pr with no value.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Refactor `CmcdReporter.STATE_FIELDS` to derive from shared map

**Files:**
- Modify: `libs/cmcd/src/CmcdReporter.ts` (line 10 import, lines 111-122 STATE_FIELDS definition)

This task is a behavior-preserving refactor. The existing `CmcdReporter.test.ts` exercises `STATE_FIELDS` through public APIs and must continue to pass without modification.

- [ ] **Step 1: Run the reporter test suite for a baseline**

Run: `npm test -w libs/cmcd 2>&1 | grep -E "CmcdReporter|✔|✖" | tail -30`
Expected: All CmcdReporter tests PASS. Note the pass count — it must match after the refactor.

- [ ] **Step 2: Update imports in `CmcdReporter.ts`**

In `libs/cmcd/src/CmcdReporter.ts`, **replace the import on line 10**:

```ts
import { CMCD_EVENT_BACKGROUNDED_MODE, CMCD_EVENT_BITRATE_CHANGE, CMCD_EVENT_CONTENT_ID, CMCD_EVENT_PLAY_STATE, CMCD_EVENT_PLAYBACK_RATE, CMCD_EVENT_RESPONSE_RECEIVED, CMCD_EVENT_TIME_INTERVAL, CmcdEventType } from './CmcdEventType.ts'
```

with:

```ts
import { CMCD_EVENT_RESPONSE_RECEIVED, CMCD_EVENT_TIME_INTERVAL, CmcdEventType } from './CmcdEventType.ts'
import { CMCD_STATE_EVENT_FIELDS } from './CMCD_STATE_EVENT_FIELDS.ts'
```

(The 5 state event constants now live only inside `CMCD_STATE_EVENT_FIELDS.ts`; `CMCD_EVENT_RESPONSE_RECEIVED` and `CMCD_EVENT_TIME_INTERVAL` remain used in this file at lines 236, 241, 461.)

- [ ] **Step 3: Refactor the `STATE_FIELDS` array to derive from the shared map**

**Replace lines 111-122** (the hardcoded array):

```ts
const STATE_FIELDS: readonly StateFieldEntry[] = [
	{ field: 'sta', event: CMCD_EVENT_PLAY_STATE, equal, snapshot: identity },
	{ field: 'pr', event: CMCD_EVENT_PLAYBACK_RATE, equal, snapshot: identity },
	{ field: 'cid', event: CMCD_EVENT_CONTENT_ID, equal, snapshot: identity },
	{ field: 'bg', event: CMCD_EVENT_BACKGROUNDED_MODE, equal, snapshot: identity },
	{
		field: 'br',
		event: CMCD_EVENT_BITRATE_CHANGE,
		equal: (a, b) => (a === undefined || b === undefined) ? a === b : cmcdObjectTypeListEqual(a as CmcdObjectTypeList, b as CmcdObjectTypeList),
		snapshot: (v) => (v as CmcdObjectTypeList).slice(),
	},
]
```

with:

```ts
const STATE_FIELDS: readonly StateFieldEntry[] = Array.from(
	CMCD_STATE_EVENT_FIELDS,
	([event, field]): StateFieldEntry => {
		if (field === 'br') {
			return {
				event,
				field,
				equal: (a, b) => (a === undefined || b === undefined) ? a === b : cmcdObjectTypeListEqual(a as CmcdObjectTypeList, b as CmcdObjectTypeList),
				snapshot: (v) => (v as CmcdObjectTypeList).slice(),
			}
		}
		return { event, field: field as StateField, equal, snapshot: identity }
	},
)
```

- [ ] **Step 4: Verify typecheck and tests pass**

Run: `npm run typecheck`
Expected: PASS (no type errors).

Run: `npm test -w libs/cmcd 2>&1 | grep -E "CmcdReporter|✔|✖" | tail -30`
Expected: All CmcdReporter tests PASS with the same pass count as baseline from Step 1.

- [ ] **Step 5: Run full cmcd test suite**

Run: `npm test -w libs/cmcd`
Expected: All tests PASS. No regressions.

- [ ] **Step 6: Commit**

```bash
git add libs/cmcd/src/CmcdReporter.ts
git commit -s -m "$(cat <<'EOF'
refactor(cmcd): derive CmcdReporter.STATE_FIELDS from shared map

STATE_FIELDS now iterates CMCD_STATE_EVENT_FIELDS, applying scalar
equality/identity for the four scalar fields and the existing custom
br comparator/snapshot for the list field. Behavior is unchanged; this
makes CMCD_STATE_EVENT_FIELDS the single source of truth for which
state-change events exist and which field they signal.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Full verification

This task runs the project-level checks to catch anything missed by per-task testing.

- [ ] **Step 1: Build the cmcd package**

Run: `npm run build -w libs/cmcd`
Expected: PASS.

- [ ] **Step 2: Typecheck the full project**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Lint the full project**

Run: `npm run lint`
Expected: PASS (no errors). Existing project may have warnings; only new errors are a regression.

- [ ] **Step 4: Run the full cmcd test suite**

Run: `npm test -w libs/cmcd`
Expected: All tests PASS. Verify the test count increased by ~18 (8 validator + 7 force-include + 3 pr=1).

- [ ] **Step 5: Confirm commit log**

Run: `git log --oneline -7`
Expected output (top-to-bottom):
```
<sha> refactor(cmcd): derive CmcdReporter.STATE_FIELDS from shared map
<sha> fix(cmcd): preserve pr=1 in e=pr state-change events
<sha> fix(cmcd): force-include required field for state-change events
<sha> fix(cmcd): validate required field for all 5 state-change events
<sha> feat(cmcd): add CMCD_STATE_EVENT_FIELDS shared map
<sha> docs(cmcd): extend #368 spec to cover validator gap
<sha> docs(cmcd): design for force-including state-change required field
```

If commits are out of order or any are missing, investigate before pushing.

---

## Coverage check

| Spec section | Implemented in |
|---|---|
| Encoder Case 1 (force-include) | Task 3 |
| Encoder Case 2 (pr=1 in e=pr) | Task 4 |
| Validator Case 3 (loop over 5 events) | Task 2 |
| Shared `CMCD_STATE_EVENT_FIELDS` map | Task 1 |
| `CmcdReporter` refactor | Task 5 |
| Encoder tests | Tasks 3, 4 |
| Validator tests | Task 2 |
| Reporter test preservation | Task 5 (baseline + verify) |
| Build/lint/typecheck | Task 6 |
