# CMCD session API implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the CMCD session API of [`rfc/cmcd-session-api.md`](../../rfc/cmcd-session-api.md) in `@svta/cml-cmcd`, next to the existing `CmcdReporter`.

**Architecture:** One `CmcdSession` per playback owns the configuration, the current `sid` state, the timers, and `bg`. One `CmcdSessionReporter` per media player pushes state, records events, decorates requests, and records responses. Internal target states hold the per-destination counters, gates, buffers, and queues. A key table drives report preparation. [`architecture.md`](./architecture.md) is the design record: read its State and Algorithms sections before each task.

**Tech Stack:** TypeScript, Node 24 test runner (`node:test`, `node:assert`), `@svta/cml-structured-field-values` for the wire encoding, `@svta/cml-utils` for `uuid`, `HttpRequest`, and the URL helpers. Build with `npm run build -w libs/cmcd`. Tests run against the built `dist`.

## Global constraints

- Node 24 or later. `npm install` fails on older versions.
- Tests import from `@svta/cml-cmcd`, never from `../src`. Build before every test run: `npm run build -w libs/cmcd`.
- Run one test file with `node --no-warnings --test libs/cmcd/test/<file>.test.ts` from the repository root. Run `npm run typecheck` at the root after every task, because the tests typecheck against `dist/index.d.ts`.
- Code style: tabs, no semicolons, single quotes, `type` not `interface`, no `enum`, and named exports only.
- Relative imports carry the `.ts` extension. Use `readonly` where mutation is not intended, and bracket access for index signatures.
- One export per file. `index.ts` uses `export type *` for type-only files and `export *` for the rest.
- No code runs at module scope. Annotate a module-scope `new Map()`, `new Set()`, or `new WeakMap()` with `/* @__PURE__ */`.
- Every public export has TSDoc with `@public`. Public functions have `@example {@includeCode ../test/<file>.test.ts#example}` and the test file has a `// #region example` block.
- Every commit uses `git commit -s`, a Conventional Commits subject, and the trailer `Co-Authored-By: Claude claude-fable-5-1 <noreply@anthropic.com>`. Never commit to `main`. Work on branch `feat/cmcd-session-api`.
- Prose in TSDoc, the changelog, and the docs follows the writing rules of `AGENTS.md`. Sentences stay under 20 words, with no semicolons, no em dashes, no idioms, and one name per concept.
- Spec text: CTA-5004-B at <https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html>. The wire examples of its section 8 are the conformance fixtures.
- Two deliberate deviations from the design record are recorded in Task 14. The transform runs on the normalized report, so its `Cmcd` parameter type is exact. The `h` key is required on the `h` event.

## File structure

Public types, one per file in `libs/cmcd/src/`: `CmcdSession.ts`, `CmcdSessionConfig.ts`, `CmcdSessionReporter.ts`, `CmcdSessionReporterConfig.ts`, `CmcdPlaybackData.ts`, `CmcdMetric.ts`, `CmcdNextObject.ts`, `CmcdEventTargetConfig.ts`, `CmcdRequester.ts`, `CmcdRequestLike.ts`, `CmcdDecoratedRequest.ts`, `CmcdRequestRecord.ts`, `CmcdResponseInfo.ts`, `CmcdResourceTiming.ts`, `CmcdResponseData.ts`, `CmcdRequestTransform.ts`, `CmcdEventTransform.ts`, `CmcdDiscreteEventType.ts`.

Public function: `createCmcdSession.ts`.

Internal, in `libs/cmcd/src/`, not exported from `index.ts`:

| File | Responsibility |
|---|---|
| `CmcdKeySpec.ts`, `CMCD_KEY_SPECS.ts`, `getKeySpec.ts` | the key table and its lookup, including custom keys |
| `PrepareContext.ts`, `normalizeValue.ts`, `formatNor.ts`, `normalizeReport.ts`, `filterReport.ts` | preparation: plain values to structured-field values, then the spec rules and the key allowlist |
| `NormalizedSessionConfig.ts`, `NormalizedEventTarget.ts`, `normalizeSessionConfig.ts`, `checkRequestSettings.ts` | configuration defaults and checks |
| `SessionState.ts`, `SidState.ts`, `ReporterState.ts`, `TargetState.ts`, `TargetEntry.ts`, `RequestOrigin.ts`, `CMCD_REQUEST_ORIGINS.ts` | state types and the origin map |
| `createSidState.ts`, `createTargetState.ts`, `getTargetEntry.ts` | state factories |
| `assembleReport.ts`, `emitReport.ts`, `emitEvent.ts`, `pruneSpans.ts` | the report path for one target and the fan-out to event targets |
| `trackTransition.ts`, `deriveStateEvents.ts` | the `sta` transition effects and the state-change diff |
| `placeRequestReport.ts`, `copyPlaybackData.ts` | request decoration and the per-request data copy |
| `toResponseKeys.ts`, `readHeader.ts` | the `rr` derivations |
| `processQueue.ts`, `defaultRequester.ts`, `armTimers.ts`, `tickTarget.ts` | delivery and the interval timers |
| `observeVisibility.ts`, `emitBackgroundChange.ts` | `bg` from document visibility |
| `createSessionReporter.ts`, `rotateSession.ts`, `configureSession.ts`, `flushSession.ts`, `disposeSession.ts` | the reporter facade and the session operations |

Tests in `libs/cmcd/test/`: `CmcdSessionTypes.test.ts`, `createCmcdSession.test.ts`, `CmcdSessionReporter.request.test.ts`, `CmcdSessionReporter.events.test.ts`, `CmcdSessionReporter.derived.test.ts`, `CmcdSessionReporter.responses.test.ts`, `CmcdSession.rotation.test.ts`, `CmcdSession.transforms.test.ts`, `CmcdSession.delivery.test.ts`, `CmcdSession.errors.test.ts`, `CmcdSession.validation.test.ts`, the fixtures in `test/data/CTA_5004_B_EXAMPLES.ts`, and the helpers in `test/helpers/cmcdSessionHarness.ts`.

---

### Task 1: Public types and the `h` event token

**Files:**
- Modify: `libs/cmcd/src/CmcdEventType.ts` (add the `h` event)
- Modify: `libs/cmcd/src/CMCD_TOKEN_VALUES.ts` (add `h` to the `e` tokens)
- Create: the 18 public type files listed under File structure
- Modify: `libs/cmcd/src/index.ts`
- Test: `libs/cmcd/test/CmcdSessionTypes.test.ts`

**Interfaces:**
- Produces: every public type of the RFC's Reference section, with the exact member names below. Every later task imports them.

- [ ] **Step 1: Write the failing test**

```ts
// libs/cmcd/test/CmcdSessionTypes.test.ts
import type { CmcdDecoratedRequest, CmcdPlaybackData, CmcdResponseData, CmcdSessionConfig, CmcdSessionReporter } from '@svta/cml-cmcd'
import { CmcdEventType, validateCmcdEvents } from '@svta/cml-cmcd'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('CMCD session API types', () => {
	it('exposes the h event', () => {
		equal(CmcdEventType.HOSTNAME, 'h')
		equal(validateCmcdEvents('e=h,h="example.com",sid="s",ts=1,v=2').valid, true)
	})

	it('compiles the documented shapes', () => {
		const data: CmcdPlaybackData = { sta: 'p', bl: { v: 3200, a: 1800 }, br: 3000, nor: [{ url: 'seg.m4s', range: '0-99' }], 'com.example-key': 'x', ts: 1 }
		// @ts-expect-error ec is not a member, errors go through recordError()
		const bad: CmcdPlaybackData = { ec: ['x'] }
		const response: CmcdResponseData = { ...data, ttfbb: 12, smrt: 'abc' }
		// @ts-expect-error sn is reporter-owned
		const badResponse: CmcdResponseData = { sn: 1 }
		const config: CmcdSessionConfig = { derive: { bg: false }, eventTargets: [{ url: 'https://c.example/cmcd' }] }
		type Decorated = CmcdDecoratedRequest<{ url: string; retries: number }>
		const decorated = { url: 'u', retries: 1, cmcd: { sid: 's', data: {} } } as Decorated
		const headers: Readonly<Record<string, string>> | undefined = decorated.headers
		type Recorder = CmcdSessionReporter['recordEvent']
		const recordEvent: Recorder = () => {}
		// @ts-expect-error ps is derived from update(), not recordable
		recordEvent('ps')
		equal([data, bad, response, badResponse, config, headers].length, 6)
	})
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSessionTypes.test.ts`
Expected: FAIL, `CmcdEventType.HOSTNAME` is `undefined`. `npm run typecheck` also fails on the missing types.

- [ ] **Step 3: Add the `h` event**

In `libs/cmcd/src/CmcdEventType.ts`, after the `CMCD_EVENT_CUSTOM_EVENT` constant:

```ts
/**
 * CMCD event type for the 'h' key (hostname). The player reports the host of the request URL when it changes.
 *
 * @public
 */
export const CMCD_EVENT_HOSTNAME = 'h' as const
```

In the `CmcdEventType` collector object, after `CUSTOM_EVENT`:

```ts
	/**
	 * The host of the request URL changed.
	 */
	HOSTNAME: CMCD_EVENT_HOSTNAME as typeof CMCD_EVENT_HOSTNAME,
```

In `libs/cmcd/src/CMCD_TOKEN_VALUES.ts`, add `'h'` to the `e` list, after `'ce'`.

- [ ] **Step 4: Create the type files**

```ts
// libs/cmcd/src/CmcdMetric.ts
import type { CmcdObjectType } from './CmcdObjectType.ts'

/**
 * A value that the spec allows per object type. A number applies to the whole report.
 * A record gives one value per object type, for example `{ v: 3000, a: 128 }`.
 *
 * @public
 */
export type CmcdMetric = number | Readonly<Partial<Record<CmcdObjectType, number>>>
```

```ts
// libs/cmcd/src/CmcdNextObject.ts
/**
 * A next object request for the `nor` key: a URL, or a URL with a byte range.
 *
 * @public
 */
export type CmcdNextObject = string | { readonly url: string; readonly range?: string }
```

```ts
// libs/cmcd/src/CmcdPlaybackData.ts
import type { CmcdCustomValue } from './CmcdCustomValue.ts'
import type { CmcdMetric } from './CmcdMetric.ts'
import type { CmcdNextObject } from './CmcdNextObject.ts'
import type { CmcdObjectType } from './CmcdObjectType.ts'
import type { CmcdPlayerState } from './CmcdPlayerState.ts'
import type { CmcdStreamType } from './CmcdStreamType.ts'
import type { CmcdStreamingFormat } from './CmcdStreamingFormat.ts'

/**
 * The playback data a player gives to a `CmcdSessionReporter`. Every member is optional.
 * Values are plain: numbers in the spec's units, booleans, and tokens as strings.
 * The reporter rounds and encodes them. `ts` is the time of the transition and is not stored.
 * `ec` is not a member. Errors go through `recordError()`.
 *
 * @public
 */
export type CmcdPlaybackData = {
	readonly [key: `${string}-${string}`]: CmcdCustomValue | undefined
	readonly ab?: CmcdMetric
	readonly bg?: boolean
	readonly bl?: CmcdMetric
	readonly br?: CmcdMetric
	readonly bs?: boolean
	readonly bsa?: CmcdMetric
	readonly bsd?: CmcdMetric
	readonly bsda?: CmcdMetric
	readonly cid?: string
	readonly cs?: string
	readonly d?: number
	readonly dfa?: number
	readonly dl?: number
	readonly h?: string
	readonly lab?: CmcdMetric
	readonly lb?: CmcdMetric
	readonly ltc?: number
	readonly msd?: number
	readonly mtp?: CmcdMetric
	readonly nor?: CmcdNextObject | readonly CmcdNextObject[]
	readonly nr?: boolean
	readonly ot?: CmcdObjectType
	readonly pb?: CmcdMetric
	readonly pr?: number
	readonly pt?: number
	readonly rtp?: number
	readonly sf?: CmcdStreamingFormat
	readonly st?: CmcdStreamType
	readonly sta?: CmcdPlayerState
	readonly su?: boolean
	readonly tab?: CmcdMetric
	readonly tb?: CmcdMetric
	readonly tbl?: CmcdMetric
	readonly tpb?: CmcdMetric
	readonly ts?: number
}
```

```ts
// libs/cmcd/src/CmcdResponseData.ts
import type { CmcdPlaybackData } from './CmcdPlaybackData.ts'

/**
 * The data argument of `recordResponse()`: the playback data plus the response keys.
 * A supplied response key wins over the derived value for that report.
 *
 * @public
 */
export type CmcdResponseData = CmcdPlaybackData & {
	readonly ttfb?: number
	readonly ttlb?: number
	readonly ttfbb?: number
	readonly smrt?: string
	readonly cmsds?: string
	readonly cmsdd?: string
	readonly rc?: number
	readonly url?: string
}
```

```ts
// libs/cmcd/src/CmcdDiscreteEventType.ts
/**
 * The events a player records with `recordEvent()`. The other event types are derived by the reporter.
 *
 * @public
 */
export type CmcdDiscreteEventType = 'as' | 'ae' | 'abs' | 'abe' | 'sk' | 'm' | 'um' | 'pe' | 'pc' | 'ce'
```

```ts
// libs/cmcd/src/CmcdRequester.ts
import type { HttpRequest } from '@svta/cml-utils'

/**
 * Sends one event-mode POST and resolves with the response status. The default uses `fetch` with `keepalive`.
 *
 * @public
 */
export type CmcdRequester = (request: HttpRequest) => Promise<{ status: number }>
```

```ts
// libs/cmcd/src/CmcdEventTransform.ts
import type { Cmcd } from './Cmcd.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'

/**
 * Changes or cancels one event report before it is encoded. Return `null` to cancel.
 * `request` is the decorated request for an `rr` report, else `undefined`.
 *
 * @public
 */
export type CmcdEventTransform = (data: Cmcd, request: Readonly<CmcdRequestLike> | undefined) => Cmcd | null
```

```ts
// libs/cmcd/src/CmcdRequestTransform.ts
import type { Cmcd } from './Cmcd.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'

/**
 * Changes or cancels one request-mode report before it is placed on the request. Return `null` to cancel.
 *
 * @public
 */
export type CmcdRequestTransform = (data: Cmcd, request: Readonly<CmcdRequestLike>) => Cmcd | null
```

```ts
// libs/cmcd/src/CmcdEventTargetConfig.ts
import type { CmcdEventTransform } from './CmcdEventTransform.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import type { CmcdKey } from './CmcdKey.ts'

/**
 * One event-mode destination. `{ url }` is a complete configuration.
 *
 * @public
 */
export type CmcdEventTargetConfig = {
	readonly url: string
	/** Default `['ps', 'e', 't', 'rr']`. */
	readonly events?: readonly CmcdEventType[]
	/** Key allowlist. Default: every event key. */
	readonly keys?: readonly CmcdKey[]
	/** Seconds between `t` reports. Default 30. `0` disables them. */
	readonly interval?: number
	/** Lines per POST. Default 1. */
	readonly batchSize?: number
	/** Queued lines kept while the destination is unreachable. Default 500. */
	readonly maxQueueSize?: number
	/** Headers sent with every POST. */
	readonly headers?: Readonly<Record<string, string>>
	readonly transform?: CmcdEventTransform
}
```

```ts
// libs/cmcd/src/CmcdSessionConfig.ts
import type { CmcdEventTargetConfig } from './CmcdEventTargetConfig.ts'
import type { CmcdHeaderMap } from './CmcdHeaderMap.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdRequestTransform } from './CmcdRequestTransform.ts'
import type { CmcdRequester } from './CmcdRequester.ts'
import type { CmcdTransmissionMode } from './CmcdTransmissionMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'

/**
 * Configuration of `createCmcdSession()`. Every member is optional.
 * `version`, `transmissionMode`, `keys`, `headerMap`, and `transform` apply to request mode.
 *
 * @public
 */
export type CmcdSessionConfig = {
	/** Default: a new UUID. */
	readonly sid?: string
	/** Default `CMCD_V2`. */
	readonly version?: CmcdVersion
	/** `CMCD_QUERY` or `CMCD_HEADERS`. Default `CMCD_QUERY`. */
	readonly transmissionMode?: CmcdTransmissionMode
	/** Request-mode key allowlist. Default: every key of the version. */
	readonly keys?: readonly CmcdKey[]
	/** Header shard per custom key. */
	readonly headerMap?: Partial<CmcdHeaderMap>
	readonly transform?: CmcdRequestTransform
	readonly eventTargets?: readonly CmcdEventTargetConfig[]
	/** Sends the event-mode POST requests. Default: `fetch` with `keepalive`. */
	readonly requester?: CmcdRequester
	/** Observations the reporter turns into defaults. Each is on by default. */
	readonly derive?: Partial<Record<'bg' | 'dl' | 'su', boolean>>
	/** Receives errors that have no caller: interval reports and a requester that fails after the back-off cap. */
	readonly onError?: (error: unknown) => void
}
```

```ts
// libs/cmcd/src/CmcdSessionReporterConfig.ts
/**
 * Configuration of `session.createReporter()`.
 *
 * @public
 */
export type CmcdSessionReporterConfig = {
	/** The content ID of this media player. */
	readonly cid?: string
}
```

```ts
// libs/cmcd/src/CmcdRequestLike.ts
/**
 * The shape `decorate()` and `recordResponse()` accept: a URL and optional headers.
 *
 * @public
 */
export type CmcdRequestLike = {
	readonly url: string
	readonly headers?: Readonly<Record<string, string>>
}
```

```ts
// libs/cmcd/src/CmcdRequestRecord.ts
import type { Cmcd } from './Cmcd.ts'

/**
 * The record `decorate()` puts on the returned request as `cmcd`. `data` is the report as sent.
 * The record object is the key that attributes a late response, so keep it on the request.
 *
 * @public
 */
export type CmcdRequestRecord = {
	readonly sid: string
	readonly data: Readonly<Cmcd>
}
```

```ts
// libs/cmcd/src/CmcdDecoratedRequest.ts
import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import type { CmcdRequestRecord } from './CmcdRequestRecord.ts'

/**
 * The return type of `decorate()`. `url` carries the query parameter in query mode.
 * `headers` carries the `CMCD-` headers in header mode. Every other member of the input passes through.
 *
 * @public
 */
export type CmcdDecoratedRequest<R extends CmcdRequestLike> = Omit<R, 'url' | 'headers' | 'cmcd'> & {
	readonly url: string
	readonly headers?: Readonly<Record<string, string>>
	readonly cmcd: CmcdRequestRecord
}
```

```ts
// libs/cmcd/src/CmcdResourceTiming.ts
/**
 * The members of a `PerformanceResourceTiming` entry that `recordResponse()` reads.
 *
 * @public
 */
export type CmcdResourceTiming = {
	readonly startTime: number
	readonly responseStart?: number
	readonly responseEnd?: number
	readonly duration?: number
}
```

```ts
// libs/cmcd/src/CmcdResponseInfo.ts
import type { CmcdResourceTiming } from './CmcdResourceTiming.ts'

/**
 * What the player knows about a response. Every member is optional.
 *
 * @public
 */
export type CmcdResponseInfo = {
	/** The HTTP status. `rc` is `0` when absent. */
	readonly status?: number
	readonly headers?: Headers | Readonly<Record<string, string>>
	readonly timing?: CmcdResourceTiming
}
```

```ts
// libs/cmcd/src/CmcdSessionReporter.ts
import type { CmcdDecoratedRequest } from './CmcdDecoratedRequest.ts'
import type { CmcdDiscreteEventType } from './CmcdDiscreteEventType.ts'
import type { CmcdPlaybackData } from './CmcdPlaybackData.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import type { CmcdResponseData } from './CmcdResponseData.ts'
import type { CmcdResponseInfo } from './CmcdResponseInfo.ts'
import type { CmcdSession } from './CmcdSession.ts'

/**
 * Reports for one media player inside a `CmcdSession`.
 *
 * @public
 */
export type CmcdSessionReporter = {
	readonly session: CmcdSession
	/** Merges `data` into the store and emits the state-change events it implies. */
	update(data: CmcdPlaybackData): void
	/** Emits one discrete event. */
	recordEvent(type: Exclude<CmcdDiscreteEventType, 'ce'>, data?: CmcdPlaybackData): void
	recordEvent(type: 'ce', data: CmcdPlaybackData & { readonly cen: string }): void
	/** Buffers error codes per destination and emits an `e` event. */
	recordError(code: string | readonly string[], data?: CmcdPlaybackData): void
	/** Returns a copy of `request` with the request-mode report placed on it. */
	decorate<R extends CmcdRequestLike>(request: R, data?: CmcdPlaybackData): CmcdDecoratedRequest<R>
	/** Emits an `rr` event for a response. Pass the request returned by `decorate()`. */
	recordResponse(request: CmcdRequestLike, response: CmcdResponseInfo, data?: CmcdResponseData): void
	dispose(): void
}
```

```ts
// libs/cmcd/src/CmcdSession.ts
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import type { CmcdSessionReporter } from './CmcdSessionReporter.ts'
import type { CmcdSessionReporterConfig } from './CmcdSessionReporterConfig.ts'

/**
 * One CMCD session. It reports under one `sid` at a time and owns the targets, the requester, the timers, and `bg`.
 *
 * @public
 */
export type CmcdSession = {
	/** The current `sid`. */
	readonly sid: string
	createReporter(config?: CmcdSessionReporterConfig): CmcdSessionReporter
	/** Starts the next `sid` for every reporter. A new UUID when omitted. Emits nothing. */
	rotate(sid?: string): void
	/** Replaces the request-mode settings. Emits nothing and resets no counter. */
	configure(settings: Pick<CmcdSessionConfig, 'version' | 'transmissionMode' | 'keys' | 'headerMap'>): void
	/** Sends every queued event line now. */
	flush(): void
	dispose(): void
}
```

- [ ] **Step 5: Export the types**

Add to `libs/cmcd/src/index.ts`, in alphabetical position among the existing lines:

```ts
export type * from './CmcdDecoratedRequest.ts'
export type * from './CmcdDiscreteEventType.ts'
export type * from './CmcdEventTargetConfig.ts'
export type * from './CmcdEventTransform.ts'
export type * from './CmcdMetric.ts'
export type * from './CmcdNextObject.ts'
export type * from './CmcdPlaybackData.ts'
export type * from './CmcdRequestLike.ts'
export type * from './CmcdRequestRecord.ts'
export type * from './CmcdRequestTransform.ts'
export type * from './CmcdRequester.ts'
export type * from './CmcdResourceTiming.ts'
export type * from './CmcdResponseData.ts'
export type * from './CmcdResponseInfo.ts'
export type * from './CmcdSession.ts'
export type * from './CmcdSessionConfig.ts'
export type * from './CmcdSessionReporter.ts'
export type * from './CmcdSessionReporterConfig.ts'
```

- [ ] **Step 6: Run the test and the typecheck**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSessionTypes.test.ts && npm run typecheck`
Expected: PASS, and the typecheck reports no error. If `@ts-expect-error` reports "Unused directive", the type is too loose. Fix the type, not the test.

- [ ] **Step 7: Commit**

```bash
git add libs/cmcd/src libs/cmcd/test/CmcdSessionTypes.test.ts
git commit -s -m "feat(cmcd): add the session API types and the h event token" -m "Co-Authored-By: Claude claude-fable-5-1 <noreply@anthropic.com>"
```

---

### Task 2: Key table, preparation, and request-mode decoration

**Files:**
- Create, in `libs/cmcd/src/`, the preparation files: `CmcdKeySpec.ts`, `CMCD_KEY_SPECS.ts`, `getKeySpec.ts`, `PrepareContext.ts`, `normalizeValue.ts`, `formatNor.ts`, `normalizeReport.ts`, `filterReport.ts`
- Create the configuration files: `NormalizedSessionConfig.ts`, `NormalizedEventTarget.ts`, `normalizeSessionConfig.ts`, `defaultRequester.ts`
- Create the state files: `SessionState.ts`, `SidState.ts`, `ReporterState.ts`, `TargetState.ts`, `TargetEntry.ts`, `RequestOrigin.ts`, `CMCD_REQUEST_ORIGINS.ts`, `createSidState.ts`, `createTargetState.ts`, `getTargetEntry.ts`
- Create the report path files: `assembleReport.ts`, `emitReport.ts`, `pruneSpans.ts`, `placeRequestReport.ts`, `copyPlaybackData.ts`
- Create the facade files: `createSessionReporter.ts`, `createCmcdSession.ts`
- Modify: `libs/cmcd/src/index.ts`
- Test: `libs/cmcd/test/data/CTA_5004_B_EXAMPLES.ts`, `libs/cmcd/test/helpers/cmcdSessionHarness.ts`, `libs/cmcd/test/CmcdSessionReporter.request.test.ts`

**Interfaces:**
- Consumes: the types of Task 1.
- Produces: `createCmcdSession(config?)`, `reporter.update()` as a store merge, `reporter.decorate()` in query and header mode, `reporter.recordError()` buffering into every target's entry. The internal functions below keep these signatures in every later task: `assembleReport(session, sidState, target, reporter, event, data, ts): AssembledReport`, `emitReport(session, sidState, target, reporter, assembled, event, request): EmittedReport | undefined`, `normalizeReport(report, context)`, `filterReport(normalized, context)`.

This task ships request mode end to end. Configuration errors, state-change events, derived keys, and delivery follow in later tasks. `rotate()`, `flush()`, and `dispose()` get their first implementation here and their full behavior in Tasks 9, 11, and 12.

- [ ] **Step 1: Write the fixtures and the harness**

The fixtures are the raw key lines of CTA-5004-B section 8.1. Only the derived `sn` is adapted, because a fixture cannot reproduce a counter of 129.

```ts
// libs/cmcd/test/data/CTA_5004_B_EXAMPLES.ts
/** Raw key lines of CTA-5004-B section 8.1, request mode. */
export const EX_8_1_1 = 'bl=(2000),br=(3000;v),cid="content-id-123",d=4000,dl=1000,mtp=(15000),nor=("next-seg.mp4"),ot=v,rtp=12000,sf=d,sid="session-id-123",st=v,sta=p,tb=(6000;v),v=2'
export const EX_8_1_1_HEADERS = {
	'CMCD-Request': 'bl=(2000),dl=1000,mtp=(15000),nor=("next-seg.mp4"),sta=p',
	'CMCD-Object': 'br=(3000;v),d=4000,ot=v,tb=(6000;v)',
	'CMCD-Status': 'rtp=12000',
	'CMCD-Session': 'cid="content-id-123",sf=d,sid="session-id-123",st=v,v=2',
}
export const EX_8_1_2 = 'bl=(2000),br=(320),cid="content-id-123",d=2000,mtp=(15000),ot=a,sid="session-id-123",st=v,v=2'
export const EX_8_1_3 = 'cid="content-id-123",sid="session-id-123",v=2'
export const EX_8_1_4 = [
	'cid="content-id-123",ot=m,sf=d,sid="session-id-123",st=v,su,v=2',
	'bl=(0),br=(3000;v),cid="content-id-123",mtp=(15000),nor=("seg-1.m4v" "seg-2.m4v"),ot=i,sid="session-id-123",st=v,sta=s,su,v=2',
	'bl=(0),br=(3000;v),cid="content-id-123",d=4000,mtp=(15000),nor=("seg-2.m4v" "seg-3.m4v"),ot=v,sid="session-id-123",st=v,sta=s,su,v=2',
	'bl=(4000),br=(3000;v),cid="content-id-123",d=4000,msd=200,mtp=(15000),nor=("seg-3.m4v" "seg-4.m4v"),ot=v,sid="session-id-123",st=v,sta=p,v=2',
]
export const EX_8_1_5 = [
	'cid="content-id-123",ec=("CODEC_NOT_SUPPORTED"),sid="session-id-123",sta=p,v=2',
	'cid="content-id-123",ec=("DRM_NOT_SUPPORTED" "PLAYBACK_FAILED"),sid="session-id-123",sta=f,v=2',
]
export const EX_8_1_6 = [
	'bl=(0),bs,cid="content-id-123",ot=v,sid="session-id-123",sta=r,v=2',
	'bl=(0;v 2000;a),bs,cid="content-id-123",ot=v,sid="session-id-123",sta=r,v=2',
]
export const EX_8_1_7 = {
	primary: 'cid="movie-123",ot=v,sid="session-common-1",v=2',
	ad: 'cid="ad-555",nr,ot=v,sid="session-common-1",v=2',
	primaryHidden: 'cid="movie-123",nr,ot=v,sid="session-common-1",v=2',
	adShown: 'cid="ad-555",ot=v,sid="session-common-1",v=2',
}
/** 8.1.8 with `sn=129` replaced by the first sequence number of a fresh session. */
export const EX_8_1_8 = 'bg,bl=(2100;v 1800;a),br=(3000;v 164;a),bs,bsa=(3;v),bsd=(1200;v 100;a),bsda=(4150;v 300;a),cid="content-id-123",cs="g48djn236sk2",d=4000,dfa=32,dl=1000,ec=("2001"),lb=(500;v 32;a),ltc=13500,msd=1700,mtp=(15000;v 6000;a),nor=("next-seg.mp4"),nr,ot=v,pb=(2000;v 164;a),pr=1.1,pt=632782,rtp=12000,sf=d,sid="session-id-123",sn=0,st=l,sta=p,su,tb=(6000;v 350;a),tbl=(2000;v 2000;a),tpb=(5000;v 164;a),v=2'

