# CmcdReporter setInterval Leak Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the orphaned `setInterval` leak in `CmcdReporter` when an event target is dropped via HTTP 410, and make `start()` idempotent so repeated calls don't leak timers either.

**Architecture:** Add two private helpers on `CmcdReporter` that centralize timer / target lifecycle: `disarmInterval(target)` (cancel + null-out) and `disposeEventTarget(config)` (disarm + delete from map). Route the three existing methods that touch interval lifecycle (`start`, `stop`, `sendEventReport`) through the helpers. No public API or config changes.

**Tech Stack:** TypeScript, `node:test` + `node:assert`, Node 20+ (24+ in dev).

**Spec:** [`docs/superpowers/specs/2026-04-29-cmcd-reporter-410-interval-leak-design.md`](../specs/2026-04-29-cmcd-reporter-410-interval-leak-design.md)

**Branch:** `issue/360-cmcd-reporter-leak` (already created; spec doc already committed). Do NOT commit to `main`.

---

## Pre-Task Setup

Run once at the start of the session to ensure builds are warm. Tests resolve `@svta/cml-cmcd` to `dist/`, so a build is required before tests will run.

- [ ] **Step 1: Confirm branch**

```bash
git rev-parse --abbrev-ref HEAD
```

Expected output: `issue/360-cmcd-reporter-leak`

If output is `main` or anything else, switch first:

```bash
git checkout issue/360-cmcd-reporter-leak
```

- [ ] **Step 2: Build all packages**

```bash
npm run build
```

Expected: completes without errors. Subsequent iterations only need to rebuild `libs/cmcd`.

---

## Task 1: Fix the 410 timer leak (TDD)

**Files:**
- Modify: `libs/cmcd/test/CmcdReporter.test.ts` — add a test inside the existing `describe('event target response handling', ...)` block (currently around line 729). The block has one test today; add the new one as a sibling.
- Modify: `libs/cmcd/src/CmcdReporter.ts` — add two private helpers; update the 410 branch in `sendEventReport`.

- [ ] **Step 1: Write the failing test**

Open `libs/cmcd/test/CmcdReporter.test.ts`. Find the block:

```ts
describe('event target response handling', () => {
  it('removes event target on 410 response', async () => {
    // ... existing test ...
  })
})
```

Add this new `it` block immediately after the existing one, still inside the `describe`:

```ts
it('clears the interval when target is removed via 410', async (t) => {
  const setIntervalSpy = t.mock.method(globalThis, 'setInterval')
  const clearIntervalSpy = t.mock.method(globalThis, 'clearInterval')
  const { requester, requests } = createMockRequester(410)

  const reporter = new CmcdReporter(createConfig({
    eventTargets: [{
      url: 'https://example.com/cmcd',
      events: [CmcdEventType.TIME_INTERVAL],
      enabledKeys: [...EVENT_KEYS],
      interval: 60,
      batchSize: 1,
    }],
  }), requester)

  reporter.start()
  await new Promise(resolve => setTimeout(resolve, 10))

  equal(requests.length, 1)
  equal(setIntervalSpy.mock.calls.length, 1)
  const intervalId = setIntervalSpy.mock.calls[0].result
  ok(clearIntervalSpy.mock.calls.some(c => c.arguments[0] === intervalId))
})
```

Notes:
- `interval: 60` (seconds) keeps the timer from firing again during the 10ms wait — we only need the synchronous initial fire from `start()`.
- `t.mock.method` auto-restores the spy at the end of the test. The existing tests use the global `mock` import; this new test deliberately uses the test context `(t)` instead so we don't have to manage cleanup.
- `setIntervalSpy.mock.calls[0].result` is the value returned by the original `setInterval` (the timer id), since `t.mock.method` defaults to forwarding to the original implementation.

- [ ] **Step 2: Build the cmcd package and run tests; expect the new test to fail**

```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Expected: the new test `'clears the interval when target is removed via 410'` fails. The existing 410 test still passes. Reason for failure: current `sendEventReport` deletes the map entry without calling `clearInterval`, so the spy records zero matching calls.

If the test passes by accident, the test setup is wrong — verify `events: [CmcdEventType.TIME_INTERVAL]` and `interval: 60` are present (without these, `start()` never creates a timer).

- [ ] **Step 3: Add the two private helpers in `CmcdReporter`**

Open `libs/cmcd/src/CmcdReporter.ts`. Find the `resetSession` method near the bottom of the class (around line 455). Insert these two helpers immediately above `resetSession`, still inside the class:

```ts
/**
 * Cancels the time-interval timer for an event target and clears the stored id.
 * Safe to call when no timer is armed (clearInterval(undefined) is a no-op).
 */
private disarmInterval(target: CmcdEventTarget): void {
  clearInterval(target.intervalId)
  target.intervalId = undefined
}

