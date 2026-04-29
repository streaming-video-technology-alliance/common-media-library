# CmcdReporter: orphaned setInterval after HTTP 410 (memory leak)

- **Issue:** [#360](https://github.com/streaming-video-technology-alliance/common-media-library/issues/360)
- **File:** `libs/cmcd/src/CmcdReporter.ts`
- **Date:** 2026-04-29

## Problem

`CmcdReporter.sendEventReport` deletes an event target from `this.eventTargets` when the collector responds with HTTP 410, but does not clear the `setInterval` that `start()` armed for that target. The interval callback closes over the target/state object, so the timer keeps firing after the map entry is gone.

```ts
// Current (buggy)
if (status === 410) {
  this.eventTargets.delete(target)
}
```

Effect: one orphaned timer per 410 response. Each fired callback pushes events into the now-orphaned `target.queue` (still reachable via the closure), and `processEventTargets` no longer iterates that target — so the queue grows without bound and the timer never stops. `stop()` cannot help because it iterates `this.eventTargets`, which the entry has already left.

## Audit findings

| # | Finding | Disposition |
|---|---|---|
| 1 | 410 path deletes the map entry without clearing the interval. | **In scope.** Fix below. |
| 2 | `start()` is not idempotent — a second call overwrites `target.intervalId` and leaks the previous timer. | **In scope.** Defensive fix below. |
| 3 | `stop()` clears intervals but leaves entries in the map so `start()` can re-arm them. | Not a bug. Confirmed intentional (state-preserving stop/start cycle). |
| 4 | `processEventTargets` re-queues events on 5xx/429 with no upper bound on `target.queue`. | Out of scope. Separate concern (rate-limiting / queue cap), not a timer leak. |

## Approach

Add two private methods on `CmcdReporter` to centralize timer/target lifecycle, then update the three existing methods that touch interval lifecycle (`start`, `stop`, `sendEventReport`).

### Helpers

```ts
private disarmInterval(target: CmcdEventTarget): void {
  clearInterval(target.intervalId)
  target.intervalId = undefined
}

private disposeEventTarget(config: CmcdEventReportConfigNormalized): void {
  const target = this.eventTargets.get(config)
  if (!target) return
  this.disarmInterval(target)
  this.eventTargets.delete(config)
}
```

`disarmInterval` is a reversible pause (timer cancelled, entry preserved). `disposeEventTarget` is permanent removal (timer cancelled, entry deleted). Naming separates the two concepts.

`clearInterval(undefined)` is a no-op, so `disarmInterval` is safe to call on a freshly-constructed target whose `intervalId` is still undefined.

### Call sites

| Method | Change |
|---|---|
| `start()` | Call `this.disarmInterval(target)` at the top of each `forEach` iteration, before the early-return. Closes audit finding #2. |
| `stop()` | Replace inline `clearInterval(target.intervalId)` with `this.disarmInterval(target)` for symmetry, so the field reflects truth after stop. |
| `sendEventReport()` | Replace `this.eventTargets.delete(target)` on 410 with `this.disposeEventTarget(target)`. Fixes #360. |

## Control flow

### Before (buggy) on a 410

```
target's setInterval fires
  → recordTargetEvent(target, ...) — pushes to target.queue (closure ref)
  → processEventTargets()
    → sendEventReport(...)
      → status === 410
        → eventTargets.delete(target)         [1] map entry gone
                                              [2] interval still scheduled
                                              [3] target.queue still referenced by closure
later: timer fires again
  → recordTargetEvent(target, ...) — pushes to orphaned target.queue
  → processEventTargets() — iterates eventTargets map → target not found → no send
  → queue grows forever; timer never stops
```

### After (fixed) on a 410

```
sendEventReport: status === 410
  → disposeEventTarget(config)
    → disarmInterval(target)
      → clearInterval(target.intervalId)      [1] timer cancelled
      → target.intervalId = undefined         [2] field reflects truth
    → eventTargets.delete(config)             [3] map entry gone
  → no further timer firings, no closure pump, target object becomes unreachable
```

### `start()` idempotency

```
each iteration:
  disarmInterval(target)        // no-op if intervalId is undefined
  if (interval === 0 || !TIME_INTERVAL): return
  target.intervalId = setInterval(...)
  fire initial event
```

A second `start()` call now disarms the previous timer before creating a new one.

## Error handling

Helpers do not throw. `clearInterval` accepts `undefined` and stale ids without error. The existing 5xx/429 throw in `sendEventReport` is unchanged — those paths re-queue events without removing the target, which is correct.

## Testing

Two new tests in `libs/cmcd/test/CmcdReporter.test.ts`. Both use `t.mock.method` (auto-restored at end of test) to spy on the global timer functions.

### Test 1 — Regression for #360

Asserts the exact timer id created by `start()` is passed to `clearInterval` after a 410:

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

### Test 2 — Regression for audit finding #2

Asserts a second `start()` clears the first interval id:

```ts
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
  const firstId = setIntervalSpy.mock.calls[0].result

  reporter.start()
  ok(clearIntervalSpy.mock.calls.some(c => c.arguments[0] === firstId))

  reporter.stop()
})
```

### Existing test

The existing test at `CmcdReporter.test.ts:730` (`'removes event target on 410 response'`) does not call `start()` and therefore never exercises the timer path — it only verifies that `recordEvent` no longer pushes to a deleted target. It stays as-is; Test 1 above covers the actual leak.

## Out of scope

- Unbounded growth of `target.queue` when the collector returns persistent 5xx/429 (audit finding #4). Worth filing as a separate issue if not already tracked.
- Any change to public API, config shape, or transmission behavior.

## Bundle / tree-shake impact

Nil. Both additions are private methods on an existing exported class. No new exports, no new imports.