/** POST bodies of section 8.2, event mode. Document whitespace removed. */
export const EX_8_2_1 = 'e=t,ts=1764752400000,v=2'
export const EX_8_2_2 = [
	'bl=(0),cid="content-id-123",e=t,h="example.com",pt=0,sid="session-id-123",sn=1,sta=s,su,ts=1764752400000,v=2',
	'bl=(6000),br=(4200;v 256;a),cid="content-id-123",e=t,h="example.com",lb=(523;v 64;a),msd=812,mtp=(87000;v 49000;a),pb=(4200;v 256;a),pt=29188,sf=d,sid="session-id-123",sn=2,st=v,sta=p,tb=(4200;v 256;a),tpb=(4200;v 256;a),ts=1764752430000,v=2',
	'bl=(3200),br=(4200;v 256;a),bs,bsd=(720;v),cid="content-id-123",e=t,ec=("MEDIA_ERR_NETWORK"),h="example.com",lb=(523;v 64;a),mtp=(89000;v 52000;a),pb=(4200;v 256;a),pt=59188,sf=d,sid="session-id-123",sn=3,st=v,sta=p,tb=(4200;v 256;a),tpb=(4200;v 256;a),ts=1764752460000,v=2',
	'bl=(6000),br=(4200;v 256;a),cid="content-id-123",e=t,h="example.com",lb=(523;v 64;a),mtp=(81000;v 55000;a),pb=(4200;v 256;a),pt=89188,sf=d,sid="session-id-123",sn=4,st=v,sta=p,tb=(4200;v 256;a),tpb=(4200;v 256;a),ts=1764752490000,v=2',
	'bl=(0),br=(4200;v 256;a),cid="content-id-123",e=t,h="example.com",lb=(523;v 64;a),mtp=(82000;v 55000;a),pb=(4200;v 256;a),pr=0,pt=111000,sf=d,sid="session-id-123",sn=5,st=v,sta=e,tb=(4200;v 256;a),tpb=(4200;v 256;a),ts=1764752520000,v=2',
]
export const EX_8_2_3 = 'cid="bbb",cmsdd="ZXRwPTEyNTAwO3J0dD0zNTttYj02MDAwO3JkPTIwMA==",cmsds="c2lkPSI5YTNiLTIxY2QiO2JyPTQ1MDA7ZD00MDAwO290PXY7c3Q9dg==",e=rr,nor=("video/segment-6.m4v"),ot=v,rc=200,sid="session1",ts=1763657019723,ttfb=180,ttlb=200,url="video/segment-5.m4v",v=2'
export const EX_8_2_4 = 'cid="content-id-123",e=e,ec=("CODEC_NOT_SUPPORTED"),sid="session-id-123",ts=1764269150213,v=2'
/** 8.2.5. The first line carries `bs`, which the example omits. See the derived test for the reason. */
export const EX_8_2_5 = [
	'bs,cid="content-id-123",e=ps,sid="session-id-123",sta=r,ts=1764269150889,v=2',
	'bs,bsd=(1500),cid="content-id-123",e=ps,sid="session-id-123",sta=p,ts=1764269152389,v=2',
]
export const EX_8_2_6 = 'bl=(0),cid="content-id-123",e=ps,pt=30000,sid="session-id-123",sta=k,ts=1764269150529,v=2'
export const EX_8_2_7 = 'cid="ad-content-555",e=sk,sid="session-id-123",ts=1764269150076,v=2'
export const EX_8_2_8 = [
	'cid="movie-123",e=abs,nr,sid="session-id-123",ts=1764269150186,v=2',
	'cid="ad-001",e=as,sid="session-id-123",ts=1764269150934,v=2',
	'cid="ad-001",e=ae,nr,sid="session-id-123",ts=1764269170901,v=2',
	'cid="movie-123",e=abe,sid="session-id-123",ts=1764269170331,v=2',
]
```

The spec's 8.2.5 second `ts` is earlier than the first in the document. The fixture uses the first `ts` plus the 1500 millisecond stall, so that `bsd` derives from the clock. Example 8.2.9 is not a fixture. Its `smrt` value has no derivation, and 8.1.8 and 8.2.3 cover its other keys.

```ts
// libs/cmcd/test/helpers/cmcdSessionHarness.ts
import type { HttpRequest } from '@svta/cml-utils'

export type MockRequester = {
	requester: (request: HttpRequest) => Promise<{ status: number }>
	requests: HttpRequest[]
	bodies: () => string[]
	status: number
}

/** A requester that records every POST and answers with `status`. Change `status` between calls. */
export function createMockRequester(status: number = 200): MockRequester {
	const requests: HttpRequest[] = []
	const mock: MockRequester = {
		requests,
		status,
		bodies: () => requests.map(request => request.body as string),
		requester: async (request) => {
			requests.push(request)
			return { status: mock.status }
		},
	}
	return mock
}

/** Lets the requester promises settle. `setImmediate` is not part of the mocked timers. */
export function flushPromises(): Promise<void> {
	return new Promise(resolve => setImmediate(resolve))
}