/**
 * Permanently removes an event target: cancels its timer and removes it from the
 * eventTargets map. Used when the collector signals the target is gone (HTTP 410).
 */
private disposeEventTarget(config: CmcdEventReportConfigNormalized): void {
  const target = this.eventTargets.get(config)
  if (!target) {
    return
  }
  this.disarmInterval(target)
  this.eventTargets.delete(config)
}
```

- [ ] **Step 4: Update the 410 branch in `sendEventReport`**

In the same file, find `sendEventReport` (currently around line 432). Locate the 410 branch:

```ts
if (status === 410) {
  this.eventTargets.delete(target)
} else if (status === 429 || (status > 499 && status < 600)) {
  throw new Error(`Event report failed with status ${status}`)
}
```

Replace the 410 branch (only) so it reads:

```ts
if (status === 410) {
  this.disposeEventTarget(target)
} else if (status === 429 || (status > 499 && status < 600)) {
  throw new Error(`Event report failed with status ${status}`)
}
```

(The `else if` branch is unchanged — keep it as-is.)

- [ ] **Step 5: Build and run tests; expect all to pass**

```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Expected: all cmcd tests pass, including the new `'clears the interval when target is removed via 410'` and the pre-existing `'removes event target on 410 response'`.

- [ ] **Step 6: Commit**

```bash
git add libs/cmcd/src/CmcdReporter.ts libs/cmcd/test/CmcdReporter.test.ts
git commit -s -m "$(cat <<'EOF'
fix(cmcd): clear setInterval before deleting event target on HTTP 410 (#360)

When the collector responds with HTTP 410, sendEventReport now calls a
new disposeEventTarget helper that clears the time-interval timer before
removing the target from the eventTargets map. Previously the setInterval
kept firing after the entry was deleted, pumping events into a queue that
no one drained.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds with DCO sign-off line.

---

## Task 2: Make `start()` idempotent (TDD)

A second `start()` call currently overwrites `target.intervalId` with a new timer, leaking the previous one. Use the helper from Task 1 to disarm any existing timer at the top of each iteration.

**Files:**
- Modify: `libs/cmcd/test/CmcdReporter.test.ts` — add a new `describe('start lifecycle', ...)` block after the existing `describe('event target response handling', ...)` block.
- Modify: `libs/cmcd/src/CmcdReporter.ts` — adjust the body of `start()`.

- [ ] **Step 1: Write the failing test**

Open `libs/cmcd/test/CmcdReporter.test.ts`. After the closing `})` of the `describe('event target response handling', ...)` block, add a new sibling describe:

```ts
describe('start lifecycle', () => {
  it('disarms existing intervals when start() is called multiple times', (t) => {
    const setIntervalSpy = t.mock.method(globalThis, 'setInterval')
    const clearIntervalSpy = t.mock.method(globalThis, 'clearInterval')
    const { requester } = createMockRequester()

    const reporter = new CmcdReporter(createConfig({
      eventTargets: [{
        url: 'https://example.com/cmcd',
        events: [CmcdEventType.TIME_INTERVAL],
        enabledKeys: [...EVENT_KEYS],
        interval: 60,
        batchSize: 1,
      }],
    }), requester)

    reporter.start()
    equal(setIntervalSpy.mock.calls.length, 1)
    const firstId = setIntervalSpy.mock.calls[0].result

    reporter.start()
    ok(clearIntervalSpy.mock.calls.some(c => c.arguments[0] === firstId))

    reporter.stop()
  })
})
```

Notes:
- `interval: 60` again keeps the real timers from firing during the test.
- `reporter.stop()` at the end clears the second timer so the test doesn't leak a real interval into the runtime.

- [ ] **Step 2: Build and run tests; expect the new test to fail**

```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Expected: the new test `'disarms existing intervals when start() is called multiple times'` fails. The fix from Task 1 is unrelated to this code path, so this test fails on the un-modified `start()`.

- [ ] **Step 3: Update `start()` to disarm before re-arming**

Open `libs/cmcd/src/CmcdReporter.ts`. Find `start()` (currently around line 151). The current body:

```ts
start(): void {
  this.eventTargets.forEach((target, config) => {
    // If the interval is 0 or the TIME_INTERVAL event is not enabled, do not start the interval.
    if (config.interval === 0 || !config.events.includes(CmcdEventType.TIME_INTERVAL)) {
      return
    }

    const timeIntervalEvent = () => {
      this.recordTargetEvent(target, config, CMCD_EVENT_TIME_INTERVAL)
      this.processEventTargets()
    }

    target.intervalId = setInterval(timeIntervalEvent, config.interval * 1000)
    timeIntervalEvent()
  })
}
```

Replace the entire method body so it reads:

```ts
start(): void {
  this.eventTargets.forEach((target, config) => {
    // Disarm any existing timer so repeated start() calls do not leak intervals.
    this.disarmInterval(target)

    // If the interval is 0 or the TIME_INTERVAL event is not enabled, do not start the interval.
    if (config.interval === 0 || !config.events.includes(CmcdEventType.TIME_INTERVAL)) {
      return
    }

    const timeIntervalEvent = () => {
      this.recordTargetEvent(target, config, CMCD_EVENT_TIME_INTERVAL)
      this.processEventTargets()
    }

    target.intervalId = setInterval(timeIntervalEvent, config.interval * 1000)
    timeIntervalEvent()
  })
}
```

The only change is the new `this.disarmInterval(target)` line at the top of the `forEach` callback.

- [ ] **Step 4: Build and run tests; expect all to pass**

```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Expected: all cmcd tests pass, including both new tests.

- [ ] **Step 5: Commit**

```bash
git add libs/cmcd/src/CmcdReporter.ts libs/cmcd/test/CmcdReporter.test.ts
git commit -s -m "$(cat <<'EOF'
fix(cmcd): make CmcdReporter.start() idempotent

Repeated start() calls used to overwrite target.intervalId with a new
timer, leaking the previous one. start() now disarms any existing timer
before creating a new one, via the disarmInterval helper introduced in
the prior commit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 3: Refactor `stop()` for symmetry

`stop()` already does the right thing (clears intervals), but it inlines the `clearInterval` call and never resets `intervalId` to `undefined`. Routing it through `disarmInterval` makes the field reflect truth after stop and removes a small inconsistency. Pure refactor — no behavior change.

**Files:**
- Modify: `libs/cmcd/src/CmcdReporter.ts` — adjust the body of `stop()`.

- [ ] **Step 1: Update `stop()` to use the helper**

Open `libs/cmcd/src/CmcdReporter.ts`. Find `stop()` (currently around line 173). The current body:

```ts
stop(flush: boolean = false): void {
  if (flush) {
    this.flush()
  }

  this.eventTargets.forEach((target) => {
    clearInterval(target.intervalId)
  })
}
```

Replace the body so it reads:

```ts
stop(flush: boolean = false): void {
  if (flush) {
    this.flush()
  }

  this.eventTargets.forEach((target) => {
    this.disarmInterval(target)
  })
}
```

The only change is `clearInterval(target.intervalId)` → `this.disarmInterval(target)`.

- [ ] **Step 2: Build and run tests; expect all to pass**

```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Expected: all cmcd tests pass. No new test is needed — this is a pure refactor and existing tests cover stop/flush behavior.

- [ ] **Step 3: Commit**

```bash
git add libs/cmcd/src/CmcdReporter.ts
git commit -s -m "$(cat <<'EOF'
refactor(cmcd): use disarmInterval helper in CmcdReporter.stop()

Routes stop() through the same helper as start() and disposeEventTarget,
ensuring target.intervalId is cleared and reset to undefined symmetrically.
No behavior change.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 4: Final verification

No code changes; verify the full state before declaring done.

- [ ] **Step 1: Run the cmcd workspace test suite**

```bash
npm run build -w libs/cmcd && npm test -w libs/cmcd
```

Expected: all tests pass, including:
- `'clears the interval when target is removed via 410'`
- `'disarms existing intervals when start() is called multiple times'`
- All pre-existing tests, including `'removes event target on 410 response'` (which still tests the recordEvent-after-410 path).

- [ ] **Step 2: Run the project typecheck**

```bash
npm run typecheck
```

Expected: no new TypeScript errors. (Per project convention, pre-existing tsdown errors in `node_modules` are expected and unrelated.)

- [ ] **Step 3: Confirm branch state**

```bash
git log --oneline issue/360-cmcd-reporter-leak ^main
```

Expected: four commits (top-most first):

```
refactor(cmcd): use disarmInterval helper in CmcdReporter.stop()
fix(cmcd): make CmcdReporter.start() idempotent
fix(cmcd): clear setInterval before deleting event target on HTTP 410 (#360)
docs: add design spec for CmcdReporter 410 interval leak fix (#360)
```

`main` should be clean (no extra commits beyond `origin/main`).

- [ ] **Step 4: Done**

Implementation complete. Do NOT push or open a PR without user instruction. The user will review and decide whether to push, open a PR, or request changes.

---

## Notes on running a single test during TDD iteration

If you want to run only the new test instead of the full cmcd suite during the red phase, from the project root:

```bash
npm run build -w libs/cmcd && cd libs/cmcd && node --no-warnings --test --test-name-pattern="clears the interval when target is removed via 410" test/CmcdReporter.test.ts && cd -
```

The full-suite command above is the canonical one and what should run before each commit.