/** The `CMCD` query value of a decorated URL, decoded. */
export function queryValue(url: string): string {
	const match = /[?&]CMCD=([^&#]*)/.exec(url)
	return match ? decodeURIComponent(match[1]) : ''
}
```

- [ ] **Step 2: Write the failing request-mode tests**

```ts
// libs/cmcd/test/CmcdSessionReporter.request.test.ts
import { CmcdTransmissionMode, createCmcdSession } from '@svta/cml-cmcd'
import { deepEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'
import { EX_8_1_1, EX_8_1_1_HEADERS, EX_8_1_2, EX_8_1_3, EX_8_1_5, EX_8_1_6, EX_8_1_7, EX_8_1_8 } from './data/CTA_5004_B_EXAMPLES.ts'
import { queryValue } from './helpers/cmcdSessionHarness.ts'

const SEGMENT = 'https://cdn.example.com/seg-1.m4s'

describe('CmcdSessionReporter request mode', () => {
	it('reproduces 8.1.1 in query mode', () => {
		const session = createCmcdSession({ sid: 'session-id-123', keys: ['bl', 'br', 'cid', 'd', 'dl', 'mtp', 'nor', 'ot', 'rtp', 'sf', 'sid', 'st', 'sta', 'tb'] })
		const reporter = session.createReporter({ cid: 'content-id-123' })
		reporter.update({ sf: 'd', st: 'v', sta: 'p', bl: 2000, mtp: 15000, rtp: 12000 })
		const req = reporter.decorate({ url: SEGMENT }, { br: { v: 3000 }, d: 4000, dl: 1000, nor: 'https://cdn.example.com/next-seg.mp4', ot: 'v', tb: { v: 6000 } })
		equal(queryValue(req.url), EX_8_1_1)
		equal(req.url.startsWith(`${SEGMENT}?CMCD=`), true)
		equal(req.cmcd.sid, 'session-id-123')
		equal(req.cmcd.data.d, 4000)
	})

	it('reproduces 8.1.1 in header mode', () => {
		const session = createCmcdSession({ sid: 'session-id-123', transmissionMode: CmcdTransmissionMode.HEADERS, keys: ['bl', 'br', 'cid', 'd', 'dl', 'mtp', 'nor', 'ot', 'rtp', 'sf', 'sid', 'st', 'sta', 'tb'] })
		const reporter = session.createReporter({ cid: 'content-id-123' })
		reporter.update({ sf: 'd', st: 'v', sta: 'p', bl: 2000, mtp: 15000, rtp: 12000 })
		const req = reporter.decorate({ url: SEGMENT, headers: { Accept: '*/*' } }, { br: { v: 3000 }, d: 4000, dl: 1000, nor: 'https://cdn.example.com/next-seg.mp4', ot: 'v', tb: { v: 6000 } })
		deepEqual(req.headers, { Accept: '*/*', ...EX_8_1_1_HEADERS })
		equal(req.url, SEGMENT)
	})

	it('reproduces 8.1.2 and 8.1.3', () => {
		const audio = createCmcdSession({ sid: 'session-id-123', keys: ['bl', 'br', 'cid', 'd', 'mtp', 'ot', 'sid', 'st'] })
		const reporter = audio.createReporter({ cid: 'content-id-123' })
		reporter.update({ st: 'v', bl: 2000, mtp: 15000 })
		equal(queryValue(reporter.decorate({ url: SEGMENT }, { br: 320, d: 2000, ot: 'a' }).url), EX_8_1_2)

		const minimal = createCmcdSession({ sid: 'session-id-123', keys: ['cid', 'sid'] })
		equal(queryValue(minimal.createReporter({ cid: 'content-id-123' }).decorate({ url: SEGMENT }).url), EX_8_1_3)
	})

	it('reproduces 8.1.5 with buffered error codes', () => {
		const session = createCmcdSession({ sid: 'session-id-123', keys: ['cid', 'ec', 'sid', 'sta'] })
		const reporter = session.createReporter({ cid: 'content-id-123' })
		reporter.update({ sta: 'p' })
		reporter.recordError('CODEC_NOT_SUPPORTED')
		equal(queryValue(reporter.decorate({ url: SEGMENT }).url), EX_8_1_5[0])
		equal(queryValue(reporter.decorate({ url: SEGMENT }).url), 'cid="content-id-123",sid="session-id-123",sta=p,v=2')
		reporter.recordError(['DRM_NOT_SUPPORTED', 'PLAYBACK_FAILED'])
		reporter.update({ sta: 'f' })
		equal(queryValue(reporter.decorate({ url: SEGMENT }).url), EX_8_1_5[1])
	})

	it('reproduces 8.1.6 with supplied bs', () => {
		const session = createCmcdSession({ sid: 'session-id-123', keys: ['bl', 'bs', 'cid', 'ot', 'sid', 'sta'] })
		const reporter = session.createReporter({ cid: 'content-id-123' })
		reporter.update({ sta: 'r', bl: 0 })
		equal(queryValue(reporter.decorate({ url: SEGMENT }, { ot: 'v', bs: true }).url), EX_8_1_6[0])
		equal(queryValue(reporter.decorate({ url: SEGMENT }, { ot: 'v', bs: true, bl: { v: 0, a: 2000 } }).url), EX_8_1_6[1])
	})

	it('reproduces 8.1.7 with two reporters in one session', () => {
		const session = createCmcdSession({ sid: 'session-common-1', keys: ['cid', 'nr', 'ot', 'sid'] })
		const primary = session.createReporter({ cid: 'movie-123' })
		const ad = session.createReporter({ cid: 'ad-555' })
		ad.update({ nr: true })
		equal(queryValue(primary.decorate({ url: SEGMENT }, { ot: 'v' }).url), EX_8_1_7.primary)
		equal(queryValue(ad.decorate({ url: SEGMENT }, { ot: 'v' }).url), EX_8_1_7.ad)
		primary.update({ nr: true })
		ad.update({ nr: undefined })
		equal(queryValue(primary.decorate({ url: SEGMENT }, { ot: 'v' }).url), EX_8_1_7.primaryHidden)
		equal(queryValue(ad.decorate({ url: SEGMENT }, { ot: 'v' }).url), EX_8_1_7.adShown)
	})

	it('reproduces 8.1.8 with every request-mode key', () => {
		const session = createCmcdSession({ sid: 'session-id-123' })
		const reporter = session.createReporter({ cid: 'content-id-123' })
		reporter.update({ bg: true, bsa: { v: 3 }, bsd: { v: 1200, a: 100 }, bsda: { v: 4150, a: 300 }, cs: 'g48djn236sk2', dfa: 32, ltc: 13500, msd: 1700, pr: 1.1, pt: 632782, rtp: 12000, sf: 'd', st: 'l', sta: 'p', su: true, nr: true })
		reporter.recordError('2001')
		const req = reporter.decorate({ url: SEGMENT }, { bl: { v: 2100, a: 1800 }, br: { v: 3000, a: 164 }, bs: true, d: 4000, dl: 1000, lb: { v: 500, a: 32 }, mtp: { v: 15000, a: 6000 }, nor: 'https://cdn.example.com/next-seg.mp4', ot: 'v', pb: { v: 2000, a: 164 }, tb: { v: 6000, a: 350 }, tbl: { v: 2000, a: 2000 }, tpb: { v: 5000, a: 164 } })
		equal(queryValue(req.url), EX_8_1_8)
	})

	it('numbers request-mode reports from zero and replaces an existing CMCD parameter', () => {
		const session = createCmcdSession({ sid: 's', keys: ['sid', 'sn'] })
		const reporter = session.createReporter()
		const first = reporter.decorate({ url: 'https://cdn.example.com/a?x=1#frag' })
		equal(first.url, 'https://cdn.example.com/a?x=1&CMCD=sid%3D%22s%22%2Csn%3D0%2Cv%3D2#frag')
		const second = reporter.decorate(first)
		equal(second.url, 'https://cdn.example.com/a?x=1&CMCD=sid%3D%22s%22%2Csn%3D1%2Cv%3D2#frag')
	})

	it('encodes version 1 request mode', () => {
		const session = createCmcdSession({ sid: 's', version: 1 })
		const reporter = session.createReporter({ cid: 'c' })
		reporter.update({ sf: 'd', st: 'v', bl: { v: 2000, a: 1000 }, mtp: 15000 })
		const req = reporter.decorate({ url: SEGMENT }, { br: { v: 3000 }, d: 4000, ot: 'v', nor: { url: 'https://cdn.example.com/next seg.mp4', range: '0-99' } })
		equal(queryValue(req.url), 'bl=2000,br=3000,cid="c",d=4000,mtp=15000,nor="next%20seg.mp4",nrr="0-99",ot=v,sf=d,st=v')
	})
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSessionReporter.request.test.ts`
Expected: FAIL, `createCmcdSession` is not exported.

- [ ] **Step 4: Write the key table**

```ts
// libs/cmcd/src/CmcdKeySpec.ts
/**
 * One row of the key table. `requiredOn` is `'always'` or an event type. `v1` says what version 1 does with the key:
 * absent drops it, scalar collapses an object-type list to one number, string keeps the first `nor` entry.
 */
export type CmcdKeySpec = {
	readonly type: 'boolean' | 'integer' | 'decimal' | 'string' | 'token' | 'string-list' | 'ot-list' | 'nor' | 'custom'
	readonly modes: 'both' | 'event'
	readonly round?: number
	readonly ot?: readonly string[]
	readonly supersededBy?: string
	readonly onlyOn?: string
	readonly requiredOn?: string
	readonly omitDefault?: boolean | number
	readonly max?: number
	readonly v1?: 'absent' | 'scalar' | 'string'
	readonly tokens?: readonly string[]
}
```

```ts
// libs/cmcd/src/CMCD_KEY_SPECS.ts
import type { CmcdKeySpec } from './CmcdKeySpec.ts'

const EVENTS = ['bc', 'ps', 'pr', 'e', 't', 'c', 'b', 'm', 'um', 'pe', 'pc', 'rr', 'as', 'ae', 'abs', 'abe', 'sk', 'ce', 'h']
const MEDIA = ['a', 'v', 'av', 'tt', 'c', 'o']

/** One row per reserved key of CTA-5004-B Table 1, plus the version 1 `nrr` key. */
export const CMCD_KEY_SPECS: Readonly<Record<string, CmcdKeySpec>> = {
	ab: { type: 'ot-list', modes: 'both', round: 1, supersededBy: 'br', v1: 'absent' },
	bg: { type: 'boolean', modes: 'both', requiredOn: 'b', omitDefault: false, v1: 'absent' },
	bl: { type: 'ot-list', modes: 'both', round: 100, v1: 'scalar' },
	br: { type: 'ot-list', modes: 'both', round: 1, requiredOn: 'bc', v1: 'scalar' },
	bs: { type: 'boolean', modes: 'both', omitDefault: false },
	bsa: { type: 'ot-list', modes: 'both', round: 1, v1: 'absent' },
	bsd: { type: 'ot-list', modes: 'both', round: 1, v1: 'absent' },
	bsda: { type: 'ot-list', modes: 'both', round: 1, v1: 'absent' },
	cen: { type: 'string', modes: 'event', onlyOn: 'ce', requiredOn: 'ce', max: 64 },
	cid: { type: 'string', modes: 'both', requiredOn: 'c', max: 128 },
	cmsdd: { type: 'string', modes: 'event', onlyOn: 'rr' },
	cmsds: { type: 'string', modes: 'event', onlyOn: 'rr' },
	cs: { type: 'string', modes: 'both', v1: 'absent' },
	d: { type: 'integer', modes: 'both', round: 1, ot: MEDIA },
	dfa: { type: 'integer', modes: 'both', round: 1, v1: 'absent' },
	dl: { type: 'integer', modes: 'both', round: 100 },
	e: { type: 'token', modes: 'event', requiredOn: 'always', tokens: EVENTS },
	ec: { type: 'string-list', modes: 'both', requiredOn: 'e', v1: 'absent' },
	h: { type: 'string', modes: 'event', requiredOn: 'h', max: 128 },
	lab: { type: 'ot-list', modes: 'both', round: 1, supersededBy: 'lb', v1: 'absent' },
	lb: { type: 'ot-list', modes: 'both', round: 1, v1: 'absent' },
	ltc: { type: 'integer', modes: 'both', round: 1, v1: 'absent' },
	msd: { type: 'integer', modes: 'both', round: 1, v1: 'absent' },
	mtp: { type: 'ot-list', modes: 'both', round: 100, v1: 'scalar' },
	nor: { type: 'nor', modes: 'both', v1: 'string' },
	nr: { type: 'boolean', modes: 'both', omitDefault: false, v1: 'absent' },
	nrr: { type: 'string', modes: 'both' },
	ot: { type: 'token', modes: 'both', tokens: ['m', 'a', 'v', 'av', 'i', 'c', 'tt', 'k', 'o'] },
	pb: { type: 'ot-list', modes: 'both', round: 1, v1: 'absent' },
	pr: { type: 'decimal', modes: 'both', requiredOn: 'pr', omitDefault: 1 },
	pt: { type: 'integer', modes: 'both', round: 1, v1: 'absent' },
	rc: { type: 'integer', modes: 'event', round: 1, onlyOn: 'rr' },
	rtp: { type: 'integer', modes: 'both', round: 100 },
	sf: { type: 'token', modes: 'both', tokens: ['d', 'h', 'e', 's', 'o'] },
	sid: { type: 'string', modes: 'both', max: 64 },
	smrt: { type: 'string', modes: 'event', onlyOn: 'rr' },
	sn: { type: 'integer', modes: 'both', round: 1, v1: 'absent' },
	st: { type: 'token', modes: 'both', tokens: ['v', 'l', 'll'] },
	sta: { type: 'token', modes: 'both', requiredOn: 'ps', tokens: ['s', 'p', 'k', 'r', 'a', 'w', 'e', 'f', 'q', 'd'], v1: 'absent' },
	su: { type: 'boolean', modes: 'both', omitDefault: false },
	tab: { type: 'ot-list', modes: 'both', round: 1, supersededBy: 'tb', v1: 'absent' },
	tb: { type: 'ot-list', modes: 'both', round: 1, v1: 'scalar' },
	tbl: { type: 'ot-list', modes: 'both', round: 100, v1: 'absent' },
	tpb: { type: 'ot-list', modes: 'both', round: 1, ot: ['a', 'v', 'av', 'c'], v1: 'absent' },
	ts: { type: 'integer', modes: 'event', round: 1, requiredOn: 'always' },
	ttfb: { type: 'integer', modes: 'event', round: 1, onlyOn: 'rr' },
	ttfbb: { type: 'integer', modes: 'event', round: 1, onlyOn: 'rr' },
	ttlb: { type: 'integer', modes: 'event', round: 1, onlyOn: 'rr' },
	url: { type: 'string', modes: 'event', onlyOn: 'rr', requiredOn: 'rr' },
	v: { type: 'integer', modes: 'both', round: 1, requiredOn: 'always', omitDefault: 1, v1: 'absent' },
}
```

```ts
// libs/cmcd/src/getKeySpec.ts
import { CMCD_KEY_SPECS } from './CMCD_KEY_SPECS.ts'
import type { CmcdKeySpec } from './CmcdKeySpec.ts'

const CUSTOM_KEY = /^[a-z0-9.]+-[a-z0-9.-]+$/
const CUSTOM_SPEC: CmcdKeySpec = { type: 'custom', modes: 'both', max: 64 }

/** The spec of a reserved key, the custom spec for a hyphenated lowercase key, else `undefined`. */
export function getKeySpec(key: string): CmcdKeySpec | undefined {
	return CMCD_KEY_SPECS[key] ?? (CUSTOM_KEY.test(key) ? CUSTOM_SPEC : undefined)
}
```

- [ ] **Step 5: Write the value normalization**

```ts
// libs/cmcd/src/PrepareContext.ts
import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'

/** What preparation needs to know about the report it prepares. */
export type PrepareContext = {
	readonly version: CmcdVersion
	readonly mode: CmcdReportingMode
	readonly event: string | undefined
	readonly keys: ReadonlySet<string> | undefined
	readonly baseUrl: string | undefined
}
```

```ts
// libs/cmcd/src/normalizeValue.ts
import { SfItem, SfToken, symbolToStr } from '@svta/cml-structured-field-values'
import type { CmcdKeySpec } from './CmcdKeySpec.ts'
import type { PrepareContext } from './PrepareContext.ts'

type OtItem = number | SfItem<number, Record<string, boolean>>

function roundTo(value: number, step: number): number {
	return Math.round(value / step) * step
}

/** The text of a token given as a string, a symbol, an `SfToken`, or an `SfItem` of one of those. */
export function toTokenText(value: unknown): string | undefined {
	if (value instanceof SfItem) {
		return toTokenText(value.value)
	}
	if (typeof value === 'string') {
		return value
	}
	if (typeof value === 'symbol' || value instanceof SfToken) {
		return symbolToStr(value)
	}
	return undefined
}

function toOtItems(value: unknown, step: number): OtItem[] {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? [roundTo(value, step)] : []
	}
	if (value instanceof SfItem) {
		return typeof value.value === 'number' && Number.isFinite(value.value) ? [new SfItem(roundTo(value.value, step), value.params)] : []
	}
	if (Array.isArray(value)) {
		return value.flatMap(item => toOtItems(item, step))
	}
	if (value && typeof value === 'object') {
		const items: OtItem[] = []
		for (const [ot, amount] of Object.entries(value)) {
			if (typeof amount === 'number' && Number.isFinite(amount)) {
				items.push(new SfItem(roundTo(amount, step), { [ot]: true }))
			}
		}
		return items
	}
	return []
}

function collapse(items: OtItem[], reportOt: string | undefined): number {
	const match = reportOt === undefined ? undefined : items.find(item => item instanceof SfItem && item.params?.[reportOt] === true)
	const first = match ?? items[0]
	return first instanceof SfItem ? first.value : first
}

/**
 * Turns one plain value into its structured-field form, or `undefined` when the value is empty or invalid for the key.
 * `reportOt` is the report's object type, used to collapse a list in version 1.
 */
export function normalizeValue(value: unknown, spec: CmcdKeySpec, context: PrepareContext, reportOt: string | undefined): unknown {
	switch (spec.type) {
		case 'boolean':
			return typeof value === 'boolean' ? value : undefined
		case 'integer':
			return typeof value === 'number' && Number.isFinite(value) ? roundTo(value, spec.round ?? 1) : undefined
		case 'decimal':
			return typeof value === 'number' && Number.isFinite(value) ? value : undefined
		case 'string':
			return typeof value === 'string' && value !== '' && (spec.max === undefined || value.length <= spec.max) ? value : undefined
		case 'token': {
			const text = toTokenText(value)
			return text !== undefined && text !== '' && (spec.tokens === undefined || spec.tokens.includes(text)) ? new SfToken(text) : undefined
		}
		case 'string-list': {
			const list = (Array.isArray(value) ? value : [value]).filter(item => typeof item === 'string' && item !== '')
			return list.length > 0 ? list : undefined
		}
		case 'ot-list': {
			const items = toOtItems(value, spec.round ?? 1)
			if (items.length === 0) {
				return undefined
			}
			return context.version === 1 && spec.v1 === 'scalar' ? collapse(items, reportOt) : items
		}
		case 'custom': {
			if (typeof value === 'string') {
				return value !== '' && value.length <= (spec.max ?? Infinity) ? value : undefined
			}
			if (typeof value === 'number') {
				return Number.isFinite(value) ? value : undefined
			}
			if (Array.isArray(value)) {
				return value.length > 0 ? [...value] : undefined
			}
			return typeof value === 'boolean' || typeof value === 'symbol' || value instanceof SfToken || value instanceof SfItem ? value : undefined
		}
		default:
			return undefined
	}
}
```

```ts
// libs/cmcd/src/formatNor.ts
import { SfItem } from '@svta/cml-structured-field-values'
import { getBaseUrl, urlToRelativePath } from '@svta/cml-utils'
import type { CmcdNextObject } from './CmcdNextObject.ts'
import type { PrepareContext } from './PrepareContext.ts'

type Entry = { readonly path: string; readonly range: string | undefined }

function toEntries(value: unknown, baseUrl: string | undefined): Entry[] {
	const items = Array.isArray(value) ? value : [value]
	const base = baseUrl === undefined ? undefined : getBaseUrl(baseUrl)
	const entries: Entry[] = []
	for (const item of items as CmcdNextObject[]) {
		const url = typeof item === 'string' ? item : item?.url
		if (typeof url !== 'string' || url === '') {
			continue
		}
		const range = typeof item === 'string' ? undefined : item.range
		entries.push({ path: base === undefined ? url : urlToRelativePath(url, base), range: range === '' ? undefined : range })
	}
	return entries
}

/** The wire form of `nor`. Version 2 is a list, version 1 is one percent-encoded path plus `nrr`. */
export function formatNor(value: unknown, context: PrepareContext): { nor?: unknown; nrr?: string } {
	const entries = toEntries(value, context.baseUrl)
	if (entries.length === 0) {
		return {}
	}
	if (context.version === 1) {
		const [first] = entries
		return first.range === undefined ? { nor: encodeURIComponent(first.path) } : { nor: encodeURIComponent(first.path), nrr: first.range }
	}
	return { nor: entries.map(entry => entry.range === undefined ? entry.path : new SfItem(entry.path, { r: entry.range })) }
}
```

`getBaseUrl` throws on a relative base. `decorate()` always passes the request URL, and `urlToRelativePath` returns a relative `nor` value unchanged, so a relative segment URL only breaks the `nor` relativization. Guard the `getBaseUrl` call with a `try` that falls back to `undefined` when the base is not absolute:

```ts
function safeBase(baseUrl: string | undefined): string | undefined {
	if (baseUrl === undefined) {
		return undefined
	}
	try {
		return getBaseUrl(baseUrl)
	}
	catch {
		return undefined
	}
}
```

Use `safeBase(baseUrl)` in place of the `getBaseUrl(baseUrl)` call in `toEntries`.

```ts
// libs/cmcd/src/normalizeReport.ts
import { formatNor } from './formatNor.ts'
import { getKeySpec } from './getKeySpec.ts'
import { normalizeValue, toTokenText } from './normalizeValue.ts'
import type { PrepareContext } from './PrepareContext.ts'
import { CMCD_EVENT_MODE } from './CmcdReportingMode.ts'

/** Plain report values to structured-field values, in sorted key order. Keys of the other mode and version 1 drops are removed. */
export function normalizeReport(report: Record<string, unknown>, context: PrepareContext): Record<string, unknown> {
	const out: Record<string, unknown> = {}
	const reportOt = toTokenText(report['ot'])
	for (const key of Object.keys(report).sort()) {
		const spec = getKeySpec(key)
		const value = report[key]
		if (!spec || value === undefined || value === null) {
			continue
		}
		if (spec.modes === 'event' && context.mode !== CMCD_EVENT_MODE) {
			continue
		}
		if (context.version === 1 && spec.v1 === 'absent') {
			continue
		}
		if (spec.type === 'nor') {
			const { nor, nrr } = formatNor(value, context)
			if (nor !== undefined) {
				out['nor'] = nor
			}
			if (nrr !== undefined) {
				out['nrr'] = nrr
			}
			continue
		}
		const normalized = normalizeValue(value, spec, context, reportOt)
		if (normalized !== undefined) {
			out[key] = normalized
		}
	}
	return out
}
```

```ts
// libs/cmcd/src/filterReport.ts
import { getKeySpec } from './getKeySpec.ts'
import type { CmcdKeySpec } from './CmcdKeySpec.ts'
import { toTokenText } from './normalizeValue.ts'
import type { PrepareContext } from './PrepareContext.ts'

/** Whether the spec rules make `key` required on the report's event. */
export function isRequired(spec: CmcdKeySpec, event: string | undefined): boolean {
	return spec.requiredOn === 'always' || (spec.requiredOn !== undefined && spec.requiredOn === event)
}

function isPresent(value: unknown): boolean {
	return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null
}

/** Applies the key allowlist and the spec rules to a normalized report. Keys stay in sorted order. */
export function filterReport(normalized: Record<string, unknown>, context: PrepareContext): Record<string, unknown> {
	const out: Record<string, unknown> = {}
	const reportOt = toTokenText(normalized['ot'])
	for (const key of Object.keys(normalized)) {
		const spec = getKeySpec(key)
		const value = normalized[key]
		if (!spec) {
			continue
		}
		if (spec.onlyOn !== undefined && spec.onlyOn !== context.event) {
			continue
		}
		if (spec.ot !== undefined && context.version === 2 && reportOt !== undefined && !spec.ot.includes(reportOt)) {
			continue
		}
		if (spec.supersededBy !== undefined && isPresent(normalized[spec.supersededBy])) {
			continue
		}
		const required = isRequired(spec, context.event)
		if (context.keys !== undefined && !context.keys.has(key) && !required) {
			continue
		}
		if (spec.omitDefault !== undefined && value === spec.omitDefault && !required) {
			continue
		}
		out[key] = value
	}
	return out
}
```

- [ ] **Step 6: Write the configuration normalization and the state types**

```ts
// libs/cmcd/src/NormalizedEventTarget.ts
import type { CmcdEventTransform } from './CmcdEventTransform.ts'

/** An event target with every default applied. `interval` is in milliseconds. */
export type NormalizedEventTarget = {
	readonly url: string
	readonly events: ReadonlySet<string>
	readonly keys: ReadonlySet<string> | undefined
	readonly interval: number
	readonly batchSize: number
	readonly maxQueueSize: number
	readonly headers: Readonly<Record<string, string>> | undefined
	readonly transform: CmcdEventTransform | undefined
}
```

```ts
// libs/cmcd/src/NormalizedSessionConfig.ts
import type { CmcdHeaderMap } from './CmcdHeaderMap.ts'
import type { CmcdRequestTransform } from './CmcdRequestTransform.ts'
import type { CmcdRequester } from './CmcdRequester.ts'
import type { CmcdTransmissionMode } from './CmcdTransmissionMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'
import type { NormalizedEventTarget } from './NormalizedEventTarget.ts'

/** The session configuration with every default applied. The request-mode members change through `configure()`. */
export type NormalizedSessionConfig = {
	version: CmcdVersion
	transmissionMode: CmcdTransmissionMode
	keys: ReadonlySet<string> | undefined
	headerMap: Partial<CmcdHeaderMap> | undefined
	readonly transform: CmcdRequestTransform | undefined
	readonly eventTargets: readonly NormalizedEventTarget[]
	readonly requester: CmcdRequester
	readonly derive: { readonly bg: boolean; readonly dl: boolean; readonly su: boolean }
	readonly onError: ((error: unknown) => void) | undefined
}
```

```ts
// libs/cmcd/src/normalizeSessionConfig.ts
import { CMCD_DEFAULT_TIME_INTERVAL } from './CMCD_DEFAULT_TIME_INTERVAL.ts'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { CmcdEventTargetConfig } from './CmcdEventTargetConfig.ts'
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { CMCD_QUERY } from './CmcdTransmissionMode.ts'
import { defaultRequester } from './defaultRequester.ts'
import type { NormalizedEventTarget } from './NormalizedEventTarget.ts'
import type { NormalizedSessionConfig } from './NormalizedSessionConfig.ts'

const DEFAULT_EVENTS = ['ps', 'e', 't', 'rr']

function normalizeTarget(target: CmcdEventTargetConfig): NormalizedEventTarget {
	return {
		url: target.url,
		events: new Set(target.events ?? DEFAULT_EVENTS),
		keys: target.keys === undefined ? undefined : new Set(target.keys),
		interval: (target.interval ?? CMCD_DEFAULT_TIME_INTERVAL) * 1000,
		batchSize: target.batchSize ?? 1,
		maxQueueSize: target.maxQueueSize ?? 500,
		headers: target.headers === undefined ? undefined : { ...target.headers },
		transform: target.transform,
	}
}

/** Applies the defaults. Task 3 adds the checks. */
export function normalizeSessionConfig(config: CmcdSessionConfig): NormalizedSessionConfig {
	return {
		version: config.version ?? CMCD_V2,
		transmissionMode: config.transmissionMode ?? CMCD_QUERY,
		keys: config.keys === undefined ? undefined : new Set(config.keys),
		headerMap: config.headerMap,
		transform: config.transform,
		eventTargets: (config.eventTargets ?? []).map(normalizeTarget),
		requester: config.requester ?? defaultRequester,
		derive: { bg: config.derive?.bg ?? true, dl: config.derive?.dl ?? true, su: config.derive?.su ?? true },
		onError: config.onError,
	}
}
```

Check that `CMCD_DEFAULT_TIME_INTERVAL` is `30` in seconds. If the constant holds milliseconds, drop the `* 1000`.

```ts
// libs/cmcd/src/defaultRequester.ts
import type { HttpRequest } from '@svta/cml-utils'

/** POSTs through `fetch` with `keepalive` for bodies under 64 KB, so a flush on `pagehide` completes. */
export function defaultRequester(request: HttpRequest): Promise<{ status: number }> {
	const body = typeof request.body === 'string' ? request.body : ''
	return fetch(request.url, { method: request.method, headers: request.headers, body, keepalive: body.length < 65536 })
}
```

```ts
// libs/cmcd/src/TargetEntry.ts
/** The per-reporter state of one target: the `bs` flag and the `ec` buffer. */
export type TargetEntry = { bs: boolean; readonly ec: string[] }
```

```ts
// libs/cmcd/src/TargetState.ts
import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import type { ReporterState } from './ReporterState.ts'
import type { TargetEntry } from './TargetEntry.ts'

/** One destination inside one `sid` state. `index` is the position in the event target list, `-1` for the request target. */
export type TargetState = {
	readonly kind: CmcdReportingMode
	readonly index: number
	sn: number
	msdSent: boolean
	readonly bsdCursors: Map<string, number>
	readonly entries: Map<ReporterState, TargetEntry>
	readonly queue: string[]
	attempt: number
	retryTimer: ReturnType<typeof setTimeout> | undefined
	sending: boolean
	drainRequested: boolean
	gone: boolean
}
```

```ts
// libs/cmcd/src/SidState.ts
import type { CmcdMetric } from './CmcdMetric.ts'
import type { ReporterState } from './ReporterState.ts'
import type { TargetState } from './TargetState.ts'

/** Everything that resets with a `sid`. `pending` holds the `bsd` samples per cause, automatic spans under the empty key. */
export type SidState = {
	readonly sid: string
	ended: boolean
	readonly requestTarget: TargetState
	readonly eventTargets: readonly TargetState[]
	bgReported: boolean | undefined
	msd: number | undefined
	msdSupplied: boolean
	msdStart: number | undefined
	bsa: number
	bsda: number
	bsaSupplied: CmcdMetric | undefined
	bsdaSupplied: CmcdMetric | undefined
	bsdSupplied: boolean
	readonly pending: Map<string, number[]>
	readonly stores: Map<ReporterState, Record<string, unknown>>
}
```

```ts
// libs/cmcd/src/ReporterState.ts
import type { SessionState } from './SessionState.ts'

/** The state of one reporter. `reported` holds the last reported value of each tracked field. */
export type ReporterState = {
	readonly session: SessionState
	readonly store: Record<string, unknown>
	readonly reported: { sta?: unknown; pr?: unknown; cid?: unknown; br?: unknown }
	host: string | undefined
	hSupplied: boolean
	su: boolean | undefined
	suSupplied: boolean
	dlSupplied: boolean
	spanOpenedAt: number | undefined
	disposed: boolean
}
```

```ts
// libs/cmcd/src/SessionState.ts
import type { NormalizedSessionConfig } from './NormalizedSessionConfig.ts'
import type { ReporterState } from './ReporterState.ts'
import type { SidState } from './SidState.ts'

/** The state of one session. `reporters` is in creation order. */
export type SessionState = {
	config: NormalizedSessionConfig
	readonly reporters: Set<ReporterState>
	current: SidState
	readonly timers: ReturnType<typeof setInterval>[]
	bg: boolean | undefined
	bgSupplied: boolean
	stopVisibility: (() => void) | undefined
	disposed: boolean
}
```

```ts
// libs/cmcd/src/RequestOrigin.ts
import type { CmcdPlaybackData } from './CmcdPlaybackData.ts'
import type { ReporterState } from './ReporterState.ts'
import type { SidState } from './SidState.ts'

/** What a decorated request remembers for its response. `data` is a copy. */
export type RequestOrigin = {
	readonly reporter: ReporterState
	readonly sidState: SidState
	readonly cid: string | undefined
	readonly data: CmcdPlaybackData | undefined
	readonly startedAt: number
}
```

```ts
// libs/cmcd/src/CMCD_REQUEST_ORIGINS.ts
import type { RequestOrigin } from './RequestOrigin.ts'

/** Keyed by the `cmcd` record on a decorated request. An entry lives as long as the record. */
export const CMCD_REQUEST_ORIGINS: WeakMap<object, RequestOrigin> = /* @__PURE__ */ new WeakMap()
```

```ts
// libs/cmcd/src/createTargetState.ts
import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import type { TargetState } from './TargetState.ts'

export function createTargetState(kind: CmcdReportingMode, index: number): TargetState {
	return {
		kind,
		index,
		sn: 0,
		msdSent: false,
		bsdCursors: new Map(),
		entries: new Map(),
		queue: [],
		attempt: 0,
		retryTimer: undefined,
		sending: false,
		drainRequested: false,
		gone: false,
	}
}
```

```ts
// libs/cmcd/src/createSidState.ts
import { CMCD_EVENT_MODE, CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import { createTargetState } from './createTargetState.ts'
import type { NormalizedSessionConfig } from './NormalizedSessionConfig.ts'
import type { SidState } from './SidState.ts'

export function createSidState(sid: string, config: NormalizedSessionConfig): SidState {
	return {
		sid,
		ended: false,
		requestTarget: createTargetState(CMCD_REQUEST_MODE, -1),
		eventTargets: config.eventTargets.map((_, index) => createTargetState(CMCD_EVENT_MODE, index)),
		bgReported: undefined,
		msd: undefined,
		msdSupplied: false,
		msdStart: undefined,
		bsa: 0,
		bsda: 0,
		bsaSupplied: undefined,
		bsdaSupplied: undefined,
		bsdSupplied: false,
		pending: new Map(),
		stores: new Map(),
	}
}
```

```ts
// libs/cmcd/src/getTargetEntry.ts
import type { ReporterState } from './ReporterState.ts'
import type { TargetEntry } from './TargetEntry.ts'
import type { TargetState } from './TargetState.ts'

/** The target's entry for a reporter, created on first use. */
export function getTargetEntry(target: TargetState, reporter: ReporterState): TargetEntry {
	let entry = target.entries.get(reporter)
	if (!entry) {
		entry = { bs: false, ec: [] }
		target.entries.set(reporter, entry)
	}
	return entry
}
```

- [ ] **Step 7: Write the report path**

```ts
// libs/cmcd/src/assembleReport.ts
import { SfItem } from '@svta/cml-structured-field-values'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { CmcdPlaybackData } from './CmcdPlaybackData.ts'
import { CMCD_EVENT_MODE } from './CmcdReportingMode.ts'
import type { ReporterState } from './ReporterState.ts'
import type { SessionState } from './SessionState.ts'
import type { SidState } from './SidState.ts'
import type { TargetState } from './TargetState.ts'

/** The plain report before preparation, and the `bsd` causes it carries, for the commit step. */
export type AssembledReport = {
	readonly report: Record<string, unknown>
	readonly bsdCauses: readonly string[]
}

function pickLevel(bl: unknown, ot: unknown): number | undefined {
	if (typeof bl === 'number') {
		return bl
	}
	if (bl && typeof bl === 'object' && !Array.isArray(bl)) {
		const levels = bl as Record<string, unknown>
		const own = typeof ot === 'string' ? levels[ot] : undefined
		const first = Object.values(levels).find(value => typeof value === 'number')
		return typeof own === 'number' ? own : typeof first === 'number' ? first : undefined
	}
	return undefined
}

/** `dl` is `bl` divided by `pr`. The key table rounds it to 100 milliseconds. */
export function deriveDl(bl: unknown, pr: unknown, ot: unknown): number | undefined {
	const rate = typeof pr === 'number' ? pr : 1
	const level = pickLevel(bl, ot)
	return level !== undefined && Number.isFinite(level) && rate > 0 ? level / rate : undefined
}

/**
 * Merges, in this order and later wins: the store, the session data, the per-call data, the target's entry for the reporter,
 * the derived defaults, and the event stamp. `reporter` is `undefined` for a session-only interval line.
 */
export function assembleReport(session: SessionState, sidState: SidState, target: TargetState, reporter: ReporterState | undefined, event: string | undefined, data: CmcdPlaybackData | undefined, ts: number): AssembledReport {
	const config = session.config
	const report: Record<string, unknown> = reporter ? { ...reporter.store } : {}
	const bsdCauses: string[] = []

	report['sid'] = sidState.sid
	if (target.kind === CMCD_EVENT_MODE || config.version === CMCD_V2) {
		report['v'] = CMCD_V2
	}
	if (session.bg) {
		report['bg'] = true
	}
	if (sidState.msd !== undefined && !target.msdSent) {
		report['msd'] = sidState.msd
	}
	const bsa = sidState.bsaSupplied ?? (sidState.bsa > 0 ? sidState.bsa : undefined)
	if (bsa !== undefined) {
		report['bsa'] = bsa
	}
	const bsda = sidState.bsdaSupplied ?? (sidState.bsda > 0 ? sidState.bsda : undefined)
	if (bsda !== undefined) {
		report['bsda'] = bsda
	}
	const bsd: (number | SfItem<number, Record<string, boolean>>)[] = []
	for (const [cause, samples] of sidState.pending) {
		const cursor = target.bsdCursors.get(cause) ?? 0
		if (cursor < samples.length) {
			bsd.push(cause === '' ? samples[cursor] : new SfItem(samples[cursor], { [cause]: true }))
			bsdCauses.push(cause)
		}
	}
	if (bsd.length > 0) {
		report['bsd'] = bsd
	}
	if (target.kind === CMCD_EVENT_MODE && reporter?.host !== undefined && report['h'] === undefined) {
		report['h'] = reporter.host
	}

	if (data) {
		for (const [key, value] of Object.entries(data)) {
			if (value !== undefined) {
				report[key] = value
			}
		}
	}

	if (reporter) {
		const entry = target.entries.get(reporter)
		if (entry?.bs && report['bs'] === undefined) {
			report['bs'] = true
		}
		if (entry && entry.ec.length > 0 && report['ec'] === undefined) {
			report['ec'] = [...entry.ec]
		}
		if (config.derive.su && !reporter.suSupplied && report['su'] === undefined && reporter.su !== undefined) {
			report['su'] = reporter.su
		}
		if (config.derive.dl && !reporter.dlSupplied && report['dl'] === undefined) {
			const dl = deriveDl(report['bl'], report['pr'], report['ot'])
			if (dl !== undefined) {
				report['dl'] = dl
			}
		}
	}

	if (event !== undefined) {
		report['e'] = event
		report['ts'] = ts
	}
	return { report, bsdCauses }
}
```

```ts
// libs/cmcd/src/pruneSpans.ts
import { CMCD_V2 } from './CMCD_V2.ts'
import { CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { SessionState } from './SessionState.ts'
import type { SidState } from './SidState.ts'
import type { TargetState } from './TargetState.ts'

/** The most pending samples kept per cause. Older samples are dropped past the cap. */
export const BSD_PENDING_CAP = 100

/** Whether a target can ever carry `bsd`: not gone, `bsd` in its keys, and version 2 for the request target. */
export function isBsdEligible(session: SessionState, target: TargetState): boolean {
	if (target.gone) {
		return false
	}
	if (target.kind === CMCD_REQUEST_MODE) {
		return session.config.version === CMCD_V2 && (session.config.keys === undefined || session.config.keys.has('bsd'))
	}
	const keys = session.config.eventTargets[target.index]?.keys
	return keys === undefined || keys.has('bsd')
}

/** Drops from every pending list the prefix that every eligible target has consumed, and moves the cursors back. */
export function pruneSpans(session: SessionState, sidState: SidState): void {
	const eligible = [sidState.requestTarget, ...sidState.eventTargets].filter(target => isBsdEligible(session, target))
	for (const [cause, samples] of sidState.pending) {
		const consumed = eligible.length === 0 ? samples.length : Math.min(...eligible.map(target => target.bsdCursors.get(cause) ?? 0))
		if (consumed === 0) {
			continue
		}
		samples.splice(0, consumed)
		for (const target of [sidState.requestTarget, ...sidState.eventTargets]) {
			target.bsdCursors.set(cause, Math.max(0, (target.bsdCursors.get(cause) ?? 0) - consumed))
		}
		if (samples.length === 0) {
			sidState.pending.delete(cause)
		}
	}
}

/** Appends one `bsd` sample when a target can carry it, and enforces the cap. */
export function addSpan(session: SessionState, sidState: SidState, cause: string, duration: number): void {
	const targets = [sidState.requestTarget, ...sidState.eventTargets]
	if (!targets.some(target => isBsdEligible(session, target))) {
		return
	}
	let samples = sidState.pending.get(cause)
	if (!samples) {
		samples = []
		sidState.pending.set(cause, samples)
	}
	samples.push(duration)
	if (samples.length > BSD_PENDING_CAP) {
		samples.shift()
		for (const target of targets) {
			target.bsdCursors.set(cause, Math.max(0, (target.bsdCursors.get(cause) ?? 0) - 1))
		}
	}
}
```

`pruneSpans.ts` has three exports. That is the one exception to the one-export rule in this plan, because the three functions share the eligibility rule and the cursor arithmetic.

```ts
// libs/cmcd/src/emitReport.ts
import { CMCD_V2 } from './CMCD_V2.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEventTransform } from './CmcdEventTransform.ts'
import { CMCD_EVENT_MODE } from './CmcdReportingMode.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import type { AssembledReport } from './assembleReport.ts'
import { encodePreparedCmcd } from './encodePreparedCmcd.ts'
import { filterReport, isRequired } from './filterReport.ts'
import { getKeySpec } from './getKeySpec.ts'
import { normalizeReport } from './normalizeReport.ts'
import type { PrepareContext } from './PrepareContext.ts'
import { pruneSpans } from './pruneSpans.ts'
import type { ReporterState } from './ReporterState.ts'
import type { SessionState } from './SessionState.ts'
import type { SidState } from './SidState.ts'
import type { TargetState } from './TargetState.ts'

/** The prepared report and its encoded line. */
export type EmittedReport = {
	readonly prepared: Record<string, unknown>
	readonly line: string
}

/**
 * Normalizes, transforms, filters, encodes, and commits one report for one target.
 * Returns `undefined` when the transform cancels. An encoder error propagates and commits nothing.
 */
export function emitReport(session: SessionState, sidState: SidState, target: TargetState, reporter: ReporterState | undefined, assembled: AssembledReport, event: string | undefined, request: Readonly<CmcdRequestLike> | undefined): EmittedReport | undefined {
	const config = session.config
	const targetConfig = target.kind === CMCD_EVENT_MODE ? config.eventTargets[target.index] : undefined
	const context: PrepareContext = {
		version: targetConfig ? CMCD_V2 : config.version,
		mode: target.kind,
		event,
		keys: targetConfig ? targetConfig.keys : config.keys,
		baseUrl: request?.url,
	}
	let normalized = normalizeReport(assembled.report, context)
	const transform = targetConfig ? targetConfig.transform : config.transform
	if (transform) {
		const before = normalized
		const result = (transform as CmcdEventTransform)(before as Cmcd, request)
		if (result === null) {
			return undefined
		}
		normalized = normalizeReport(result as Record<string, unknown>, context)
		for (const key of Object.keys(before)) {
			const spec = getKeySpec(key)
			if (spec && isRequired(spec, event) && normalized[key] === undefined) {
				normalized[key] = before[key]
			}
		}
		normalized['sid'] = before['sid']
		if (event !== undefined) {
			normalized['e'] = before['e']
			normalized['ts'] = before['ts']
		}
	}
	normalized['sn'] = target.sn
	const prepared = filterReport(normalized, context)
	const line = encodePreparedCmcd(prepared as Cmcd)

	target.sn += 1
	if (prepared['msd'] !== undefined) {
		target.msdSent = true
	}
	if (reporter) {
		const entry = target.entries.get(reporter)
		if (entry) {
			entry.ec.length = 0
			if (reporter.store['sta'] !== 'r') {
				entry.bs = false
			}
		}
	}
	if (prepared['bsd'] !== undefined) {
		for (const cause of assembled.bsdCauses) {
			target.bsdCursors.set(cause, (target.bsdCursors.get(cause) ?? 0) + 1)
		}
		pruneSpans(session, sidState)
	}
	if (targetConfig) {
		target.queue.push(line)
		if (target.queue.length > targetConfig.maxQueueSize) {
			target.queue.splice(0, target.queue.length - targetConfig.maxQueueSize)
		}
	}
	return { prepared, line }
}
```

```ts
// libs/cmcd/src/placeRequestReport.ts
import { CMCD_PARAM } from './CMCD_PARAM.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdHeaderMap } from './CmcdHeaderMap.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import { CMCD_HEADERS, type CmcdTransmissionMode } from './CmcdTransmissionMode.ts'
import type { EmittedReport } from './emitReport.ts'
import { toPreparedCmcdHeaders } from './toPreparedCmcdHeaders.ts'

const CMCD_QUERY_PARAM = /([?&])CMCD=[^&#]*&?/

/** The URL without its `CMCD` parameter. */
export function removeCmcdQuery(url: string): string {
	return url.replace(CMCD_QUERY_PARAM, (match, separator: string) => match.endsWith('&') ? separator : '')
}

function removeCmcdHeaders(headers: Readonly<Record<string, string>>): Record<string, string> {
	const copy: Record<string, string> = {}
	for (const [name, value] of Object.entries(headers)) {
		if (!name.toLowerCase().startsWith('cmcd-')) {
			copy[name] = value
		}
	}
	return copy
}

function appendQuery(url: string, query: string): string {
	const hash = url.indexOf('#')
	const base = hash < 0 ? url : url.slice(0, hash)
	const fragment = hash < 0 ? '' : url.slice(hash)
	return `${base}${base.includes('?') ? '&' : '?'}${query}${fragment}`
}

/** Removes any earlier CMCD placement from the request, then adds the report in the configured mode. */
export function placeRequestReport(request: CmcdRequestLike, emitted: EmittedReport | undefined, mode: CmcdTransmissionMode, headerMap: Partial<CmcdHeaderMap> | undefined): { url: string; headers: Record<string, string> | undefined } {
	let url = removeCmcdQuery(request.url)
	let headers = request.headers ? removeCmcdHeaders(request.headers) : undefined
	if (!emitted) {
		return { url, headers }
	}
	if (mode === CMCD_HEADERS) {
		headers = { ...(headers ?? {}), ...toPreparedCmcdHeaders(emitted.prepared as Cmcd, headerMap) }
	}
	else if (emitted.line !== '') {
		url = appendQuery(url, `${CMCD_PARAM}=${encodeURIComponent(emitted.line)}`)
	}
	return { url, headers }
}
```

`placeRequestReport.ts` exports two functions. `removeCmcdQuery` is reused by `toResponseKeys` in Task 8.

```ts
// libs/cmcd/src/copyPlaybackData.ts
import { SfItem, SfToken } from '@svta/cml-structured-field-values'
import type { CmcdPlaybackData } from './CmcdPlaybackData.ts'

/** A copy of per-call data, with nested records and arrays copied, so a later mutation by the player does not change a late report. */
export function copyPlaybackData<D extends CmcdPlaybackData>(data: D | undefined): D | undefined {
	if (!data) {
		return undefined
	}
	const copy: Record<string, unknown> = {}
	for (const [key, value] of Object.entries(data)) {
		if (Array.isArray(value)) {
			copy[key] = [...value]
		}
		else if (value && typeof value === 'object' && !(value instanceof SfItem) && !(value instanceof SfToken)) {
			copy[key] = { ...value }
		}
		else {
			copy[key] = value
		}
	}
	return copy as D
}
```

- [ ] **Step 8: Write the reporter facade and the session factory**

```ts
// libs/cmcd/src/createSessionReporter.ts
import type { Cmcd } from './Cmcd.ts'
import { CMCD_REQUEST_ORIGINS } from './CMCD_REQUEST_ORIGINS.ts'
import type { CmcdDecoratedRequest } from './CmcdDecoratedRequest.ts'
import type { CmcdPlaybackData } from './CmcdPlaybackData.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import type { CmcdRequestRecord } from './CmcdRequestRecord.ts'
import type { CmcdSession } from './CmcdSession.ts'
import type { CmcdSessionReporter } from './CmcdSessionReporter.ts'
import type { CmcdSessionReporterConfig } from './CmcdSessionReporterConfig.ts'
import { assembleReport } from './assembleReport.ts'
import { copyPlaybackData } from './copyPlaybackData.ts'
import { emitReport } from './emitReport.ts'
import { getTargetEntry } from './getTargetEntry.ts'
import { placeRequestReport } from './placeRequestReport.ts'
import type { ReporterState } from './ReporterState.ts'
import type { RequestOrigin } from './RequestOrigin.ts'
import type { SessionState } from './SessionState.ts'
import type { SidState } from './SidState.ts'

const SESSION_FACTS = ['bg', 'msd', 'bsa', 'bsda', 'bsd'] as const

function writeSessionFact(state: SessionState, sidState: SidState, key: typeof SESSION_FACTS[number], value: unknown): void {
	if (key === 'bg') {
		state.bg = value === true ? true : undefined
		state.bgSupplied = true
		state.stopVisibility?.()
		state.stopVisibility = undefined
	}
	else if (key === 'msd') {
		sidState.msd = typeof value === 'number' ? value : undefined
		sidState.msdSupplied = true
	}
	else if (key === 'bsa') {
		sidState.bsaSupplied = value as SidState['bsaSupplied']
	}
	else if (key === 'bsda') {
		sidState.bsdaSupplied = value as SidState['bsdaSupplied']
	}
	else {
		sidState.bsdSupplied = true
		const samples = typeof value === 'number' ? { '': value } : (value ?? {}) as Record<string, number>
		for (const [cause, duration] of Object.entries(samples)) {
			if (typeof duration === 'number' && Number.isFinite(duration)) {
				let list = sidState.pending.get(cause)
				if (!list) {
					list = []
					sidState.pending.set(cause, list)
				}
				list.push(duration)
			}
		}
	}
}

/** Merges `data` into the store. Session facts go to the session or the `sid` state. Returns the transition time. */
export function mergeUpdate(state: SessionState, reporter: ReporterState, data: CmcdPlaybackData): number {
	const sidState = state.current
	const ts = typeof data.ts === 'number' ? data.ts : Date.now()
	for (const [key, value] of Object.entries(data)) {
		if (key === 'ts') {
			continue
		}
		if ((SESSION_FACTS as readonly string[]).includes(key)) {
			writeSessionFact(state, sidState, key as typeof SESSION_FACTS[number], value)
			continue
		}
		if (value === undefined) {
			delete reporter.store[key]
		}
		else {
			reporter.store[key] = value
		}
		if (key === 'su') {
			reporter.suSupplied = true
		}
		if (key === 'dl') {
			reporter.dlSupplied = true
		}
		if (key === 'h') {
			reporter.hSupplied = true
		}
	}
	return ts
}

export function createSessionReporter(state: SessionState, session: CmcdSession, config: CmcdSessionReporterConfig = {}): CmcdSessionReporter {
	const reporter: ReporterState = {
		session: state,
		store: config.cid === undefined ? {} : { cid: config.cid },
		reported: { cid: config.cid },
		host: undefined,
		hSupplied: false,
		su: undefined,
		suSupplied: false,
		dlSupplied: false,
		spanOpenedAt: undefined,
		disposed: false,
	}
	state.reporters.add(reporter)

	const facade: CmcdSessionReporter = {
		session,
		update(data) {
			if (reporter.disposed || state.disposed) {
				return
			}
			mergeUpdate(state, reporter, data)
		},
		recordEvent() {},
		recordError(code) {
			if (reporter.disposed || state.disposed) {
				return
			}
			const codes = (typeof code === 'string' ? [code] : [...code]).filter(item => item !== '')
			const sidState = state.current
			for (const target of [sidState.requestTarget, ...sidState.eventTargets]) {
				getTargetEntry(target, reporter).ec.push(...codes)
			}
		},
		decorate<R extends CmcdRequestLike>(request: R, data?: CmcdPlaybackData): CmcdDecoratedRequest<R> {
			const sidState = state.current
			const mode = state.config.transmissionMode
			if (reporter.disposed || state.disposed) {
				const placed = placeRequestReport(request, undefined, mode, state.config.headerMap)
				return finish(request, placed, { sid: sidState.sid, data: {} })
			}
			const dataCopy = copyPlaybackData(data)
			const origin: RequestOrigin = { reporter, sidState, cid: reporter.store['cid'] as string | undefined, data: dataCopy, startedAt: Date.now() }
			const assembled = assembleReport(state, sidState, sidState.requestTarget, reporter, undefined, dataCopy, origin.startedAt)
			const emitted = emitReport(state, sidState, sidState.requestTarget, reporter, assembled, undefined, request)
			const placed = placeRequestReport(request, emitted, mode, state.config.headerMap)
			const record: CmcdRequestRecord = { sid: sidState.sid, data: (emitted?.prepared ?? {}) as Readonly<Cmcd> }
			CMCD_REQUEST_ORIGINS.set(record, origin)
			return finish(request, placed, record)
		},
		recordResponse() {},
		dispose() {
			reporter.disposed = true
			state.reporters.delete(reporter)
			for (const target of [state.current.requestTarget, ...state.current.eventTargets]) {
				target.entries.delete(reporter)
			}
		},
	}
	return facade
}

function finish<R extends CmcdRequestLike>(request: R, placed: { url: string; headers: Record<string, string> | undefined }, record: CmcdRequestRecord): CmcdDecoratedRequest<R> {
	const decorated: Record<string, unknown> = { ...request, url: placed.url, cmcd: record }
	if (placed.headers) {
		decorated['headers'] = placed.headers
	}
	else {
		delete decorated['headers']
	}
	return decorated as CmcdDecoratedRequest<R>
}
```

`recordEvent` and `recordResponse` are empty here because event delivery does not exist yet. Task 5 and Task 8 replace them. `createSessionReporter.ts` exports two functions, `mergeUpdate` for Tasks 5 and 6 and the factory.

```ts
// libs/cmcd/src/createCmcdSession.ts
import { uuid } from '@svta/cml-utils'
import type { CmcdSession } from './CmcdSession.ts'
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { createSessionReporter } from './createSessionReporter.ts'
import { createSidState } from './createSidState.ts'
import { normalizeSessionConfig } from './normalizeSessionConfig.ts'
import type { SessionState } from './SessionState.ts'

/**
 * Creates a CMCD session. One session per playback, one reporter per media player.
 *
 * @example
 * {@includeCode ../test/createCmcdSession.test.ts#example}
 *
 * @public
 */
export function createCmcdSession(config: CmcdSessionConfig = {}): CmcdSession {
	const normalized = normalizeSessionConfig(config)
	const state: SessionState = {
		config: normalized,
		reporters: new Set(),
		current: createSidState(config.sid ?? uuid(), normalized),
		timers: [],
		bg: undefined,
		bgSupplied: false,
		stopVisibility: undefined,
		disposed: false,
	}
	const session: CmcdSession = {
		get sid() {
			return state.current.sid
		},
		createReporter: reporterConfig => createSessionReporter(state, session, reporterConfig),
		rotate(sid) {
			if (state.disposed) {
				return
			}
			const next = sid ?? uuid()
			if (next === state.current.sid) {
				return
			}
			state.current.ended = true
			state.current = createSidState(next, state.config)
			for (const reporter of state.reporters) {
				reporter.reported.sta = undefined
				reporter.reported.pr = undefined
				reporter.reported.cid = undefined
				reporter.reported.br = undefined
				reporter.spanOpenedAt = undefined
			}
		},
		configure(settings) {
			if (state.disposed) {
				return
			}
			if (settings.version !== undefined) {
				state.config.version = settings.version
			}
			if (settings.transmissionMode !== undefined) {
				state.config.transmissionMode = settings.transmissionMode
			}
			if (settings.keys !== undefined) {
				state.config.keys = new Set(settings.keys)
			}
			if (settings.headerMap !== undefined) {
				state.config.headerMap = settings.headerMap
			}
		},
		flush() {},
		dispose() {
			state.disposed = true
			state.current.ended = true
			for (const reporter of state.reporters) {
				reporter.disposed = true
			}
		},
	}
	return session
}
```

Add `export * from './createCmcdSession.ts'` to `libs/cmcd/src/index.ts`. The example region comes with the Task 3 test file. Until then the `{@includeCode}` tag points at a file that does not exist, and the build warns. Create `libs/cmcd/test/createCmcdSession.test.ts` now with only the example:

```ts
// libs/cmcd/test/createCmcdSession.test.ts
import { createCmcdSession } from '@svta/cml-cmcd'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('createCmcdSession', () => {
	it('provides a valid example', () => {
		// #region example
		const session = createCmcdSession({
			keys: ['br', 'bl', 'd', 'ot', 'sid', 'cid', 'mtp', 'sf', 'st', 'su', 'nor'],
		})
		const reporter = session.createReporter({ cid: 'movie-42' })
		reporter.update({ sf: 'h', st: 'v', sta: 'p', bl: 3200, mtp: 15000 })
		const req = reporter.decorate({ url: 'https://cdn.example.com/seg-1.m4s' }, { ot: 'v', d: 4000, br: 3000 })
		// req.url carries the CMCD query parameter, req.cmcd.data is the report as sent
		session.dispose()
		// #endregion example
		equal(req.url.includes('CMCD='), true)
	})
})
```

- [ ] **Step 9: Run the tests**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSessionReporter.request.test.ts libs/cmcd/test/createCmcdSession.test.ts && npm run typecheck`
Expected: PASS for every fixture. If 8.1.1 differs only in `nor`, check `formatNor` against `urlToRelativePath`: the expected relative path of `https://cdn.example.com/next-seg.mp4` from `https://cdn.example.com/seg-1.m4s` is `next-seg.mp4`.

- [ ] **Step 10: Commit**

```bash
git add libs/cmcd/src libs/cmcd/test
git commit -s -m "feat(cmcd): add the key table, report preparation, and request-mode decoration for the session API" -m "Co-Authored-By: Claude claude-fable-5-1 <noreply@anthropic.com>"
```

---

### Task 3: Configuration checks and `configure()`

**Files:**
- Create: `libs/cmcd/src/checkRequestSettings.ts`, `libs/cmcd/src/configureSession.ts`
- Modify: `libs/cmcd/src/normalizeSessionConfig.ts`, `libs/cmcd/src/createSessionReporter.ts`, `libs/cmcd/src/createCmcdSession.ts`
- Test: `libs/cmcd/test/createCmcdSession.test.ts`

**Interfaces:**
- Produces: `checkSid(sid)`, `checkCid(cid)`, `checkRequestSettings(settings)`, `configError(parameter, expected, received)` in `checkRequestSettings.ts`, and `configureSession(state, settings)`. Task 9 calls `checkSid` from `rotate()`.

Every message has the form `CmcdSession: <parameter> must be <expected>, received <value>`.

- [ ] **Step 1: Write the failing tests**

Append to `libs/cmcd/test/createCmcdSession.test.ts`, inside the `describe`:

```ts
	it('uses a UUID when no sid is given', () => {
		const session = createCmcdSession()
		equal(/^[0-9a-f-]{36}$/.test(session.sid), true)
		equal(createCmcdSession({ sid: 'given' }).sid, 'given')
	})

	it('rejects invalid configuration with an actionable message', () => {
		const long = 'x'.repeat(65)
		throws(() => createCmcdSession({ sid: long }), { message: `CmcdSession: sid must be a string of at most 64 characters, received ${long}` })
		throws(() => createCmcdSession().createReporter({ cid: 'y'.repeat(129) }), { message: /^CmcdSession: cid must be a string of at most 128 characters/ })
		throws(() => createCmcdSession({ keys: ['br', 'nope' as never] }), { message: 'CmcdSession: keys must be reserved keys or hyphenated custom keys, received nope' })
		throws(() => createCmcdSession({ transmissionMode: 'json' }), { message: 'CmcdSession: transmissionMode must be query or headers, received json' })
		throws(() => createCmcdSession({ version: 3 as never }), { message: 'CmcdSession: version must be 1 or 2, received 3' })
		throws(() => createCmcdSession({ eventTargets: [{ url: '' }] }), { message: 'CmcdSession: eventTargets[0].url must be a non-empty string, received ' })
		throws(() => createCmcdSession({ eventTargets: [{ url: 'https://c.example', events: ['zz' as never] }] }), { message: 'CmcdSession: eventTargets[0].events must be event types, received zz' })
		throws(() => createCmcdSession({ eventTargets: [{ url: 'https://c.example', interval: -1 }] }), { message: 'CmcdSession: eventTargets[0].interval must be a finite number of seconds, 0 or more, received -1' })
		throws(() => createCmcdSession({ eventTargets: [{ url: 'https://c.example', batchSize: 0 }] }), { message: 'CmcdSession: eventTargets[0].batchSize must be a positive integer, received 0' })
		throws(() => createCmcdSession({ eventTargets: [{ url: 'https://c.example', batchSize: 1000 }] }), { message: 'CmcdSession: eventTargets[0].batchSize must be at most maxQueueSize (500), received 1000' })
		throws(() => createCmcdSession({ eventTargets: [{ url: 'https://c.example', maxQueueSize: 2.5 }] }), { message: 'CmcdSession: eventTargets[0].maxQueueSize must be a positive integer, received 2.5' })
		throws(() => createCmcdSession({ eventTargets: [{ url: 'https://c.example', version: 2 } as never] }), { message: 'CmcdSession: eventTargets[0].version must be absent, event mode is version 2, received 2' })
	})

	it('configure() replaces the request settings and keeps the counters', () => {
		const session = createCmcdSession({ sid: 's', keys: ['sid', 'sn'] })
		const reporter = session.createReporter()
		reporter.decorate({ url: 'https://cdn.example.com/a' })
		session.configure({ transmissionMode: CmcdTransmissionMode.HEADERS, keys: ['sid', 'sn', 'ot'] })
		const req = reporter.decorate({ url: 'https://cdn.example.com/b' }, { ot: 'v' })
		equal(req.url, 'https://cdn.example.com/b')
		deepEqual(req.headers, { 'CMCD-Object': 'ot=v', 'CMCD-Request': 'sn=1', 'CMCD-Session': 'sid="s",v=2' })
		throws(() => session.configure({ keys: ['bad key' as never] }), { message: 'CmcdSession: keys must be reserved keys or hyphenated custom keys, received bad key' })
	})
```

Add `CmcdTransmissionMode` to the value import and `deepEqual, throws` to the assert import of that file.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/createCmcdSession.test.ts`
Expected: FAIL, nothing throws.

- [ ] **Step 3: Write the checks**

```ts
// libs/cmcd/src/checkRequestSettings.ts
import { CMCD_KEY_SPECS } from './CMCD_KEY_SPECS.ts'
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { CMCD_HEADERS, CMCD_QUERY } from './CmcdTransmissionMode.ts'
import { getKeySpec } from './getKeySpec.ts'

/** The error every configuration check throws. */
export function configError(parameter: string, expected: string, received: unknown): Error {
	return new Error(`CmcdSession: ${parameter} must be ${expected}, received ${String(received)}`)
}

export function checkSid(sid: unknown): void {
	if (typeof sid !== 'string' || sid === '' || sid.length > 64) {
		throw configError('sid', 'a string of at most 64 characters', sid)
	}
}

export function checkCid(cid: unknown): void {
	if (typeof cid !== 'string' || cid.length > 128) {
		throw configError('cid', 'a string of at most 128 characters', cid)
	}
}

export function checkKeys(parameter: string, keys: readonly string[]): void {
	for (const key of keys) {
		if (getKeySpec(key) === undefined) {
			throw configError(parameter, 'reserved keys or hyphenated custom keys', key)
		}
	}
}

export function checkEvents(parameter: string, events: readonly string[]): void {
	const tokens = CMCD_KEY_SPECS['e'].tokens ?? []
	for (const event of events) {
		if (!tokens.includes(event)) {
			throw configError(parameter, 'event types', event)
		}
	}
}

/** The request-mode settings that `createCmcdSession()` and `configure()` share. */
export function checkRequestSettings(settings: Pick<CmcdSessionConfig, 'version' | 'transmissionMode' | 'keys' | 'headerMap'>): void {
	if (settings.version !== undefined && settings.version !== 1 && settings.version !== 2) {
		throw configError('version', '1 or 2', settings.version)
	}
	if (settings.transmissionMode !== undefined && settings.transmissionMode !== CMCD_QUERY && settings.transmissionMode !== CMCD_HEADERS) {
		throw configError('transmissionMode', 'query or headers', settings.transmissionMode)
	}
	if (settings.keys !== undefined) {
		checkKeys('keys', settings.keys)
	}
	if (settings.headerMap !== undefined) {
		for (const keys of Object.values(settings.headerMap)) {
			checkKeys('headerMap', keys ?? [])
		}
	}
}
```

`checkRequestSettings.ts` exports the checks together because they share `configError`.

- [ ] **Step 4: Call the checks**

In `libs/cmcd/src/normalizeSessionConfig.ts`, add the import `import { checkEvents, checkKeys, checkRequestSettings, checkSid, configError } from './checkRequestSettings.ts'` and replace `normalizeTarget` and the start of `normalizeSessionConfig` with:

```ts
function isPositiveInteger(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function normalizeTarget(target: CmcdEventTargetConfig, index: number): NormalizedEventTarget {
	const name = `eventTargets[${index}]`
	if (typeof target.url !== 'string' || target.url === '') {
		throw configError(`${name}.url`, 'a non-empty string', target.url)
	}
	if ('version' in target) {
		throw configError(`${name}.version`, 'absent, event mode is version 2', (target as { version?: unknown }).version)
	}
	if (target.events !== undefined) {
		checkEvents(`${name}.events`, target.events)
	}
	if (target.keys !== undefined) {
		checkKeys(`${name}.keys`, target.keys)
	}
	const interval = target.interval ?? CMCD_DEFAULT_TIME_INTERVAL
	if (typeof interval !== 'number' || !Number.isFinite(interval) || interval < 0) {
		throw configError(`${name}.interval`, 'a finite number of seconds, 0 or more', target.interval)
	}
	const maxQueueSize = target.maxQueueSize ?? 500
	if (!isPositiveInteger(maxQueueSize)) {
		throw configError(`${name}.maxQueueSize`, 'a positive integer', target.maxQueueSize)
	}
	const batchSize = target.batchSize ?? 1
	if (!isPositiveInteger(batchSize)) {
		throw configError(`${name}.batchSize`, 'a positive integer', target.batchSize)
	}
	if (batchSize > maxQueueSize) {
		throw configError(`${name}.batchSize`, `at most maxQueueSize (${maxQueueSize})`, batchSize)
	}
	return {
		url: target.url,
		events: new Set(target.events ?? DEFAULT_EVENTS),
		keys: target.keys === undefined ? undefined : new Set(target.keys),
		interval: interval * 1000,
		batchSize,
		maxQueueSize,
		headers: target.headers === undefined ? undefined : { ...target.headers },
		transform: target.transform,
	}
}

/** Applies the defaults and throws on the first invalid setting. */
export function normalizeSessionConfig(config: CmcdSessionConfig): NormalizedSessionConfig {
	if (config.sid !== undefined) {
		checkSid(config.sid)
	}
	checkRequestSettings(config)
	return {
```

The rest of the returned object stays as in Task 2, with `eventTargets: (config.eventTargets ?? []).map(normalizeTarget)`.

```ts
// libs/cmcd/src/configureSession.ts
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { checkRequestSettings } from './checkRequestSettings.ts'
import type { SessionState } from './SessionState.ts'

/** Replaces the request-mode settings. The request target reads them at the next `decorate()`. Nothing else changes. */
export function configureSession(state: SessionState, settings: Pick<CmcdSessionConfig, 'version' | 'transmissionMode' | 'keys' | 'headerMap'>): void {
	if (state.disposed) {
		return
	}
	checkRequestSettings(settings)
	if (settings.version !== undefined) {
		state.config.version = settings.version
	}
	if (settings.transmissionMode !== undefined) {
		state.config.transmissionMode = settings.transmissionMode
	}
	if (settings.keys !== undefined) {
		state.config.keys = new Set(settings.keys)
	}
	if (settings.headerMap !== undefined) {
		state.config.headerMap = settings.headerMap
	}
}
```

In `createCmcdSession.ts`, replace the inline `configure` body with `configure: settings => configureSession(state, settings),` and import `configureSession`. In `createSessionReporter.ts`, call `checkCid(config.cid)` at the top of `createSessionReporter` when `config.cid !== undefined`, and throw `configError('createReporter', 'a live session', 'a disposed session')` when `state.disposed`. Import both from `./checkRequestSettings.ts`.

- [ ] **Step 5: Run the tests**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/createCmcdSession.test.ts libs/cmcd/test/CmcdSessionReporter.request.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add libs/cmcd/src libs/cmcd/test
git commit -s -m "feat(cmcd): validate the session configuration and add configure()" -m "Co-Authored-By: Claude claude-fable-5-1 <noreply@anthropic.com>"
```

---

### Task 4: Event targets, interval reports, and delivery

**Files:**
- Create: `libs/cmcd/src/processQueue.ts`, `libs/cmcd/src/emitEvent.ts`, `libs/cmcd/src/tickTarget.ts`, `libs/cmcd/src/armTimers.ts`, `libs/cmcd/src/flushSession.ts`, `libs/cmcd/src/disposeSession.ts`, `libs/cmcd/src/reportSessionError.ts`
- Modify: `libs/cmcd/src/createCmcdSession.ts`
- Test: `libs/cmcd/test/CmcdSession.delivery.test.ts`

**Interfaces:**
- Produces: `emitEvent(session, reporter, event, data, request, ts): void` for Tasks 5 to 8, `processQueue(session, sidState, target, drain)`, `flushSession(state)`, `disposeSession(state)`, `reportSessionError(session, error)`.

Delivery semantics come from the design record's Delivery section. A batch is sent when the queue reaches `batchSize`, on a drain, or on a retry. A 2xx or 3xx response succeeds. A 410 silences the target for the `sid`. A 429, a 5xx, or a rejection retries with a doubling back-off from one second to a 60 second cap. Any other 4xx drops the batch.

- [ ] **Step 1: Write the failing tests**

```ts
// libs/cmcd/test/CmcdSession.delivery.test.ts
import { CMCD_MIME_TYPE, createCmcdSession } from '@svta/cml-cmcd'
import { deepEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'
import { EX_8_2_1 } from './data/CTA_5004_B_EXAMPLES.ts'
import { createMockRequester, flushPromises } from './helpers/cmcdSessionHarness.ts'

const COLLECTOR = 'https://collector.example.com/cmcd'
const TIMERS = { apis: ['Date', 'setTimeout', 'setInterval'] as ('Date' | 'setTimeout' | 'setInterval')[], now: 1764752370000 }

describe('CmcdSession delivery', () => {
	it('reproduces 8.2.1: a minimal t report after one interval', async (context) => {
		context.mock.timers.enable(TIMERS)
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 'session-id-123', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: [] }] })
		session.createReporter({ cid: 'content-id-123' })
		context.mock.timers.tick(29999)
		await flushPromises()
		equal(mock.requests.length, 0)
		context.mock.timers.tick(1)
		await flushPromises()
		deepEqual(mock.bodies(), [EX_8_2_1])
		equal(mock.requests[0].method, 'POST')
		equal(mock.requests[0].url, COLLECTOR)
		deepEqual(mock.requests[0].headers, { 'Content-Type': CMCD_MIME_TYPE })
		session.dispose()
	})

	it('emits one t line per live reporter, in creation order, with the same ts and consecutive sn', async (context) => {
		context.mock.timers.enable(TIMERS)
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['cid', 'sid', 'sn'], batchSize: 2 }] })
		session.createReporter({ cid: 'movie' })
		session.createReporter({ cid: 'ad' })
		context.mock.timers.tick(30000)
		await flushPromises()
		deepEqual(mock.bodies(), ['cid="movie",e=t,sid="s",sn=0,ts=1764752400000,v=2\ncid="ad",e=t,sid="s",sn=1,ts=1764752400000,v=2'])
		session.dispose()
	})

	it('emits a session-only line when the session has no reporter', async (context) => {
		context.mock.timers.enable(TIMERS)
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['sid'] }] })
		context.mock.timers.tick(30000)
		await flushPromises()
		deepEqual(mock.bodies(), ['e=t,sid="s",ts=1764752400000,v=2'])
		session.dispose()
	})

	it('honors interval, batchSize, headers, and flush()', async (context) => {
		context.mock.timers.enable(TIMERS)
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['sid'], interval: 10, batchSize: 3, headers: { Authorization: 'Bearer x' } }] })
		session.createReporter()
		context.mock.timers.tick(20000)
		await flushPromises()
		equal(mock.requests.length, 0)
		session.flush()
		await flushPromises()
		deepEqual(mock.bodies(), ['e=t,sid="s",ts=1764752380000,v=2\ne=t,sid="s",ts=1764752390000,v=2'])
		deepEqual(mock.requests[0].headers, { 'Content-Type': CMCD_MIME_TYPE, Authorization: 'Bearer x' })
		context.mock.timers.tick(30000)
		await flushPromises()
		equal(mock.requests.length, 2)
		session.dispose()
	})

	it('drains on dispose() and stops the timers', async (context) => {
		context.mock.timers.enable(TIMERS)
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['sid'], batchSize: 5 }] })
		session.createReporter()
		context.mock.timers.tick(30000)
		session.dispose()
		await flushPromises()
		equal(mock.requests.length, 1)
		context.mock.timers.tick(60000)
		await flushPromises()
		equal(mock.requests.length, 1)
	})

	it('disables t with interval 0', async (context) => {
		context.mock.timers.enable(TIMERS)
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, interval: 0 }] })
		session.createReporter()
		context.mock.timers.tick(120000)
		await flushPromises()
		equal(mock.requests.length, 0)
		session.dispose()
	})
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSession.delivery.test.ts`
Expected: FAIL, no request is sent.

- [ ] **Step 3: Write delivery**

```ts
// libs/cmcd/src/reportSessionError.ts
import type { SessionState } from './SessionState.ts'

/** Gives an error that has no caller to `onError`, or throws it from a timer callback when `onError` is absent. */
export function reportSessionError(session: SessionState, error: unknown): void {
	if (session.config.onError) {
		session.config.onError(error)
		return
	}
	setTimeout(() => {
		throw error
	}, 0)
}
```

```ts
// libs/cmcd/src/processQueue.ts
import type { HttpRequest } from '@svta/cml-utils'
import { CMCD_MIME_TYPE } from './CMCD_MIME_TYPE.ts'
import { reportSessionError } from './reportSessionError.ts'
import type { SessionState } from './SessionState.ts'
import type { SidState } from './SidState.ts'
import type { TargetState } from './TargetState.ts'

const BACK_OFF_CAP = 60000
const ATTEMPTS_TO_CAP = 7

function settle(session: SessionState, sidState: SidState, target: TargetState, batch: string[], status: number): void {
	const config = session.config.eventTargets[target.index]
	target.sending = false
	if (status >= 200 && status < 400) {
		target.attempt = 0
		if (target.queue.length === 0) {
			target.drainRequested = false
		}
		processQueue(session, sidState, target, false)
		return
	}
	if (status === 410) {
		target.gone = true
		target.queue.length = 0
		target.drainRequested = false
		return
	}
	if (status === 429 || status >= 500 || status === 0) {
		target.queue.unshift(...batch)
		if (target.queue.length > config.maxQueueSize) {
			target.queue.splice(0, target.queue.length - config.maxQueueSize)
		}
		target.attempt += 1
		if (sidState.ended && target.attempt > ATTEMPTS_TO_CAP) {
			target.queue.length = 0
			target.drainRequested = false
			reportSessionError(session, new Error(`CmcdSession: send failed for target ${config.url} after the back-off cap, status ${status}`))
			return
		}
		const delay = Math.min(1000 * 2 ** (target.attempt - 1), BACK_OFF_CAP)
		target.retryTimer = setTimeout(() => {
			target.retryTimer = undefined
			processQueue(session, sidState, target, true)
		}, delay)
		return
	}
	target.attempt = 0
	processQueue(session, sidState, target, false)
}

/**
 * Sends the next batch of one event target when the queue is ready. `drain` asks for the whole queue and is remembered
 * until the queue is empty, so a drain requested during a send is not lost.
 */
export function processQueue(session: SessionState, sidState: SidState, target: TargetState, drain: boolean): void {
	const config = session.config.eventTargets[target.index]
	if (!config) {
		return
	}
	if (drain) {
		target.drainRequested = true
	}
	if (target.gone || target.queue.length === 0 || target.sending || target.retryTimer !== undefined) {
		return
	}
	if (target.queue.length < config.batchSize && !target.drainRequested) {
		return
	}
	const batch = target.drainRequested ? target.queue.splice(0) : target.queue.splice(0, config.batchSize)
	const request: HttpRequest = {
		url: config.url,
		method: 'POST',
		headers: { 'Content-Type': CMCD_MIME_TYPE, ...(config.headers ?? {}) },
		body: batch.join('\n'),
	}
	target.sending = true
	let response: Promise<{ status: number }>
	try {
		response = session.config.requester(request)
	}
	catch {
		response = Promise.resolve({ status: 0 })
	}
	response.then(
		result => settle(session, sidState, target, batch, result.status),
		() => settle(session, sidState, target, batch, 0),
	)
}
```

```ts
// libs/cmcd/src/emitEvent.ts
import type { CmcdPlaybackData } from './CmcdPlaybackData.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import { assembleReport } from './assembleReport.ts'
import { emitReport } from './emitReport.ts'
import { processQueue } from './processQueue.ts'
import type { ReporterState } from './ReporterState.ts'
import type { SessionState } from './SessionState.ts'
import type { TargetState } from './TargetState.ts'

/**
 * Emits one event for one reporter to every event target of the current `sid` state that lists it.
 * The `sid` state is captured once, so a transform that rotates does not move the remaining targets.
 * The first error is rethrown after every target ran.
 */
export function emitEvent(session: SessionState, reporter: ReporterState, event: string, data: CmcdPlaybackData | undefined, request: Readonly<CmcdRequestLike> | undefined, ts: number): void {
	const sidState = session.current
	const targets: TargetState[] = []
	let failure: unknown
	let failed = false
	for (const target of sidState.eventTargets) {
		if (target.gone || !session.config.eventTargets[target.index].events.has(event)) {
			continue
		}
		try {
			const assembled = assembleReport(session, sidState, target, reporter, event, data, ts)
			emitReport(session, sidState, target, reporter, assembled, event, request)
			targets.push(target)
		}
		catch (error) {
			if (!failed) {
				failed = true
				failure = error
			}
		}
	}
	for (const target of targets) {
		processQueue(session, sidState, target, false)
	}
	if (failed) {
		throw failure
	}
}
```

```ts
// libs/cmcd/src/tickTarget.ts
import { CMCD_EVENT_TIME_INTERVAL } from './CmcdEventType.ts'
import { assembleReport } from './assembleReport.ts'
import { emitReport } from './emitReport.ts'
import { processQueue } from './processQueue.ts'
import { reportSessionError } from './reportSessionError.ts'
import type { SessionState } from './SessionState.ts'

/** One interval tick of one event target: one `t` line per live reporter, or one session-only line. */
export function tickTarget(session: SessionState, index: number): void {
	if (session.disposed) {
		return
	}
	const sidState = session.current
	const target = sidState.eventTargets[index]
	if (!target || target.gone) {
		return
	}
	const ts = Date.now()
	const reporters = session.reporters.size > 0 ? [...session.reporters] : [undefined]
	let failure: unknown
	let failed = false
	for (const reporter of reporters) {
		try {
			const assembled = assembleReport(session, sidState, target, reporter, CMCD_EVENT_TIME_INTERVAL, undefined, ts)
			emitReport(session, sidState, target, reporter, assembled, CMCD_EVENT_TIME_INTERVAL, undefined)
		}
		catch (error) {
			if (!failed) {
				failed = true
				failure = error
			}
		}
	}
	processQueue(session, sidState, target, false)
	if (failed) {
		reportSessionError(session, failure)
	}
}
```

```ts
// libs/cmcd/src/armTimers.ts
import { CMCD_EVENT_TIME_INTERVAL } from './CmcdEventType.ts'
import type { SessionState } from './SessionState.ts'
import { tickTarget } from './tickTarget.ts'

/** One interval timer per event target that lists `t` with an interval over zero. */
export function armTimers(session: SessionState): void {
	session.config.eventTargets.forEach((target, index) => {
		if (target.interval > 0 && target.events.has(CMCD_EVENT_TIME_INTERVAL)) {
			session.timers.push(setInterval(() => tickTarget(session, index), target.interval))
		}
	})
}
```

```ts
// libs/cmcd/src/flushSession.ts
import { processQueue } from './processQueue.ts'
import type { SessionState } from './SessionState.ts'

/** Sends every queued line of the current `sid` state now. An armed retry fires at once. */
export function flushSession(session: SessionState): void {
	if (session.disposed) {
		return
	}
	for (const target of session.current.eventTargets) {
		if (target.retryTimer !== undefined) {
			clearTimeout(target.retryTimer)
			target.retryTimer = undefined
		}
		processQueue(session, session.current, target, true)
	}
}
```

```ts
// libs/cmcd/src/disposeSession.ts
import { processQueue } from './processQueue.ts'
import type { SessionState } from './SessionState.ts'

/** Ends the session: timers off, reporters disposed, the current `sid` state ended, every queue drained. */
export function disposeSession(session: SessionState): void {
	if (session.disposed) {
		return
	}
	session.disposed = true
	for (const timer of session.timers) {
		clearInterval(timer)
	}
	session.timers.length = 0
	session.stopVisibility?.()
	session.stopVisibility = undefined
	for (const reporter of session.reporters) {
		reporter.disposed = true
	}
	const sidState = session.current
	sidState.ended = true
	for (const target of sidState.eventTargets) {
		if (target.retryTimer !== undefined) {
			clearTimeout(target.retryTimer)
			target.retryTimer = undefined
		}
		processQueue(session, sidState, target, true)
	}
}
```

In `createCmcdSession.ts`: import `armTimers`, `flushSession`, and `disposeSession`. Call `armTimers(state)` before `return session`. Replace the `flush` and `dispose` members with `flush: () => flushSession(state),` and `dispose: () => disposeSession(state),`.

- [ ] **Step 4: Run the tests**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSession.delivery.test.ts && npm run typecheck`
Expected: PASS. If the batching test sends after the second tick, check that `processQueue` compares `queue.length < batchSize` before splicing.

- [ ] **Step 5: Commit**

```bash
git add libs/cmcd/src libs/cmcd/test
git commit -s -m "feat(cmcd): add event targets, interval reports, and delivery to the session API" -m "Co-Authored-By: Claude claude-fable-5-1 <noreply@anthropic.com>"
```

---

### Task 5: State-change events, discrete events, and errors

**Files:**
- Create: `libs/cmcd/src/deriveStateEvents.ts`
- Modify: `libs/cmcd/src/createSessionReporter.ts`
- Test: `libs/cmcd/test/CmcdSessionReporter.events.test.ts`

**Interfaces:**
- Consumes: `emitEvent()` from Task 4, `mergeUpdate()` from Task 2.
- Produces: `deriveStateEvents(session, reporter, ts)`. Task 7 adds the `bg` comparison to it.

`update()` emits `ps` for `sta`, `pr` for `pr` while playing, `c` for `cid`, and `bc` for `br`. Each fires when the value differs from the last value that reporter reported. `recordEvent()` emits one discrete event with per-call data. `recordError()` buffers the codes on every target and emits `e`.

- [ ] **Step 1: Write the failing tests**

```ts
// libs/cmcd/test/CmcdSessionReporter.events.test.ts
import type { CmcdEventType, CmcdKey } from '@svta/cml-cmcd'
import { createCmcdSession } from '@svta/cml-cmcd'
import { deepEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'
import { EX_8_2_4, EX_8_2_6, EX_8_2_7, EX_8_2_8 } from './data/CTA_5004_B_EXAMPLES.ts'
import { createMockRequester, flushPromises } from './helpers/cmcdSessionHarness.ts'

const COLLECTOR = 'https://collector.example.com/cmcd'

function harness(events: CmcdEventType[], keys: CmcdKey[], cid: string | undefined = 'content-id-123') {
	const mock = createMockRequester()
	const session = createCmcdSession({ sid: 'session-id-123', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events, keys, interval: 0 }] })
	const reporter = session.createReporter(cid === undefined ? {} : { cid })
	return { mock, session, reporter }
}

describe('CmcdSessionReporter events', () => {
	it('reproduces 8.2.4: recordError emits e with the codes', async () => {
		const { mock, reporter } = harness(['e'], ['cid', 'ec', 'sid'])
		reporter.recordError('CODEC_NOT_SUPPORTED', { ts: 1764269150213 })
		await flushPromises()
		deepEqual(mock.bodies(), [EX_8_2_4])
	})

	it('reproduces 8.2.6: a play-state change reports the merged store', async () => {
		const { mock, reporter } = harness(['ps'], ['bl', 'cid', 'pt', 'sid', 'sta'])
		reporter.update({ sta: 'k', bl: 0, pt: 30000, ts: 1764269150529 })
		await flushPromises()
		deepEqual(mock.bodies(), [EX_8_2_6])
	})

	it('reproduces 8.2.7 and 8.2.8: discrete events with per-call data', async () => {
		const { mock, reporter } = harness(['sk', 'abs', 'as', 'ae', 'abe'], ['cid', 'nr', 'sid'], 'movie-123')
		reporter.recordEvent('sk', { cid: 'ad-content-555', ts: 1764269150076 })
		reporter.recordEvent('abs', { nr: true, ts: 1764269150186 })
		reporter.recordEvent('as', { cid: 'ad-001', ts: 1764269150934 })
		reporter.recordEvent('ae', { cid: 'ad-001', nr: true, ts: 1764269170901 })
		reporter.recordEvent('abe', { ts: 1764269170331 })
		await flushPromises()
		deepEqual(mock.bodies(), [EX_8_2_7, ...EX_8_2_8])
	})

	it('dedups state-change events and fires pr only while playing', async () => {
		const { mock, reporter } = harness(['ps', 'pr', 'bc', 'c'], ['br', 'cid', 'pr', 'sid', 'sta'], undefined)
		reporter.update({ sta: 'p', ts: 1 })
		reporter.update({ sta: 'p', ts: 2 })
		reporter.update({ pr: 2, ts: 3 })
		reporter.update({ sta: 'a', ts: 4 })
		reporter.update({ pr: 1, ts: 5 })
		reporter.update({ sta: 'p', ts: 6 })
		reporter.update({ br: { v: 3000 }, ts: 7 })
		reporter.update({ br: { v: 3000 }, ts: 8 })
		reporter.update({ br: { v: 3000, a: 128 }, ts: 9 })
		reporter.update({ cid: 'next', ts: 10 })
		await flushPromises()
		deepEqual(mock.bodies(), [
			'e=ps,sid="session-id-123",sta=p,ts=1,v=2',
			'e=pr,pr=2,sid="session-id-123",sta=p,ts=3,v=2',
			'e=ps,pr=2,sid="session-id-123",sta=a,ts=4,v=2',
			'e=ps,sid="session-id-123",sta=p,ts=6,v=2',
			'e=pr,pr=1,sid="session-id-123",sta=p,ts=6,v=2',
			'br=(3000;v),e=bc,sid="session-id-123",sta=p,ts=7,v=2',
			'br=(3000;v 128;a),e=bc,sid="session-id-123",sta=p,ts=9,v=2',
			'br=(3000;v 128;a),cid="next",e=c,sid="session-id-123",sta=p,ts=10,v=2',
		])
	})

	it('does not emit c for the cid given at creation, and emits ce with cen', async () => {
		const { mock, reporter } = harness(['c', 'ce'], ['cen', 'cid', 'sid'])
		reporter.update({ sf: 'd' })
		reporter.recordEvent('ce', { cen: 'seek-ui', ts: 5 })
		await flushPromises()
		deepEqual(mock.bodies(), ['cen="seek-ui",cid="content-id-123",e=ce,sid="session-id-123",ts=5,v=2'])
	})

	it('buffers error codes for a target that does not list e until its next report', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setInterval', 'setTimeout'], now: 1000 })
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [
			{ url: `${COLLECTOR}/errors`, events: ['e'], keys: ['ec', 'sid'] },
			{ url: `${COLLECTOR}/interval`, events: ['t'], keys: ['ec', 'sid'], interval: 1 },
		] })
		const reporter = session.createReporter()
		reporter.recordError(['E1', 'E2'])
		await flushPromises()
		deepEqual(mock.bodies(), ['e=e,ec=("E1" "E2"),sid="s",ts=1000,v=2'])
		context.mock.timers.tick(1000)
		await flushPromises()
		equal(mock.bodies()[1], 'e=t,ec=("E1" "E2"),sid="s",ts=2000,v=2')
		context.mock.timers.tick(1000)
		await flushPromises()
		equal(mock.bodies()[2], 'e=t,sid="s",ts=3000,v=2')
		session.dispose()
	})
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSessionReporter.events.test.ts`
Expected: FAIL, no body is sent.

- [ ] **Step 3: Write the diff**

```ts
// libs/cmcd/src/deriveStateEvents.ts
import { CMCD_EVENT_BITRATE_CHANGE, CMCD_EVENT_CONTENT_ID, CMCD_EVENT_PLAY_STATE, CMCD_EVENT_PLAYBACK_RATE } from './CmcdEventType.ts'
import { emitEvent } from './emitEvent.ts'
import type { ReporterState } from './ReporterState.ts'
import type { SessionState } from './SessionState.ts'

/** Two metric values are the same when they are the same number, or records with the same entries. */
export function sameMetric(a: unknown, b: unknown): boolean {
	if (a === b) {
		return true
	}
	if (!a || !b || typeof a !== 'object' || typeof b !== 'object') {
		return false
	}
	const left = a as Record<string, unknown>
	const right = b as Record<string, unknown>
	const keys = Object.keys(left)
	return keys.length === Object.keys(right).length && keys.every(key => left[key] === right[key])
}

/**
 * Emits the state-change events the store implies, in the order `sta`, `pr`, `cid`, `br`. A field emits when its
 * value is defined and differs from the last value this reporter reported. `pr` emits only while `sta` is `p`.
 */
export function deriveStateEvents(session: SessionState, reporter: ReporterState, ts: number): void {
	const { store, reported } = reporter
	if (store['sta'] !== undefined && store['sta'] !== reported.sta) {
		reported.sta = store['sta']
		emitEvent(session, reporter, CMCD_EVENT_PLAY_STATE, undefined, undefined, ts)
	}
	if (store['sta'] === 'p' && store['pr'] !== undefined && store['pr'] !== reported.pr) {
		reported.pr = store['pr']
		emitEvent(session, reporter, CMCD_EVENT_PLAYBACK_RATE, undefined, undefined, ts)
	}
	if (store['cid'] !== undefined && store['cid'] !== reported.cid) {
		reported.cid = store['cid']
		emitEvent(session, reporter, CMCD_EVENT_CONTENT_ID, undefined, undefined, ts)
	}
	if (store['br'] !== undefined && !sameMetric(store['br'], reported.br)) {
		reported.br = typeof store['br'] === 'object' ? { ...(store['br'] as Record<string, unknown>) } : store['br']
		emitEvent(session, reporter, CMCD_EVENT_BITRATE_CHANGE, undefined, undefined, ts)
	}
}
```

- [ ] **Step 4: Wire the reporter methods**

In `libs/cmcd/src/createSessionReporter.ts`, import `deriveStateEvents` from `./deriveStateEvents.ts`, `emitEvent` from `./emitEvent.ts`, `CMCD_EVENT_ERROR` from `./CmcdEventType.ts`, and `CmcdDiscreteEventType` as a type. Replace `update`, `recordEvent`, and `recordError`:

```ts
		update(data) {
			if (reporter.disposed || state.disposed) {
				return
			}
			const ts = mergeUpdate(state, reporter, data)
			deriveStateEvents(state, reporter, ts)
		},
		recordEvent(type: CmcdDiscreteEventType, data?: CmcdPlaybackData) {
			if (reporter.disposed || state.disposed) {
				return
			}
			emitEvent(state, reporter, type, data, undefined, typeof data?.ts === 'number' ? data.ts : Date.now())
		},
		recordError(code, data) {
			if (reporter.disposed || state.disposed) {
				return
			}
			const codes = (typeof code === 'string' ? [code] : [...code]).filter(item => item !== '')
			const sidState = state.current
			for (const target of [sidState.requestTarget, ...sidState.eventTargets]) {
				getTargetEntry(target, reporter).ec.push(...codes)
			}
			emitEvent(state, reporter, CMCD_EVENT_ERROR, data, undefined, typeof data?.ts === 'number' ? data.ts : Date.now())
		},
```

- [ ] **Step 5: Run the tests**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSessionReporter.events.test.ts libs/cmcd/test/CmcdSessionReporter.request.test.ts && npm run typecheck`
Expected: PASS. The request-mode tests still pass, because a session without event targets emits nothing.

- [ ] **Step 6: Commit**

```bash
git add libs/cmcd/src libs/cmcd/test
git commit -s -m "feat(cmcd): derive state-change events and record discrete events and errors in the session API" -m "Co-Authored-By: Claude claude-fable-5-1 <noreply@anthropic.com>"
```

---

### Task 6: Transition-derived keys

**Files:**
- Create: `libs/cmcd/src/trackTransition.ts`
- Modify: `libs/cmcd/src/createSessionReporter.ts`
- Test: `libs/cmcd/test/CmcdSessionReporter.derived.test.ts`

**Interfaces:**
- Consumes: `addSpan()` from `pruneSpans.ts`, `getTargetEntry()`.
- Produces: `trackTransition(session, reporter, previous, next, ts)`. Task 9 reuses the `bs` and span rules in `rotate()`.

The `sta` transitions derive `msd`, `bs`, `bsa`, `bsda`, `bsd`, and `su`. `dl` is derived at assembly and was written in Task 2. The rules are the transition table of the design record. `bsd` is one stall per entry: each destination receives each completed stall once, in order, at most one entry per cause per report, never summed.

- [ ] **Step 1: Write the failing tests**

```ts
// libs/cmcd/test/CmcdSessionReporter.derived.test.ts
import type { CmcdSession, CmcdSessionReporter } from '@svta/cml-cmcd'
import { createCmcdSession } from '@svta/cml-cmcd'
import { deepEqual, equal } from 'node:assert'
import { describe, it, type TestContext } from 'node:test'
import { EX_8_1_4, EX_8_2_2, EX_8_2_5 } from './data/CTA_5004_B_EXAMPLES.ts'
import { createMockRequester, flushPromises, queryValue } from './helpers/cmcdSessionHarness.ts'

const COLLECTOR = 'https://collector.example.com/cmcd'
const CDN = 'https://cdn.example.com'
const KEYS_8_2_2 = ['bl', 'br', 'bs', 'bsd', 'cid', 'ec', 'h', 'lb', 'msd', 'mtp', 'pb', 'pr', 'pt', 'sf', 'sid', 'sn', 'st', 'sta', 'su', 'tb', 'tpb'] as const

/** The example numbers its reports from 1. The reporter numbers from 0, per the reset-to-zero rule. */
function fromZero(line: string): string {
	return line.replace(/sn=(\d+)/, (_, n: string) => `sn=${Number(n) - 1}`)
}

/** Drives the player state of example 8.2.2 through five interval ticks. */
async function runExample822(context: TestContext, session: CmcdSession, reporter: CmcdSessionReporter): Promise<void> {
	reporter.update({ h: 'example.com', sf: 'd', st: 'v' })
	reporter.update({ sta: 's', bl: 0, pt: 0, ts: 1764752399000 })
	context.mock.timers.tick(30000)
	reporter.update({ sta: 'p', ts: 1764752399812 })
	reporter.update({ bl: 6000, br: { v: 4200, a: 256 }, lb: { v: 523, a: 64 }, mtp: { v: 87000, a: 49000 }, pb: { v: 4200, a: 256 }, pt: 29188, tb: { v: 4200, a: 256 }, tpb: { v: 4200, a: 256 } })
	context.mock.timers.tick(30000)
	reporter.update({ sta: 'r', ts: 1764752458000 })
	reporter.update({ bsd: { v: 720 } })
	reporter.update({ sta: 'p', ts: 1764752458720 })
	reporter.recordError('MEDIA_ERR_NETWORK')
	reporter.update({ bl: 3200, mtp: { v: 89000, a: 52000 }, pt: 59188 })
	context.mock.timers.tick(30000)
	reporter.update({ bl: 6000, mtp: { v: 81000, a: 55000 }, pt: 89188 })
	context.mock.timers.tick(30000)
	reporter.update({ sta: 'e', pr: 0, bl: 0, mtp: { v: 82000, a: 55000 }, pt: 111000 })
	context.mock.timers.tick(30000)
	await flushPromises()
	session.dispose()
}

describe('CmcdSessionReporter derived keys', () => {
	it('reproduces 8.1.4: su until playing, msd once', () => {
		const session = createCmcdSession({ sid: 'session-id-123', keys: ['bl', 'br', 'cid', 'd', 'msd', 'mtp', 'nor', 'ot', 'sf', 'sid', 'st', 'sta', 'su'] })
		const reporter = session.createReporter({ cid: 'content-id-123' })
		reporter.update({ sf: 'd', st: 'v' })
		equal(queryValue(reporter.decorate({ url: `${CDN}/manifest.mpd` }, { ot: 'm', su: true }).url), EX_8_1_4[0])
		reporter.update({ sta: 's', bl: 0, mtp: 15000, ts: 1000 })
		equal(queryValue(reporter.decorate({ url: `${CDN}/init.m4v` }, { br: { v: 3000 }, nor: [`${CDN}/seg-1.m4v`, `${CDN}/seg-2.m4v`], ot: 'i' }).url), EX_8_1_4[1])
		equal(queryValue(reporter.decorate({ url: `${CDN}/seg-1.m4v` }, { br: { v: 3000 }, d: 4000, nor: [`${CDN}/seg-2.m4v`, `${CDN}/seg-3.m4v`], ot: 'v' }).url), EX_8_1_4[2])
		reporter.update({ sta: 'p', bl: 4000, ts: 1200 })
		equal(queryValue(reporter.decorate({ url: `${CDN}/seg-2.m4v` }, { br: { v: 3000 }, d: 4000, nor: [`${CDN}/seg-3.m4v`, `${CDN}/seg-4.m4v`], ot: 'v' }).url), EX_8_1_4[3])
		equal(queryValue(reporter.decorate({ url: `${CDN}/seg-3.m4v` }, { ot: 'v' }).url).includes('msd'), false)
	})

	it('reproduces 8.2.2: five interval reports', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setInterval', 'setTimeout'], now: 1764752370000 })
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 'session-id-123', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: [...KEYS_8_2_2] }] })
		await runExample822(context, session, session.createReporter({ cid: 'content-id-123' }))
		deepEqual(mock.bodies(), EX_8_2_2.map(fromZero))
	})

	it('reproduces 8.3: the first three reports of 8.2.2 in one batch', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setInterval', 'setTimeout'], now: 1764752370000 })
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 'session-id-123', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: [...KEYS_8_2_2], batchSize: 3 }] })
		await runExample822(context, session, session.createReporter({ cid: 'content-id-123' }))
		equal(mock.bodies()[0], EX_8_2_2.slice(0, 3).map(fromZero).join('\n'))
	})

	it('reproduces 8.2.5: bs while rebuffering and bsd on recovery', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 'session-id-123', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['bs', 'bsd', 'cid', 'sid', 'sta'], interval: 0 }] })
		const reporter = session.createReporter({ cid: 'content-id-123' })
		reporter.update({ sta: 'r', ts: 1764269150889 })
		reporter.update({ sta: 'p', ts: 1764269152389 })
		await flushPromises()
		deepEqual(mock.bodies(), EX_8_2_5)
	})

	it('keeps bs set during a stall and once after recovery, per destination', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setInterval', 'setTimeout'], now: 1000 })
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['bs', 'sid', 'sta'], interval: 1 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p' })
		reporter.update({ sta: 'r' })
		context.mock.timers.tick(1000)
		context.mock.timers.tick(1000)
		reporter.update({ sta: 'p' })
		context.mock.timers.tick(1000)
		context.mock.timers.tick(1000)
		await flushPromises()
		deepEqual(mock.bodies(), [
			'bs,e=t,sid="s",sta=r,ts=2000,v=2',
			'bs,e=t,sid="s",sta=r,ts=3000,v=2',
			'bs,e=t,sid="s",sta=p,ts=4000,v=2',
			'e=t,sid="s",sta=p,ts=5000,v=2',
		])
		session.dispose()
	})

	it('reports one stall per bsd entry, one per cause per report, in order', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setInterval', 'setTimeout'], now: 1000 })
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['bsa', 'bsd', 'bsda', 'sid'], interval: 1 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1000 })
		reporter.update({ sta: 'r', ts: 1000 })
		reporter.update({ sta: 'p', ts: 1300 })
		reporter.update({ sta: 'r', ts: 1400 })
		reporter.update({ sta: 'p', ts: 2100 })
		context.mock.timers.tick(1000)
		context.mock.timers.tick(1000)
		context.mock.timers.tick(1000)
		await flushPromises()
		deepEqual(mock.bodies(), [
			'bsa=(2),bsd=(300),bsda=(1000),e=t,sid="s",ts=2000,v=2',
			'bsa=(2),bsd=(700),bsda=(1000),e=t,sid="s",ts=3000,v=2',
			'bsa=(2),bsda=(1000),e=t,sid="s",ts=4000,v=2',
		])
		session.dispose()
	})

	it('treats a supplied bsd as pending samples per cause and stops automatic detection', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setInterval', 'setTimeout'], now: 1000 })
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['bsd', 'sid'], interval: 1 }] })
		const reporter = session.createReporter()
		reporter.update({ bsd: { v: 100, a: 50 } })
		reporter.update({ bsd: { v: 200 } })
		reporter.update({ sta: 'r', ts: 1000 })
		reporter.update({ sta: 'p', ts: 1900 })
		context.mock.timers.tick(1000)
		context.mock.timers.tick(1000)
		context.mock.timers.tick(1000)
		await flushPromises()
		deepEqual(mock.bodies(), [
			'bsd=(100;v 50;a),e=t,sid="s",ts=2000,v=2',
			'bsd=(200;v),e=t,sid="s",ts=3000,v=2',
			'e=t,sid="s",ts=4000,v=2',
		])
		session.dispose()
	})

	it('caps the pending samples at 100 per cause', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setInterval', 'setTimeout'], now: 1000 })
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['bsd', 'sid'], interval: 1 }] })
		const reporter = session.createReporter()
		let ts = 1000
		for (let i = 1; i <= 101; i++) {
			reporter.update({ sta: 'r', ts })
			ts += i * 10
			reporter.update({ sta: 'p', ts })
		}
		context.mock.timers.tick(1000)
		await flushPromises()
		equal(mock.bodies()[0], 'bsd=(20),e=t,sid="s",ts=2000,v=2')
		session.dispose()
	})

	it('keeps no samples when no destination can report bsd', () => {
		const session = createCmcdSession({ sid: 's', version: 1 })
		const reporter = session.createReporter()
		reporter.update({ sta: 'r', ts: 1000 })
		reporter.update({ sta: 'p', ts: 1500 })
		session.configure({ version: 2, keys: ['bsd', 'sid'] })
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'sid="s",v=2')
	})

	it('derives dl from bl and pr, and the derive switches turn su and dl off', () => {
		const session = createCmcdSession({ sid: 's', keys: ['dl', 'sid', 'su'] })
		const reporter = session.createReporter()
		reporter.update({ sta: 's', bl: 3250, pr: 1 })
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'dl=3300,sid="s",su,v=2')
		reporter.update({ sta: 'p', bl: 3200, pr: 2 })
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'dl=1600,sid="s",v=2')
		reporter.update({ dl: 500 })
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'dl=500,sid="s",v=2')

		const off = createCmcdSession({ sid: 's', keys: ['dl', 'sid', 'su'], derive: { dl: false, su: false } })
		const quiet = off.createReporter()
		quiet.update({ sta: 's', bl: 3200 })
		equal(queryValue(quiet.decorate({ url: `${CDN}/a` }).url), 'sid="s",v=2')
	})
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSessionReporter.derived.test.ts`
Expected: FAIL on `msd`, `bs`, `bsd`, and `su`. The `dl` assertions may already pass.

- [ ] **Step 3: Write the transition tracking**

```ts
// libs/cmcd/src/trackTransition.ts
import { getTargetEntry } from './getTargetEntry.ts'
import { addSpan } from './pruneSpans.ts'
import type { ReporterState } from './ReporterState.ts'
import type { SessionState } from './SessionState.ts'

/**
 * The effects of a `sta` transition, per the design record's transition table. Runs before the state-change diff,
 * so the `ps` report carries what the transition derived.
 */
export function trackTransition(session: SessionState, reporter: ReporterState, previous: unknown, next: unknown, ts: number): void {
	const sidState = session.current
	if (next === 's' && sidState.msdStart === undefined) {
		sidState.msdStart = ts
	}
	if (next === 'p' && sidState.msdStart !== undefined && sidState.msd === undefined && !sidState.msdSupplied) {
		sidState.msd = Math.max(0, ts - sidState.msdStart)
	}
	if (next === 'r') {
		reporter.spanOpenedAt = ts
		if (sidState.bsaSupplied === undefined) {
			sidState.bsa += 1
		}
		for (const target of [sidState.requestTarget, ...sidState.eventTargets]) {
			getTargetEntry(target, reporter).bs = true
		}
	}
	if (previous === 'r' && next !== 'r' && reporter.spanOpenedAt !== undefined) {
		const duration = Math.max(0, ts - reporter.spanOpenedAt)
		reporter.spanOpenedAt = undefined
		if (sidState.bsdaSupplied === undefined) {
			sidState.bsda += duration
		}
		if (!sidState.bsdSupplied) {
			addSpan(session, sidState, '', duration)
		}
	}
	if (next === 's' || next === 'k' || next === 'r') {
		reporter.su = true
	}
	else if (next === 'p') {
		reporter.su = false
	}
}
```

In `libs/cmcd/src/createSessionReporter.ts`, import `trackTransition` and replace `update`:

```ts
		update(data) {
			if (reporter.disposed || state.disposed) {
				return
			}
			const previous = reporter.store['sta']
			const ts = mergeUpdate(state, reporter, data)
			const next = reporter.store['sta']
			if (data.sta !== undefined && next !== previous) {
				trackTransition(state, reporter, previous, next, ts)
			}
			deriveStateEvents(state, reporter, ts)
		},
```

- [ ] **Step 4: Run the tests**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSessionReporter.derived.test.ts libs/cmcd/test/CmcdSessionReporter.events.test.ts libs/cmcd/test/CmcdSessionReporter.request.test.ts && npm run typecheck`
Expected: PASS. If 8.2.2 line 3 lacks `bs`, check that `emitReport` clears the flag only when `store.sta` is not `r`. If it shows `bsd=(720 720;v)`, the supplied `bsd` did not stop automatic detection: `bsdSupplied` must be set in `writeSessionFact`.

- [ ] **Step 5: Commit**

```bash
git add libs/cmcd/src libs/cmcd/test
git commit -s -m "feat(cmcd): derive msd, bs, bsa, bsda, bsd, and su from the play state in the session API" -m "Co-Authored-By: Claude claude-fable-5-1 <noreply@anthropic.com>"
```

---

### Task 7: Host and background derivation

**Files:**
- Create: `libs/cmcd/src/observeVisibility.ts`, `libs/cmcd/src/emitBackgroundChange.ts`
- Modify: `libs/cmcd/src/emitEvent.ts`, `libs/cmcd/src/deriveStateEvents.ts`, `libs/cmcd/src/createSessionReporter.ts`, `libs/cmcd/src/createCmcdSession.ts`
- Test: `libs/cmcd/test/CmcdSessionReporter.derived.test.ts` (new `describe` block)

**Interfaces:**
- Produces: `emitBackgroundChange(session, ts)`, `observeVisibility(onChange): (() => void) | undefined`. `emitEvent()` now accepts `reporter: ReporterState | undefined` for session-only lines.

`h` is the hostname of the decorated request URL. A change emits an `h` event and later event reports carry `h`. A pushed `h` wins and stops tracking. `bg` comes from `document.visibilityState` when `derive.bg` is on. Hidden emits `b` with `bg`, visible emits a bare `b`, one line per live reporter. A pushed `bg` wins and stops the listener. The session takes the initial visibility without emitting.

- [ ] **Step 1: Write the failing tests**

Append a second `describe` to `libs/cmcd/test/CmcdSessionReporter.derived.test.ts`:

```ts
type FakeDocument = { visibilityState: string; readonly listeners: Set<() => void>; addEventListener(type: string, listener: () => void): void; removeEventListener(type: string, listener: () => void): void }

function installDocument(context: TestContext, visibilityState: string): FakeDocument {
	const fake: FakeDocument = {
		visibilityState,
		listeners: new Set(),
		addEventListener: (_type, listener) => fake.listeners.add(listener),
		removeEventListener: (_type, listener) => fake.listeners.delete(listener),
	}
	const globals = globalThis as { document?: unknown }
	globals.document = fake
	context.after(() => {
		delete globals.document
	})
	return fake
}

describe('CmcdSessionReporter host and background', () => {
	it('emits h when the request host changes, and event reports carry h', async (context) => {
		context.mock.timers.enable({ apis: ['Date'], now: 1000 })
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['h', 'ps'], keys: ['h', 'sid'], interval: 0 }] })
		const reporter = session.createReporter()
		reporter.decorate({ url: 'https://a.example.com/seg-1.m4s' })
		reporter.decorate({ url: 'https://a.example.com/seg-2.m4s' })
		reporter.decorate({ url: 'https://b.example.com/seg-3.m4s' })
		reporter.update({ sta: 'p', ts: 5 })
		await flushPromises()
		deepEqual(mock.bodies(), [
			'e=h,h="a.example.com",sid="s",ts=1000,v=2',
			'e=h,h="b.example.com",sid="s",ts=1000,v=2',
			'e=ps,h="b.example.com",sid="s",sta=p,ts=5,v=2',
		])
		equal(queryValue(reporter.decorate({ url: 'https://b.example.com/seg-4.m4s' }).url).includes('h='), false)
	})

	it('a pushed h wins and stops tracking', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['h', 'ps'], keys: ['h', 'sid'], interval: 0 }] })
		const reporter = session.createReporter()
		reporter.update({ h: 'cdn.example' })
		reporter.decorate({ url: 'https://a.example.com/seg-1.m4s' })
		reporter.update({ sta: 'p', ts: 5 })
		await flushPromises()
		deepEqual(mock.bodies(), ['e=ps,h="cdn.example",sid="s",sta=p,ts=5,v=2'])
	})

	it('derives bg from document visibility, one b line per reporter', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setInterval', 'setTimeout'], now: 1000 })
		const fake = installDocument(context, 'visible')
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['b', 't'], keys: ['bg', 'cid', 'sid'], interval: 1 }] })
		session.createReporter({ cid: 'a' })
		session.createReporter({ cid: 'b' })
		equal(fake.listeners.size, 1)
		fake.visibilityState = 'hidden'
		fake.listeners.forEach(listener => listener())
		context.mock.timers.tick(1000)
		fake.visibilityState = 'visible'
		fake.listeners.forEach(listener => listener())
		context.mock.timers.tick(1000)
		await flushPromises()
		deepEqual(mock.bodies(), [
			'bg,cid="a",e=b,sid="s",ts=1000,v=2',
			'bg,cid="b",e=b,sid="s",ts=1000,v=2',
			'bg,cid="a",e=t,sid="s",ts=2000,v=2',
			'bg,cid="b",e=t,sid="s",ts=2000,v=2',
			'cid="a",e=b,sid="s",ts=2000,v=2',
			'cid="b",e=b,sid="s",ts=2000,v=2',
			'cid="a",e=t,sid="s",ts=3000,v=2',
			'cid="b",e=t,sid="s",ts=3000,v=2',
		])
		session.dispose()
		equal(fake.listeners.size, 0)
	})

	it('takes the initial visibility without emitting, and a pushed bg stops the listener', async (context) => {
		context.mock.timers.enable({ apis: ['Date'], now: 1000 })
		const fake = installDocument(context, 'hidden')
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['b', 'ps'], keys: ['bg', 'sid'], interval: 0 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1 })
		reporter.update({ bg: false, ts: 2 })
		equal(fake.listeners.size, 0)
		fake.visibilityState = 'visible'
		await flushPromises()
		deepEqual(mock.bodies(), ['bg,e=ps,sid="s",sta=p,ts=1,v=2', 'e=b,sid="s",ts=2,v=2'])
	})

	it('installs no listener with derive.bg off', (context) => {
		const fake = installDocument(context, 'visible')
		const session = createCmcdSession({ sid: 's', derive: { bg: false } })
		equal(fake.listeners.size, 0)
		session.dispose()
	})
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSessionReporter.derived.test.ts`
Expected: FAIL, no `h` and no `b` lines.

- [ ] **Step 3: Write the visibility observer and the background event**

```ts
// libs/cmcd/src/observeVisibility.ts
/**
 * Listens to `visibilitychange` when a document exists. Returns the function that removes the listener,
 * or `undefined` outside a document. Does not call `onChange` for the initial state.
 */
export function observeVisibility(onChange: (hidden: boolean) => void): (() => void) | undefined {
	if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') {
		return undefined
	}
	const listener = (): void => onChange(document.visibilityState === 'hidden')
	document.addEventListener('visibilitychange', listener)
	return () => document.removeEventListener('visibilitychange', listener)
}
```

```ts
// libs/cmcd/src/emitBackgroundChange.ts
import { CMCD_EVENT_BACKGROUNDED_MODE } from './CmcdEventType.ts'
import { emitEvent } from './emitEvent.ts'
import type { SessionState } from './SessionState.ts'

/** Emits `b` for every live reporter when the session `bg` differs from the last reported value of the current `sid`. */
export function emitBackgroundChange(session: SessionState, ts: number): void {
	const sidState = session.current
	if (session.bg === sidState.bgReported) {
		return
	}
	sidState.bgReported = session.bg
	const reporters = session.reporters.size > 0 ? [...session.reporters] : [undefined]
	let failure: unknown
	let failed = false
	for (const reporter of reporters) {
		try {
			emitEvent(session, reporter, CMCD_EVENT_BACKGROUNDED_MODE, undefined, undefined, ts)
		}
		catch (error) {
			if (!failed) {
				failed = true
				failure = error
			}
		}
	}
	if (failed) {
		throw failure
	}
}
```

In `libs/cmcd/src/emitEvent.ts`, change the parameter to `reporter: ReporterState | undefined`. Nothing else changes, because `assembleReport` and `emitReport` accept `undefined`.

In `libs/cmcd/src/deriveStateEvents.ts`, import `emitBackgroundChange` and insert `emitBackgroundChange(session, ts)` between the `cid` block and the `br` block.

- [ ] **Step 4: Wire the host and the listener**

In `libs/cmcd/src/createSessionReporter.ts`, import `CMCD_EVENT_HOSTNAME` from `./CmcdEventType.ts` and add above `createSessionReporter`:

```ts
function hostOf(url: string): string | undefined {
	try {
		return new URL(url).hostname || undefined
	}
	catch {
		return undefined
	}
}
```

In `decorate`, after `const origin: RequestOrigin = ...` insert:

```ts
			let hostChanged = false
			if (!reporter.hSupplied) {
				const host = hostOf(request.url)
				if (host !== undefined && host !== reporter.host) {
					reporter.host = host
					hostChanged = true
				}
			}
```

and before `return finish(request, placed, record)` insert:

```ts
			if (hostChanged) {
				emitEvent(state, reporter, CMCD_EVENT_HOSTNAME, undefined, undefined, origin.startedAt)
			}
```

In `libs/cmcd/src/createCmcdSession.ts`, import `observeVisibility` and `emitBackgroundChange`, and insert before `armTimers(state)`:

```ts
	if (normalized.derive.bg) {
		state.stopVisibility = observeVisibility((hidden) => {
			if (state.disposed || state.bgSupplied) {
				return
			}
			state.bg = hidden ? true : undefined
			emitBackgroundChange(state, Date.now())
		})
		if (state.stopVisibility && document.visibilityState === 'hidden') {
			state.bg = true
			state.current.bgReported = true
		}
	}
```

- [ ] **Step 5: Run the tests**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSessionReporter.derived.test.ts libs/cmcd/test/CmcdSessionReporter.events.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add libs/cmcd/src libs/cmcd/test
git commit -s -m "feat(cmcd): derive h from the request host and bg from document visibility in the session API" -m "Co-Authored-By: Claude claude-fable-5-1 <noreply@anthropic.com>"
```

---

### Task 8: Responses and request origins

**Files:**
- Create: `libs/cmcd/src/readHeader.ts`, `libs/cmcd/src/toResponseKeys.ts`, `libs/cmcd/src/emitResponse.ts`
- Modify: `libs/cmcd/src/RequestOrigin.ts`, `libs/cmcd/src/assembleReport.ts`, `libs/cmcd/src/createSessionReporter.ts`
- Test: `libs/cmcd/test/CmcdSessionReporter.responses.test.ts`

**Interfaces:**
- Produces: `toResponseKeys(request, info, origin)`, `emitResponse(session, origin, request, info, data)`, `readHeader(headers, name)`. `assembleReport()` gains an optional last parameter `store?: Record<string, unknown>` that replaces the reporter's store. `RequestOrigin.startedAt` becomes `number | undefined`.

`recordResponse()` looks the request's `cmcd` record up in the origin map. With an origin, the `rr` report uses the issuing `sid` state and the origin reporter's store, or its snapshot when that state has ended. It then merges the `cid` at decoration, the copied per-request data, the derived response keys, and the call's data. Without an origin, it uses the calling reporter and the current `sid`. An ended `sid` state sends at once.

- [ ] **Step 1: Write the failing tests**

```ts
// libs/cmcd/test/CmcdSessionReporter.responses.test.ts
import { createCmcdSession } from '@svta/cml-cmcd'
import { deepEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'
import { EX_8_2_3 } from './data/CTA_5004_B_EXAMPLES.ts'
import { createMockRequester, flushPromises } from './helpers/cmcdSessionHarness.ts'

const COLLECTOR = 'https://collector.example.com/cmcd'
const CDN = 'https://cdn.example.com'
const CMSD_STATIC = atob('c2lkPSI5YTNiLTIxY2QiO2JyPTQ1MDA7ZD00MDAwO290PXY7c3Q9dg==')
const CMSD_DYNAMIC = atob('ZXRwPTEyNTAwO3J0dD0zNTttYj02MDAwO3JkPTIwMA==')

function harness(sid: string, cid: string, keys: string[]) {
	const mock = createMockRequester()
	const session = createCmcdSession({ sid, requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['rr'], keys: keys as never, interval: 0 }] })
	return { mock, session, reporter: session.createReporter({ cid }) }
}

describe('CmcdSessionReporter responses', () => {
	it('reproduces 8.2.3 from the decorated request, the headers, and the timing', async () => {
		const { mock, reporter } = harness('session1', 'bbb', ['cid', 'cmsdd', 'cmsds', 'nor', 'ot', 'rc', 'sid', 'ttfb', 'ttlb', 'url'])
		const req = reporter.decorate({ url: `${CDN}/index.mpd` }, { ot: 'v', nor: `${CDN}/video/segment-6.m4v` })
		reporter.recordResponse(req, {
			status: 200,
			headers: { 'CMSD-Static': CMSD_STATIC, 'cmsd-dynamic': CMSD_DYNAMIC },
			timing: { startTime: 1000, responseStart: 1180, responseEnd: 1200 },
		}, { ts: 1763657019723, url: 'video/segment-5.m4v' })
		await flushPromises()
		deepEqual(mock.bodies(), [EX_8_2_3])
	})

	it('derives url, rc, ts, and ttlb without timing, and reads a Headers object', async (context) => {
		context.mock.timers.enable({ apis: ['Date'], now: 1000 })
		const { mock, reporter } = harness('s', 'c', ['cmsds', 'rc', 'sid', 'ttlb', 'url'])
		const req = reporter.decorate({ url: `${CDN}/seg.m4s?a=1` })
		context.mock.timers.setTime(1250)
		const body = await new Response('', { headers: { 'CMSD-Static': 'ot=v' } }).arrayBuffer()
		equal(body.byteLength, 0)
		reporter.recordResponse(req, { status: 206, headers: new Headers({ 'CMSD-Static': 'ot=v' }) })
		await flushPromises()
		deepEqual(mock.bodies(), [`cmsds="${btoa('ot=v')}",e=rr,rc=206,sid="s",ts=1000,ttlb=250,url="${CDN}/seg.m4s?a=1",v=2`])
	})

	it('omits unavailable timing values', async () => {
		const { mock, reporter } = harness('s', 'c', ['rc', 'sid', 'ttfb', 'ttlb', 'url'])
		const req = reporter.decorate({ url: `${CDN}/seg.m4s` })
		reporter.recordResponse(req, { status: 200, timing: { startTime: 5000, responseStart: 0, responseEnd: 5100 } }, { ts: 7 })
		reporter.recordResponse(req, { status: 200, timing: { startTime: 5000, responseStart: 0, responseEnd: 4000, duration: 0 } }, { ts: 8 })
		await flushPromises()
		deepEqual(mock.bodies(), [
			`e=rr,rc=200,sid="s",ts=7,ttlb=100,url="${CDN}/seg.m4s",v=2`,
			`e=rr,rc=200,sid="s",ts=8,url="${CDN}/seg.m4s",v=2`,
		])
	})

	it('reports a URL-only response under the calling reporter, without the CMCD parameter', async (context) => {
		context.mock.timers.enable({ apis: ['Date'], now: 1000 })
		const { mock, reporter } = harness('s', 'c', ['cid', 'rc', 'sid', 'url'])
		reporter.recordResponse({ url: `${CDN}/x?CMCD=abc&y=2` }, { status: 404 })
		await flushPromises()
		deepEqual(mock.bodies(), [`cid="c",e=rr,rc=404,sid="s",ts=1000,url="${CDN}/x?y=2",v=2`])
	})

	it('attributes a spread copy, uses the cid at decoration, and falls back after a JSON round trip', async () => {
		const { mock, reporter } = harness('s', 'first', ['cid', 'rc', 'sid'])
		const req = reporter.decorate({ url: `${CDN}/seg.m4s` })
		reporter.update({ cid: 'second' })
		reporter.recordResponse({ ...req }, { status: 200 }, { ts: 1 })
		reporter.recordResponse(JSON.parse(JSON.stringify(req)), { status: 200 }, { ts: 2 })
		await flushPromises()
		deepEqual(mock.bodies(), ['cid="first",e=rr,rc=200,sid="s",ts=1,v=2', 'cid="second",e=rr,rc=200,sid="s",ts=2,v=2'])
	})

	it('accepts the response overrides and reports after the reporter is disposed', async () => {
		const { mock, reporter } = harness('s', 'c', ['rc', 'sid', 'smrt', 'ttfb', 'ttfbb', 'ttlb'])
		const req = reporter.decorate({ url: `${CDN}/seg.m4s` })
		reporter.dispose()
		reporter.recordResponse(req, { status: 200 }, { ts: 3, ttfb: 5, ttfbb: 12, ttlb: 40, smrt: 'abc' })
		await flushPromises()
		deepEqual(mock.bodies(), ['e=rr,rc=200,sid="s",smrt="abc",ts=3,ttfb=5,ttfbb=12,ttlb=40,v=2'])
	})

	it('does not change a late report when the player mutates its per-request data object', async () => {
		const { mock, reporter } = harness('s', 'c', ['br', 'ot', 'rc', 'sid'])
		const data = { ot: 'v' as const, br: { v: 3000 } }
		const req = reporter.decorate({ url: `${CDN}/seg.m4s` }, data)
		data.br.v = 1
		reporter.recordResponse(req, { status: 200 }, { ts: 1 })
		await flushPromises()
		deepEqual(mock.bodies(), ['br=(3000;v),e=rr,ot=v,rc=200,sid="s",ts=1,v=2'])
	})
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSessionReporter.responses.test.ts`
Expected: FAIL, no `rr` body.

- [ ] **Step 3: Write the response derivations**

In `libs/cmcd/src/RequestOrigin.ts`, change `startedAt` to `readonly startedAt: number | undefined`.

```ts
// libs/cmcd/src/readHeader.ts
/** One response header by name, case-insensitively, from a `Headers` object or a record. */
export function readHeader(headers: Headers | Readonly<Record<string, string>> | undefined, name: string): string | undefined {
	if (!headers) {
		return undefined
	}
	if (typeof (headers as Headers).get === 'function') {
		return (headers as Headers).get(name) ?? undefined
	}
	const wanted = name.toLowerCase()
	for (const [key, value] of Object.entries(headers as Record<string, string>)) {
		if (key.toLowerCase() === wanted) {
			return value
		}
	}
	return undefined
}
```

```ts
// libs/cmcd/src/toResponseKeys.ts
import { encodeBase64 } from '@svta/cml-utils'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import type { CmcdResponseInfo } from './CmcdResponseInfo.ts'
import { removeCmcdQuery } from './placeRequestReport.ts'
import { readHeader } from './readHeader.ts'
import type { RequestOrigin } from './RequestOrigin.ts'

function toBase64(text: string): string {
	return encodeBase64(new TextEncoder().encode(text))
}

/**
 * The derived `rr` keys: `url` without the CMCD parameter, `rc`, and when known `ts`, `ttfb`, `ttlb`, `cmsds`, and `cmsdd`.
 * Resource Timing reports zero for `responseStart` of a cross-origin resource without `Timing-Allow-Origin`, so `ttfb` is
 * omitted when `responseStart` is absent, zero, or earlier than `startTime`. Without timing, `ttlb` measures the call.
 */
export function toResponseKeys(request: CmcdRequestLike, info: CmcdResponseInfo, origin: RequestOrigin | undefined): Record<string, unknown> {
	const keys: Record<string, unknown> = { url: removeCmcdQuery(request.url), rc: info.status ?? 0 }
	const timing = info.timing
	if (timing && typeof timing.startTime === 'number') {
		keys['ts'] = Math.round(performance.timeOrigin + timing.startTime)
		if (typeof timing.responseStart === 'number' && timing.responseStart > 0 && timing.responseStart >= timing.startTime) {
			keys['ttfb'] = Math.round(timing.responseStart - timing.startTime)
		}
		if (typeof timing.duration === 'number' && timing.duration > 0) {
			keys['ttlb'] = Math.round(timing.duration)
		}
		else if (typeof timing.responseEnd === 'number' && timing.responseEnd > timing.startTime) {
			keys['ttlb'] = Math.round(timing.responseEnd - timing.startTime)
		}
	}
	else if (origin?.startedAt !== undefined) {
		keys['ts'] = origin.startedAt
		keys['ttlb'] = Math.max(0, Date.now() - origin.startedAt)
	}
	const cmsds = readHeader(info.headers, 'CMSD-Static')
	if (cmsds) {
		keys['cmsds'] = toBase64(cmsds)
	}
	const cmsdd = readHeader(info.headers, 'CMSD-Dynamic')
	if (cmsdd) {
		keys['cmsdd'] = toBase64(cmsdd)
	}
	return keys
}
```

```ts
// libs/cmcd/src/emitResponse.ts
import { CMCD_EVENT_RESPONSE_RECEIVED } from './CmcdEventType.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import type { CmcdResponseData } from './CmcdResponseData.ts'
import type { CmcdResponseInfo } from './CmcdResponseInfo.ts'
import { assembleReport } from './assembleReport.ts'
import { emitReport } from './emitReport.ts'
import { processQueue } from './processQueue.ts'
import type { RequestOrigin } from './RequestOrigin.ts'
import type { SessionState } from './SessionState.ts'
import type { TargetState } from './TargetState.ts'
import { toResponseKeys } from './toResponseKeys.ts'

/**
 * Emits `rr` to every event target of the origin `sid` state that lists it. The report merges the origin reporter's store,
 * or the copy the ended `sid` state keeps, the `cid` at decoration, the copied per-request data, the derived keys, then `data`.
 */
export function emitResponse(session: SessionState, origin: RequestOrigin, request: CmcdRequestLike, info: CmcdResponseInfo, data: CmcdResponseData | undefined): void {
	const { sidState, reporter } = origin
	const derived = toResponseKeys(request, info, origin)
	const perCall: Record<string, unknown> = { ...(origin.data ?? {}), ...derived, ...(data ?? {}) }
	if (origin.cid !== undefined && data?.cid === undefined) {
		perCall['cid'] = origin.cid
	}
	const ts = typeof perCall['ts'] === 'number' ? perCall['ts'] : Date.now()
	delete perCall['ts']
	const store = sidState.ended ? sidState.stores.get(reporter) ?? reporter.store : reporter.store
	const targets: TargetState[] = []
	let failure: unknown
	let failed = false
	for (const target of sidState.eventTargets) {
		if (target.gone || !session.config.eventTargets[target.index].events.has(CMCD_EVENT_RESPONSE_RECEIVED)) {
			continue
		}
		try {
			const assembled = assembleReport(session, sidState, target, reporter, CMCD_EVENT_RESPONSE_RECEIVED, perCall, ts, store)
			emitReport(session, sidState, target, reporter, assembled, CMCD_EVENT_RESPONSE_RECEIVED, request)
			targets.push(target)
		}
		catch (error) {
			if (!failed) {
				failed = true
				failure = error
			}
		}
	}
	for (const target of targets) {
		processQueue(session, sidState, target, sidState.ended)
	}
	if (failed) {
		throw failure
	}
}
```

In `libs/cmcd/src/assembleReport.ts`, add the optional last parameter and use it for the first line of the body:

```ts
export function assembleReport(session: SessionState, sidState: SidState, target: TargetState, reporter: ReporterState | undefined, event: string | undefined, data: Record<string, unknown> | undefined, ts: number, store?: Record<string, unknown>): AssembledReport {
	const config = session.config
	const report: Record<string, unknown> = { ...(store ?? reporter?.store ?? {}) }
```

The `data` parameter type widens to `Record<string, unknown> | undefined`, because the response path merges derived keys into it. The `CmcdPlaybackData` callers still compile.

In `libs/cmcd/src/createSessionReporter.ts`, import `CMCD_REQUEST_ORIGINS` (already imported), `emitResponse`, and the `CmcdResponseData` and `CmcdResponseInfo` types. Replace `recordResponse`:

```ts
		recordResponse(request: CmcdRequestLike, info: CmcdResponseInfo, data?: CmcdResponseData) {
			const record = (request as { cmcd?: unknown }).cmcd
			const origin = record !== null && typeof record === 'object' ? CMCD_REQUEST_ORIGINS.get(record) : undefined
			if (!origin && (reporter.disposed || state.disposed)) {
				return
			}
			emitResponse(state, origin ?? { reporter, sidState: state.current, cid: reporter.store['cid'] as string | undefined, data: undefined, startedAt: undefined }, request, info, data)
		},
```

- [ ] **Step 4: Run the tests**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSessionReporter.responses.test.ts && npm run typecheck`
Expected: PASS. If 8.2.3 differs in `nor`, the base URL of the `rr` report is the request URL, so `video/segment-6.m4v` is relative to `https://cdn.example.com/`.

- [ ] **Step 5: Commit**

```bash
git add libs/cmcd/src libs/cmcd/test
git commit -s -m "feat(cmcd): record responses through request origins in the session API" -m "Co-Authored-By: Claude claude-fable-5-1 <noreply@anthropic.com>"
```

---

### Task 9: Rotation and late responses

**Files:**
- Create: `libs/cmcd/src/rotateSession.ts`
- Modify: `libs/cmcd/src/createCmcdSession.ts`
- Test: `libs/cmcd/test/CmcdSession.rotation.test.ts`

**Interfaces:**
- Consumes: `checkSid()`, `createSidState()`, `processQueue()`, `getTargetEntry()`, `copyPlaybackData()`.
- Produces: `rotateSession(state, sid)`.

`rotate()` follows the design record's rotate algorithm. It drains and ends the old `sid` state and copies each reporter's store onto it. It creates the new state, carries a startup measurement in progress, and resets the dedup baselines. For a reporter in `r`, it sets `bs` on the new targets and measures the stall from the rotation time. Nothing is emitted.

- [ ] **Step 1: Write the failing tests**

```ts
// libs/cmcd/test/CmcdSession.rotation.test.ts
import { createCmcdSession } from '@svta/cml-cmcd'
import { deepEqual, equal, throws } from 'node:assert'
import { describe, it } from 'node:test'
import { createMockRequester, flushPromises, queryValue } from './helpers/cmcdSessionHarness.ts'

const COLLECTOR = 'https://collector.example.com/cmcd'
const CDN = 'https://cdn.example.com'

describe('CmcdSession rotation', () => {
	it('restarts sn per target, re-arms the msd gate, resets the baselines, and emits nothing', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 'a', requester: mock.requester, keys: ['msd', 'sid', 'sn'], eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['msd', 'sid', 'sn', 'sta'], interval: 0 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 's', ts: 1000 })
		reporter.update({ sta: 'p', ts: 1200 })
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'msd=200,sid="a",sn=0,v=2')
		session.rotate('b')
		equal(session.sid, 'b')
		await flushPromises()
		equal(mock.requests.length, 2)
		equal(queryValue(reporter.decorate({ url: `${CDN}/b` }).url), 'sid="b",sn=0,v=2')
		reporter.update({ sta: 'p', ts: 1300 })
		await flushPromises()
		equal(mock.bodies()[2], 'e=ps,sid="b",sn=0,sta=p,ts=1300,v=2')
		session.rotate('b')
		equal(mock.requests.length, 3)
		throws(() => session.rotate('x'.repeat(65)), { message: /^CmcdSession: sid must be/ })
		session.dispose()
	})

	it('carries a startup measurement in progress', () => {
		const session = createCmcdSession({ sid: 'a', keys: ['msd', 'sid'] })
		const reporter = session.createReporter()
		reporter.update({ sta: 's', ts: 1000 })
		session.rotate('manifest-sid')
		reporter.update({ sta: 's', ts: 1100 })
		reporter.update({ sta: 'p', ts: 1500 })
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'msd=500,sid="manifest-sid",v=2')
	})

	it('drains the old queue at once and re-activates a target that a 410 silenced', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 'a', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid', 'sta'], interval: 0, batchSize: 5 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1 })
		reporter.update({ sta: 'a', ts: 2 })
		await flushPromises()
		equal(mock.requests.length, 0)
		session.rotate('b')
		await flushPromises()
		deepEqual(mock.bodies(), ['e=ps,sid="a",sta=p,ts=1,v=2\ne=ps,sid="a",sta=a,ts=2,v=2'])
		mock.status = 410
		session.flush()
		reporter.update({ sta: 'p', ts: 3 })
		session.flush()
		await flushPromises()
		equal(mock.requests.length, 2)
		mock.status = 200
		reporter.update({ sta: 'a', ts: 4 })
		session.flush()
		await flushPromises()
		equal(mock.requests.length, 2)
		session.rotate('c')
		reporter.update({ sta: 'p', ts: 5 })
		session.flush()
		await flushPromises()
		equal(mock.bodies()[2], 'e=ps,sid="c",sta=p,ts=5,v=2')
		session.dispose()
	})

	it('reports a late response under the old sid with the store copied at rotation', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 'a', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['rr'], keys: ['bl', 'rc', 'sid', 'sn'], interval: 0, batchSize: 5 }] })
		const reporter = session.createReporter()
		reporter.update({ bl: 1000 })
		const req = reporter.decorate({ url: `${CDN}/a` })
		session.rotate('b')
		reporter.update({ bl: 9000 })
		reporter.recordResponse(req, { status: 200 }, { ts: 7 })
		await flushPromises()
		deepEqual(mock.bodies(), ['bl=(1000),e=rr,rc=200,sid="a",sn=0,ts=7,v=2'])
		reporter.recordResponse(reporter.decorate({ url: `${CDN}/b` }), { status: 200 }, { ts: 8 })
		session.flush()
		await flushPromises()
		equal(mock.bodies()[1], 'bl=(9000),e=rr,rc=200,sid="b",sn=0,ts=8,v=2')
		session.dispose()
	})

	it('measures a stall open at rotation from the rotation time and keeps bs set', async (context) => {
		context.mock.timers.enable({ apis: ['Date'], now: 5000 })
		const session = createCmcdSession({ sid: 'a', keys: ['bs', 'bsd', 'bsda', 'sid'] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1000 })
		reporter.update({ sta: 'r', ts: 4000 })
		session.rotate('b')
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'bs,sid="b",v=2')
		reporter.update({ sta: 'p', ts: 5300 })
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'bs,bsd=(300),bsda=(300),sid="b",v=2')
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'bsda=(300),sid="b",v=2')
	})

	it('lets an ended sid state be collected once its requests are released', async () => {
		const v8 = await import('node:v8')
		const vm = await import('node:vm')
		v8.setFlagsFromString('--expose-gc')
		const gc = vm.runInNewContext('gc') as () => void
		const session = createCmcdSession({ sid: 'a' })
		const reporter = session.createReporter()
		let req: { cmcd: object } | undefined = reporter.decorate({ url: `${CDN}/a` })
		const ref = new WeakRef(req.cmcd)
		session.rotate('b')
		req = undefined
		for (let i = 0; i < 10 && ref.deref() !== undefined; i++) {
			gc()
			await new Promise(resolve => setTimeout(resolve, 0))
		}
		equal(ref.deref(), undefined)
		session.dispose()
	})
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSession.rotation.test.ts`
Expected: FAIL on the drain, the carried `msd`, the snapshot, and the stall.

- [ ] **Step 3: Write the rotation**

```ts
// libs/cmcd/src/rotateSession.ts
import { uuid } from '@svta/cml-utils'
import type { CmcdPlaybackData } from './CmcdPlaybackData.ts'
import { checkSid } from './checkRequestSettings.ts'
import { copyPlaybackData } from './copyPlaybackData.ts'
import { createSidState } from './createSidState.ts'
import { getTargetEntry } from './getTargetEntry.ts'
import { processQueue } from './processQueue.ts'
import type { SessionState } from './SessionState.ts'

/**
 * Starts the next `sid`. The old state is drained and ended, each reporter's store is copied onto it for late responses,
 * and every counter, gate, buffer, and baseline restarts. A startup measurement in progress carries over.
 * A reporter that is rebuffering keeps `bs` and measures the stall from now. Emits nothing.
 */
export function rotateSession(state: SessionState, sid: string | undefined): void {
	if (state.disposed) {
		return
	}
	const next = sid ?? uuid()
	checkSid(next)
	const old = state.current
	if (next === old.sid) {
		return
	}
	old.ended = true
	for (const target of old.eventTargets) {
		processQueue(state, old, target, true)
	}
	for (const reporter of state.reporters) {
		old.stores.set(reporter, copyPlaybackData(reporter.store as CmcdPlaybackData) as Record<string, unknown>)
	}
	const fresh = createSidState(next, state.config)
	if (old.msd === undefined && !old.msdSupplied && old.msdStart !== undefined) {
		fresh.msdStart = old.msdStart
	}
	const now = Date.now()
	for (const reporter of state.reporters) {
		reporter.reported.sta = undefined
		reporter.reported.pr = undefined
		reporter.reported.cid = undefined
		reporter.reported.br = undefined
		if (reporter.store['sta'] === 'r') {
			reporter.spanOpenedAt = now
			for (const target of [fresh.requestTarget, ...fresh.eventTargets]) {
				getTargetEntry(target, reporter).bs = true
			}
		}
		else {
			reporter.spanOpenedAt = undefined
		}
	}
	state.current = fresh
}
```

In `libs/cmcd/src/createCmcdSession.ts`, import `rotateSession` and replace the inline `rotate` member with `rotate: sid => rotateSession(state, sid),`. Remove the `uuid` import only if nothing else in the file uses it. The initial `sid` still uses `uuid()`.

- [ ] **Step 4: Run the tests**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSession.rotation.test.ts libs/cmcd/test/CmcdSessionReporter.responses.test.ts && npm run typecheck`
Expected: PASS. If the collectability test times out, run it alone with `node --no-warnings --expose-gc --test libs/cmcd/test/CmcdSession.rotation.test.ts` to separate a flag problem from a retained reference. A retained reference means something other than the origin map points at the record: check `finish()` in `createSessionReporter.ts` and the test's own variables.

- [ ] **Step 5: Commit**

```bash
git add libs/cmcd/src libs/cmcd/test
git commit -s -m "feat(cmcd): rotate the sid with snapshots and carried startup state in the session API" -m "Co-Authored-By: Claude claude-fable-5-1 <noreply@anthropic.com>"
```

---

### Task 10: Transforms

**Files:**
- Test: `libs/cmcd/test/CmcdSession.transforms.test.ts`

**Interfaces:**
- Consumes: `emitReport()` from Task 2, which already runs the transform, restores required keys, and re-stamps `sid`, `e`, and `ts`. `decorate()` pins the origin before the transform, and `emitEvent()` captures the `sid` state once.

This task has no new source file. It verifies the transform contract of the RFC and the two pinning rules, and fixes whatever the tests find in `emitReport.ts`, `emitEvent.ts`, or `createSessionReporter.ts`.

- [ ] **Step 1: Write the failing tests**

```ts
// libs/cmcd/test/CmcdSession.transforms.test.ts
import type { Cmcd, CmcdSession } from '@svta/cml-cmcd'
import { createCmcdSession } from '@svta/cml-cmcd'
import { deepEqual, equal, throws } from 'node:assert'
import { describe, it } from 'node:test'
import { createMockRequester, flushPromises, queryValue } from './helpers/cmcdSessionHarness.ts'

const COLLECTOR = 'https://collector.example.com/cmcd'
const CDN = 'https://cdn.example.com'

describe('CmcdSession transforms', () => {
	it('runs the request transform on the normalized report with the request, and cancels with null', () => {
		const seen: Cmcd[] = []
		const session = createCmcdSession({
			sid: 's',
			keys: ['br', 'sid', 'com.example-x'],
			transform: (data, request) => {
				seen.push(data)
				return request.url.endsWith('skip') ? null : { ...data, 'com.example-x': 'y' }
			},
		})
		const reporter = session.createReporter()
		const req = reporter.decorate({ url: `${CDN}/a` }, { br: { v: 3000 } })
		equal(queryValue(req.url), 'br=(3000;v),com.example-x="y",sid="s",v=2')
		equal(Array.isArray(seen[0].br), true)
		const skipped = reporter.decorate({ url: `${CDN}/skip` })
		equal(skipped.url, `${CDN}/skip`)
		deepEqual(skipped.cmcd, { sid: 's', data: {} })
		equal(queryValue(reporter.decorate({ url: `${CDN}/b` }).url), 'com.example-x="y",sid="s",v=2')
	})

	it('cancels one event target only, restores required keys, and re-stamps sid, e, and ts', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [
			{ url: `${COLLECTOR}/1`, events: ['ps'], keys: ['sid', 'sta'], interval: 0, transform: () => null },
			{ url: `${COLLECTOR}/2`, events: ['ps'], keys: ['sid', 'sta'], interval: 0, transform: (data) => {
				const copy = { ...data, sid: 'forged', e: 't', ts: 1 } as Cmcd
				delete copy.sta
				return copy
			} },
			{ url: `${COLLECTOR}/3`, events: ['ps'], keys: ['sid', 'sta'], interval: 0 },
		] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 5 })
		await flushPromises()
		deepEqual(mock.requests.map(request => request.url), [`${COLLECTOR}/2`, `${COLLECTOR}/3`])
		deepEqual(mock.bodies(), ['e=ps,sid="s",sta=p,ts=5,v=2', 'e=ps,sid="s",sta=p,ts=5,v=2'])
	})

	it('gives an rr transform the decorated request and other events undefined', async () => {
		const mock = createMockRequester()
		const urls: (string | undefined)[] = []
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['rr', 'ps'], keys: ['sid'], interval: 0, transform: (data, request) => {
			urls.push(request?.url)
			return data
		} }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p' })
		const req = reporter.decorate({ url: `${CDN}/a` })
		reporter.recordResponse(req, { status: 200 })
		await flushPromises()
		deepEqual(urls, [undefined, req.url])
	})

	it('opts in to bg=?0 on the exit b report through a transform', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['b'], keys: ['bg', 'sid'], interval: 0, transform: (data) => data.e === 'b' && !('bg' in data) ? { ...data, bg: false } : data }] })
		const reporter = session.createReporter()
		reporter.update({ bg: true, ts: 1 })
		reporter.update({ bg: false, ts: 2 })
		await flushPromises()
		deepEqual(mock.bodies(), ['bg,e=b,sid="s",ts=1,v=2', 'bg=?0,e=b,sid="s",ts=2,v=2'])
	})

	it('keeps the request and the remaining targets on the old sid when a transform rotates', async () => {
		const mock = createMockRequester()
		let session: CmcdSession | undefined
		session = createCmcdSession({ sid: 'a', requester: mock.requester, keys: ['sid'], transform: (data) => {
			session?.rotate('b')
			return data
		}, eventTargets: [
			{ url: `${COLLECTOR}/1`, events: ['ps', 'rr'], keys: ['sid'], interval: 0, transform: (data) => {
				session?.rotate('c')
				return data
			} },
			{ url: `${COLLECTOR}/2`, events: ['ps', 'rr'], keys: ['sid'], interval: 0 },
		] })
		const reporter = session.createReporter()
		const req = reporter.decorate({ url: `${CDN}/a` })
		equal(req.cmcd.sid, 'a')
		equal(queryValue(req.url), 'sid="a",v=2')
		equal(session.sid, 'b')
		reporter.update({ sta: 'p', ts: 1 })
		reporter.recordResponse(req, { status: 200 }, { ts: 2 })
		await flushPromises()
		deepEqual(mock.bodies(), ['e=ps,sid="b",ts=1,v=2', 'e=ps,sid="b",ts=1,v=2', 'e=rr,rc=200,sid="a",ts=2,v=2'.replace('rc=200,', ''), 'e=rr,sid="a",ts=2,v=2'])
		equal(session.sid, 'c')
		session.dispose()
	})

	it('rethrows a throwing transform after the other targets ran', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [
			{ url: `${COLLECTOR}/1`, events: ['ps'], keys: ['sid'], interval: 0, transform: () => {
				throw new Error('boom')
			} },
			{ url: `${COLLECTOR}/2`, events: ['ps'], keys: ['sid'], interval: 0 },
		] })
		const reporter = session.createReporter()
		throws(() => reporter.update({ sta: 'p', ts: 1 }), { message: /boom/ })
		await flushPromises()
		deepEqual(mock.requests.map(request => request.url), [`${COLLECTOR}/2`])
	})
})
```

In the rotation test above, the `rr` bodies have no `rc` because the target keys are `['sid']`. Write the expected array plainly as `['e=ps,sid="b",ts=1,v=2', 'e=ps,sid="b",ts=1,v=2', 'e=rr,sid="a",ts=2,v=2', 'e=rr,sid="a",ts=2,v=2']`.

- [ ] **Step 2: Run the tests**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSession.transforms.test.ts`
Expected: most tests PASS already. Fix any failure in the file the assertion points at, with this guidance:

- A forged `sid`, `e`, or `ts` that survives means the re-stamp in `emitReport` runs before `normalizeReport(result)` instead of after. Keep the order: normalize the result, restore required keys, then re-stamp.
- A missing `bg=?0` means `normalizeValue` dropped `false` for a boolean. It must return the boolean as is and leave the omission to `filterReport`.
- A request that lands on `sid` b after the transform rotated means `decorate()` read `state.current` after `emitReport`. It must use the `sidState` captured in the origin for the target, the record, and the origin map.
- Only one `ps` body under `sid` b would mean `emitEvent()` read `session.current` per target instead of once.

- [ ] **Step 3: Run the whole suite and commit**

Run: `npm run build -w libs/cmcd && npm test -w libs/cmcd && npm run typecheck`
Expected: PASS.

```bash
git add libs/cmcd/src libs/cmcd/test
git commit -s -m "test(cmcd): cover the session API transform contract and origin pinning" -m "Co-Authored-By: Claude claude-fable-5-1 <noreply@anthropic.com>"
```

---

### Task 11: The delivery state machine

**Files:**
- Test: `libs/cmcd/test/CmcdSession.delivery.test.ts` (new `describe` block)

**Interfaces:**
- Consumes: `processQueue()` from Task 4. Fix that file when a test fails.

The rules under test: a 410 silences the target for the rest of the `sid`. A 429, a 5xx, or a rejection puts the batch back. The retry waits 1, 2, 4, 8, 16, 32, then 60 seconds, and it drains everything queued since. Another 4xx drops the batch. The queue keeps the newest `maxQueueSize` lines. A drain requested while a send is in flight is honored when the send settles. After the `sid` state has ended, the failure after the 60 second wait stops the retries and goes to `onError`. The default requester posts through `fetch` with `keepalive`.

- [ ] **Step 1: Write the failing tests**

Append to `libs/cmcd/test/CmcdSession.delivery.test.ts`. Add `mock` and the type `TestContext` to the `node:test` import, and `HttpRequest` as a type import from `@svta/cml-utils`.

```ts
describe('CmcdSession delivery state machine', () => {
	async function twoLines(status: number, context: TestContext) {
		context.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1000 })
		const requester = createMockRequester(status)
		const session = createCmcdSession({ sid: 's', requester: requester.requester, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid', 'sta'], interval: 0 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1 })
		await flushPromises()
		reporter.update({ sta: 'a', ts: 2 })
		await flushPromises()
		return { requester, session, reporter }
	}

	it('silences a target for the rest of the sid after a 410', async (context) => {
		const { requester, session } = await twoLines(410, context)
		equal(requester.requests.length, 1)
		requester.status = 200
		session.flush()
		await flushPromises()
		equal(requester.requests.length, 1)
		session.dispose()
	})

	it('backs off after a 429 and aggregates the lines queued during the wait', async (context) => {
		const { requester, session } = await twoLines(429, context)
		deepEqual(requester.bodies(), ['e=ps,sid="s",sta=p,ts=1,v=2'])
		context.mock.timers.tick(999)
		await flushPromises()
		equal(requester.requests.length, 1)
		context.mock.timers.tick(1)
		await flushPromises()
		equal(requester.bodies()[1], 'e=ps,sid="s",sta=p,ts=1,v=2\ne=ps,sid="s",sta=a,ts=2,v=2')
		requester.status = 200
		context.mock.timers.tick(1999)
		await flushPromises()
		equal(requester.requests.length, 2)
		context.mock.timers.tick(1)
		await flushPromises()
		equal(requester.requests.length, 3)
		equal(requester.bodies()[2], requester.bodies()[1])
		session.dispose()
	})

	it('retries a 5xx and a rejection, and drops the batch on another 4xx', async (context) => {
		const { requester, session } = await twoLines(503, context)
		context.mock.timers.tick(1000)
		await flushPromises()
		equal(requester.requests.length, 2)
		session.dispose()

		let attempts = 0
		const rejecting = createCmcdSession({ sid: 'r', requester: () => {
			attempts += 1
			return Promise.reject(new Error('offline'))
		}, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid'], interval: 0 }] })
		rejecting.createReporter().update({ sta: 'p', ts: 1 })
		await flushPromises()
		equal(attempts, 1)
		context.mock.timers.tick(1000)
		await flushPromises()
		equal(attempts, 2)
		rejecting.dispose()

		const dropping = createMockRequester(400)
		const other = createCmcdSession({ sid: 'd', requester: dropping.requester, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid', 'sta'], interval: 0 }] })
		const reporter = other.createReporter()
		reporter.update({ sta: 'p', ts: 1 })
		await flushPromises()
		dropping.status = 200
		reporter.update({ sta: 'a', ts: 2 })
		await flushPromises()
		deepEqual(dropping.bodies(), ['e=ps,sid="d",sta=p,ts=1,v=2', 'e=ps,sid="d",sta=a,ts=2,v=2'])
		other.dispose()
	})

	it('keeps the newest maxQueueSize lines', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1000 })
		const requester = createMockRequester(429)
		const session = createCmcdSession({ sid: 's', requester: requester.requester, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid', 'sta'], interval: 0, batchSize: 2, maxQueueSize: 2 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1 })
		reporter.update({ sta: 'a', ts: 2 })
		await flushPromises()
		reporter.update({ sta: 'p', ts: 3 })
		requester.status = 200
		context.mock.timers.tick(1000)
		await flushPromises()
		equal(requester.bodies()[1], 'e=ps,sid="s",sta=a,ts=2,v=2\ne=ps,sid="s",sta=p,ts=3,v=2')
		session.dispose()
	})

	it('honors a drain requested while a send is in flight', async () => {
		let release: ((value: { status: number }) => void) | undefined
		const bodies: string[] = []
		const requester = (request: HttpRequest) => {
			bodies.push(request.body as string)
			return new Promise<{ status: number }>((resolve) => {
				release = resolve
			})
		}
		const session = createCmcdSession({ sid: 's', requester, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid', 'sta'], interval: 0, batchSize: 10 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1 })
		session.flush()
		reporter.update({ sta: 'a', ts: 2 })
		reporter.update({ sta: 'p', ts: 3 })
		session.dispose()
		equal(bodies.length, 1)
		release?.({ status: 200 })
		await flushPromises()
		deepEqual(bodies, ['e=ps,sid="s",sta=p,ts=1,v=2', 'e=ps,sid="s",sta=a,ts=2,v=2\ne=ps,sid="s",sta=p,ts=3,v=2'])
	})

	it('flush() fires an armed retry at once', async (context) => {
		const { requester, session } = await twoLines(429, context)
		requester.status = 200
		session.flush()
		await flushPromises()
		equal(requester.requests.length, 2)
		context.mock.timers.tick(60000)
		await flushPromises()
		equal(requester.requests.length, 2)
		session.dispose()
	})

	it('stops retrying an ended sid state after the 60 second step and reports it', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1000 })
		const onError = mock.fn()
		const requester = createMockRequester(503)
		const session = createCmcdSession({ sid: 'a', requester: requester.requester, onError, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid'], interval: 0 }] })
		session.createReporter().update({ sta: 'p', ts: 1 })
		await flushPromises()
		session.rotate('b')
		for (const wait of [1000, 2000, 4000, 8000, 16000, 32000, 60000]) {
			context.mock.timers.tick(wait)
			await flushPromises()
		}
		equal(requester.requests.length, 8)
		equal(onError.mock.callCount(), 1)
		const error = onError.mock.calls[0].arguments[0] as Error
		equal(error.message, `CmcdSession: send failed for target ${COLLECTOR} after the back-off cap, status 503`)
		context.mock.timers.tick(120000)
		await flushPromises()
		equal(requester.requests.length, 8)
		session.dispose()
	})

	it('posts through fetch with keepalive by default', async (context) => {
		const calls: { url: string; init: RequestInit }[] = []
		context.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
			calls.push({ url, init })
			return new Response(null, { status: 204 })
		})
		const session = createCmcdSession({ sid: 's', eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid'], interval: 0 }] })
		session.createReporter().update({ sta: 'p', ts: 1 })
		await flushPromises()
		equal(calls.length, 1)
		equal(calls[0].url, COLLECTOR)
		equal(calls[0].init.method, 'POST')
		equal(calls[0].init.body, 'e=ps,sid="s",ts=1,v=2')
		equal(calls[0].init.keepalive, true)
		session.dispose()
	})
})
```

- [ ] **Step 2: Run the tests**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSession.delivery.test.ts`
Expected: PASS for most. Fix a failure in `processQueue.ts`:

- Eight requests but no `onError` call: the cap check must run after `attempt += 1` and compare with `> 7`.
- The aggregated retry body missing the second line: the retry callback must call `processQueue(..., true)`.
- A second POST during the in-flight test before `release`: the `sending` flag must be set before the requester is called.

- [ ] **Step 3: Commit**

```bash
git add libs/cmcd/src libs/cmcd/test
git commit -s -m "test(cmcd): cover the session API delivery state machine" -m "Co-Authored-By: Claude claude-fable-5-1 <noreply@anthropic.com>"
```

---

### Task 12: Errors and disposal

**Files:**
- Modify: `libs/cmcd/src/emitReport.ts`
- Test: `libs/cmcd/test/CmcdSession.errors.test.ts`

**Interfaces:**
- Produces: errors from the report path are `Error` objects. The message names the stage, `transform` or `encode`, and the target. The original error is the `cause`. The send stage message was written in Task 4.

- [ ] **Step 1: Write the failing tests**

```ts
// libs/cmcd/test/CmcdSession.errors.test.ts
import { createCmcdSession } from '@svta/cml-cmcd'
import { SfToken } from '@svta/cml-structured-field-values'
import { deepEqual, equal, ok, throws } from 'node:assert'
import { describe, it, mock } from 'node:test'
import { createMockRequester, flushPromises, queryValue } from './helpers/cmcdSessionHarness.ts'

const COLLECTOR = 'https://collector.example.com/cmcd'
const CDN = 'https://cdn.example.com'

describe('CmcdSession errors', () => {
	it('gives a tick error to onError with the stage and the target in the message', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1000 })
		const onError = mock.fn()
		const requester = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: requester.requester, onError, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['sid'], interval: 1, transform: () => {
			throw new Error('boom')
		} }] })
		session.createReporter()
		context.mock.timers.tick(1000)
		await flushPromises()
		equal(onError.mock.callCount(), 1)
		const error = onError.mock.calls[0].arguments[0] as Error
		equal(error.message, `CmcdSession: transform failed for target ${COLLECTOR}: boom`)
		equal((error.cause as Error).message, 'boom')
		equal(requester.requests.length, 0)
		session.dispose()
	})

	it('throws an encoder failure to the caller and commits nothing', () => {
		const session = createCmcdSession({ sid: 's', keys: ['sid', 'sn', 'com.example-x'] })
		const reporter = session.createReporter()
		throws(() => reporter.decorate({ url: `${CDN}/a` }, { 'com.example-x': new SfToken('not a token') }), (error: Error) => {
			ok(error.message.startsWith('CmcdSession: encode failed for target request:'))
			return error.cause !== undefined
		})
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'sid="s",sn=0,v=2')
	})

	it('makes every call a no-op after dispose, except createReporter which throws', async () => {
		const requester = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: requester.requester, eventTargets: [{ url: COLLECTOR, events: ['ps', 'e', 'sk'], keys: ['sid'], interval: 0 }] })
		const reporter = session.createReporter()
		session.dispose()
		reporter.update({ sta: 'p' })
		reporter.recordEvent('sk')
		reporter.recordError('X')
		const req = reporter.decorate({ url: `${CDN}/a` })
		equal(req.url, `${CDN}/a`)
		deepEqual(req.cmcd, { sid: 's', data: {} })
		session.rotate('b')
		equal(session.sid, 's')
		session.configure({ version: 1 })
		session.flush()
		await flushPromises()
		equal(requester.requests.length, 0)
		throws(() => session.createReporter(), { message: 'CmcdSession: createReporter must be a live session, received a disposed session' })
	})

	it('removes a disposed reporter from interval reports and target state', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1000 })
		const requester = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: requester.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['cid', 'ec', 'sid'], interval: 1 }] })
		const primary = session.createReporter({ cid: 'movie' })
		const ad = session.createReporter({ cid: 'ad' })
		ad.recordError('AD_ERR')
		ad.dispose()
		context.mock.timers.tick(1000)
		await flushPromises()
		deepEqual(requester.bodies(), ['cid="movie",e=t,sid="s",ts=2000,v=2'])
		primary.dispose()
		context.mock.timers.tick(1000)
		await flushPromises()
		equal(requester.bodies()[1], 'e=t,sid="s",ts=3000,v=2')
		session.dispose()
	})
})
```

If `encodeSfDict` accepts `not a token` as a token, use a string with a control character as the custom value instead. Structured field strings reject control characters.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSession.errors.test.ts`
Expected: FAIL on the error messages.

- [ ] **Step 3: Name the stage and the target in report errors**

In `libs/cmcd/src/emitReport.ts`, add above `emitReport`:

```ts
function fail(stage: 'transform' | 'encode', targetName: string, error: unknown): Error {
	const detail = error instanceof Error ? error.message : String(error)
	return new Error(`CmcdSession: ${stage} failed for target ${targetName}: ${detail}`, { cause: error })
}
```

Inside `emitReport`, define `const targetName = targetConfig ? targetConfig.url : 'request'` after `targetConfig`. Wrap the transform call:

```ts
		let result: Cmcd | null
		try {
			result = (transform as CmcdEventTransform)(before as Cmcd, request)
		}
		catch (error) {
			throw fail('transform', targetName, error)
		}
```

Wrap the encoder call:

```ts
	let line: string
	try {
		line = encodePreparedCmcd(prepared as Cmcd)
	}
	catch (error) {
		throw fail('encode', targetName, error)
	}
```

- [ ] **Step 4: Run the tests**

Run: `npm run build -w libs/cmcd && npm test -w libs/cmcd && npm run typecheck`
Expected: PASS, including the Task 10 transform test, whose `/boom/` pattern still matches the wrapped message.

- [ ] **Step 5: Commit**

```bash
git add libs/cmcd/src libs/cmcd/test
git commit -s -m "feat(cmcd): name the stage and the target in session API report errors" -m "Co-Authored-By: Claude claude-fable-5-1 <noreply@anthropic.com>"
```

---

### Task 13: Validation sweep and bundle probes

**Files:**
- Test: `libs/cmcd/test/CmcdSession.validation.test.ts`
- Modify: `plans/cmcd-session-api/comparison.md` (the measured sizes)

**Interfaces:**
- Consumes: `validateCmcdEvents(body)` and `validateCmcdRequest(request)` from the package.

Every line the session API emits must pass the package's own validators. The bundle probes check three things. Importing `createCmcdSession` alone does not pull in `CmcdReporter`. The package has no module-scope side effect. The size is compared with the baseline in `comparison.md`.

- [ ] **Step 1: Write the sweep**

```ts
// libs/cmcd/test/CmcdSession.validation.test.ts
import { CmcdTransmissionMode, createCmcdSession, validateCmcdEvents, validateCmcdRequest } from '@svta/cml-cmcd'
import { deepEqual, equal, ok } from 'node:assert'
import { describe, it } from 'node:test'
import { createMockRequester, flushPromises } from './helpers/cmcdSessionHarness.ts'

const COLLECTOR = 'https://collector.example.com/cmcd'
const CDN = 'https://cdn.example.com'

describe('CmcdSession validation sweep', () => {
	for (const transmissionMode of [CmcdTransmissionMode.QUERY, CmcdTransmissionMode.HEADERS]) {
		it(`emits only valid reports in ${transmissionMode} mode`, async (context) => {
			context.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1764752370000 })
			const mock = createMockRequester()
			const session = createCmcdSession({ sid: 'session-id-123', transmissionMode, requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['ps', 'pr', 'c', 'b', 'bc', 't', 'rr', 'e', 'h', 'ce', 'sk', 'as', 'ae', 'abs', 'abe'], interval: 1 }] })
			const primary = session.createReporter({ cid: 'movie-42' })
			const requests: { url: string; headers?: Readonly<Record<string, string>> }[] = []
			primary.update({ sf: 'd', st: 'v', sta: 's', bl: 0, mtp: 15000, ts: 1764752370000 })
			requests.push(primary.decorate({ url: `${CDN}/manifest.mpd` }, { ot: 'm' }))
			const init = primary.decorate({ url: `${CDN}/init.m4v` }, { ot: 'i', br: { v: 3000, a: 128 }, nor: [`${CDN}/seg-1.m4v`] })
			requests.push(init)
			primary.recordResponse(init, { status: 200, headers: { 'CMSD-Static': 'ot=i' }, timing: { startTime: 10, responseStart: 40, responseEnd: 90 } })
			primary.update({ sta: 'p', bl: 4000, pr: 1, ts: 1764752370500 })
			primary.update({ pr: 1.5, br: { v: 4200, a: 256 }, tb: { v: 6000, a: 350 }, pt: 1000 })
			primary.recordError('MEDIA_ERR_NETWORK')
			primary.update({ sta: 'r', ts: 1764752371000 })
			context.mock.timers.tick(1000)
			primary.update({ sta: 'p', ts: 1764752371800 })
			const ad = session.createReporter({ cid: 'ad-7' })
			ad.update({ nr: true, sta: 'p' })
			primary.recordEvent('abs')
			ad.recordEvent('as')
			requests.push(ad.decorate({ url: `${CDN}/ad-1.m4v` }, { ot: 'v', d: 4000 }))
			ad.recordEvent('ce', { cen: 'ad-quartile' })
			ad.recordEvent('sk')
			ad.recordEvent('ae')
			ad.dispose()
			primary.recordEvent('abe')
			primary.update({ bg: true })
			primary.update({ bg: false })
			primary.update({ cid: 'movie-43', sta: 'e' })
			context.mock.timers.tick(1000)
			session.rotate('session-id-456')
			primary.update({ sta: 's', ts: 1764752373000 })
			requests.push(primary.decorate({ url: `${CDN}/seg-9.m4v` }, { ot: 'v', d: 4000, 'com.example-tag': 'x' }))
			session.dispose()
			await flushPromises()

			ok(mock.bodies().length >= 15, `expected many reports, got ${mock.bodies().length}`)
			for (const body of mock.bodies()) {
				const result = validateCmcdEvents(body)
				deepEqual(result.issues.filter(issue => issue.severity === 'error'), [], `invalid body: ${body}`)
			}
			for (const request of requests) {
				const result = validateCmcdRequest({ url: request.url, headers: request.headers ? { ...request.headers } : undefined })
				deepEqual(result.issues.filter(issue => issue.severity === 'error'), [], `invalid request: ${request.url}`)
			}
			equal(session.sid, 'session-id-456')
		})
	}
})
```

Check the shape of the validator results in `libs/cmcd/src/CmcdValidationResult.ts` and `CmcdValidationIssue.ts` before running. Adjust the `issues` and `severity` member names to the real ones.

The exit `b` line is `e=b` without `bg`. The validator on `main` rejected it until the fix on branch `fix/cmcd-validator-b-event-without-bg` merged. If that fix is not on the branch yet, merge `main` into `feat/cmcd-session-api` first. Do not weaken the sweep.

- [ ] **Step 2: Run the sweep**

Run: `npm run build -w libs/cmcd && node --no-warnings --test libs/cmcd/test/CmcdSession.validation.test.ts`
Expected: PASS. A failing body names the line. Fix the emitter, not the test. If the validator itself is wrong, open an issue and reference it in a comment next to the affected line.

- [ ] **Step 3: Run the bundle probes**

The folder `libs/cmcd/temp/` is git-ignored. From the repository root:

```bash
mkdir -p libs/cmcd/temp/probe
printf "import { createCmcdSession } from '../../dist/index.js'\nexport { createCmcdSession }\n" > libs/cmcd/temp/probe/session-entry.ts
printf "import { CmcdReporter } from '../../dist/index.js'\nexport { CmcdReporter }\n" > libs/cmcd/temp/probe/reporter-entry.ts
printf "import '../../dist/index.js'\n" > libs/cmcd/temp/probe/bare-entry.ts
npx tsdown libs/cmcd/temp/probe/session-entry.ts libs/cmcd/temp/probe/reporter-entry.ts libs/cmcd/temp/probe/bare-entry.ts --format esm --minify --out-dir libs/cmcd/temp/probe/out --no-clean
for f in session-entry reporter-entry bare-entry; do printf "%s min=%s gz=%s\n" "$f" "$(wc -c < libs/cmcd/temp/probe/out/$f.js)" "$(gzip -c libs/cmcd/temp/probe/out/$f.js | wc -c)"; done
grep -c "CmcdReporter" libs/cmcd/temp/probe/out/session-entry.js
grep -v "^import" libs/cmcd/temp/probe/out/bare-entry.js | grep -c "[a-zA-Z]"
```

Expected: the `CmcdReporter` count in the session entry is `0`. The bare entry has no line with letters besides `import` lines, so the last count is `0`. If tsdown externalizes `@svta/cml-utils` or `@svta/cml-structured-field-values`, both entries externalize them the same way, and the comparison stays fair. If the `CmcdReporter` count is not zero, a session module imports something from the `CmcdReporter` module graph. Move that import to a shared file.

- [ ] **Step 4: Record the sizes**

In `plans/cmcd-session-api/comparison.md`, replace the three estimate rows of the Size table with the measured numbers:

```markdown
| Minified bundle, reporter entry | 18.8 KB | not measured | <session-entry min> KB |
| Minified with gzip | 7.1 KB | not measured | <session-entry gz> KB |
```

If the `reporter-entry` measurement differs from 18.8 KB and 7.1 KB, replace the baseline numbers too. The probe method must be the same for both. Delete the sentence after the table that calls the numbers estimates. Write instead that both entries were measured with the probe of Task 13 in `plans/cmcd-session-api/steps.md`, on the same day.

- [ ] **Step 5: Commit**

```bash
git add libs/cmcd/test/CmcdSession.validation.test.ts plans/cmcd-session-api/comparison.md
git commit -s -m "test(cmcd): validate every session API report and record the bundle sizes" -m "Co-Authored-By: Claude claude-fable-5-1 <noreply@anthropic.com>"
```

---

### Task 14: Documentation and the API report

**Files:**
- Modify: `libs/cmcd/docs/user-guide.md`, `libs/cmcd/README.md`, `libs/cmcd/CHANGELOG.md`, `plans/cmcd-session-api/architecture.md`, `rfc/cmcd-session-api.md`
- Review: `libs/cmcd/config/cml-cmcd.api.md`

- [ ] **Step 1: Add the session API to the user guide**

Insert the section of [`user-guide-section.md`](./user-guide-section.md) into `libs/cmcd/docs/user-guide.md`, after `## Installation` and before `## Basic Usage`. Copy it from its first heading to its last paragraph. Then run `bash plans/writing-style-compliance/check.sh HEAD libs/cmcd/docs/user-guide.md` and fix any `length` failure.

- [ ] **Step 2: Add the quick start to the README**

In `libs/cmcd/README.md`, insert a `## Reporting with a session` section after the `## Usage` block and before the `CmcdReportRecorder` section. Its body is the code block below, followed by one sentence: "The [user guide](docs/user-guide.md#reporting-with-a-session) describes the session API."

```typescript
import { createCmcdSession } from "@svta/cml-cmcd";

const session = createCmcdSession({
	eventTargets: [{ url: "https://collector.example.com/cmcd" }],
});
const reporter = session.createReporter({ cid: "movie-42" });

reporter.update({ sta: "p", bl: 3200, mtp: 15000 });
const req = reporter.decorate({ url: "https://cdn.example.com/seg-1.m4s" }, { ot: "v", d: 4000 });
const res = await fetch(req.url, { headers: req.headers });
await res.arrayBuffer();
reporter.recordResponse(req, { status: res.status, headers: res.headers });
```

Check that the example runs. Pipe the block into `node --input-type=module` from the repository root, with the import changed to `./libs/cmcd/dist/index.js`. The `fetch` call fails offline, which is fine, but the lines before it must not throw.

- [ ] **Step 3: Write the changelog entries**

Under `## [Unreleased]` in `libs/cmcd/CHANGELOG.md`, add an `### Added` section above `### Changed` with:

```markdown
### Added

- `createCmcdSession()`, the CMCD version 2 session API. One `CmcdSession` per playback and one `CmcdSessionReporter` per media player. The reporter derives `msd`, `bs`, `bsa`, `bsda`, `bsd`, `su`, `sn`, `h`, `bg`, and the response timing keys, keeps one `sid` and one sequence per target across players, and handles the event-mode delivery rules for 410, 429, and 5xx. `session.rotate()` changes the `sid`, and `session.configure()` changes the request-mode settings. `CmcdReporter` is unchanged. The design is in `rfc/cmcd-session-api.md`
- `CmcdEventType.HOSTNAME` and `CMCD_EVENT_HOSTNAME`, the `h` event of CTA-5004-B. The validators accept `e=h`
```

- [ ] **Step 4: Record the two deviations in the design record and the RFC**

In `plans/cmcd-session-api/architecture.md`:

- In the `emitReport` algorithm, replace step 1 with: `1. Normalize the report to structured-field values. When the target has a transform: run it on the normalized report, return on null, normalize the result, restore a removed required key, re-stamp sid, e, and ts.` The transform then receives an exact `Cmcd`, and the normalization produces the copies that protected the store.
- In the key table, change the `h` row to `| h | string | | event | | | | | h | | 128 | absent |`, so the `h` key is required on the `h` event like the other state-change keys.
- Add a row to the Testing table: `| Bundle probe | Task 13 of steps.md: no CmcdReporter code in the createCmcdSession entry, no module-scope code in a bare import, sizes recorded in comparison.md |`

In the Transforms section of `rfc/cmcd-session-api.md`, replace "The reporter copies nested values before a configured transform runs". The new text is "The reporter normalizes the report to structured-field values before a configured transform runs". In the Reports and targets section, add `h` on `h` to the list of required keys. The bullet becomes "- `sta` on `ps`, `pr` on `pr`, `cid` on `c`, `bg` on `b`, `br` on `bc`, and `h` on `h`".

Run `bash plans/writing-style-compliance/check.sh HEAD rfc/cmcd-session-api.md plans/cmcd-session-api/architecture.md libs/cmcd/CHANGELOG.md libs/cmcd/README.md` and fix any `chars`, `length`, or `abbrev` failure.

- [ ] **Step 5: Review the API report**

Run: `npm run build -w libs/cmcd && git diff --stat libs/cmcd/config/cml-cmcd.api.md && git diff libs/cmcd/config/cml-cmcd.api.md | grep "^+export" `

Expected: exactly the exports of the RFC's New exports table, `createCmcdSession`, the 18 types, `CMCD_EVENT_HOSTNAME`, and the `HOSTNAME` member. Anything else means an internal module leaked into `index.ts`.

- [ ] **Step 6: Run the full validation and commit**

Run: `npm test` from the repository root. It runs lint, the full build, the typecheck, and every package's tests.
Expected: PASS.

```bash
git add libs/cmcd plans/cmcd-session-api rfc/cmcd-session-api.md
git commit -s -m "docs(cmcd): document the session API and record the implementation deviations" -m "Co-Authored-By: Claude claude-fable-5-1 <noreply@anthropic.com>"
```

Push the branch and hand the pull request to Casey. The PR description names the RFC, lists the fourteen tasks, and reports the measured sizes.

---

## Execution notes

- Tasks 1 to 9 are sequential. Task 10, 11, and 12 are independent of each other once Task 9 is done. Task 13 needs 12. Task 14 needs 13.
- When a fixture fails, print the produced line next to the expected one before changing code. Most differences are a key the allowlist should have excluded, a rounding step, or an `sn` offset.
- Never change a fixture string to make a test pass. The fixtures are spec text, with the three documented adaptations: `sn` numbered from zero, the `bs` on the first line of 8.2.5, and the `ts` of the second line of 8.2.5.
