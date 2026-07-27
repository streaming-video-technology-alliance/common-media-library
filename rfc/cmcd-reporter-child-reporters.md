---
status: draft
---

# RFC: Child Reporters for `CmcdReporter`

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-07-23 (revised 2026-07-24) |
| **Package** | `@svta/cml-cmcd` |
| **Breaking change** | No |

## Summary

Add a `createChildReporter()` method to `CmcdReporter`. It creates a child reporter for another player that joins the same CMCD session. The main use case is the interstitial asset players of hls.js and Shaka.

A child owns the state of its own playback: `cid`, `sta`, `pt`, `bl`, `pr`, `br`, `nr`, its state-change dedup (duplicate suppression) baseline, and its request-mode report config. All session-wide state stays with the root reporter: the `sid`, every sequence number, the batched event queues and their timers, the session-wide `bg`, and the once-per-session `msd`. The result is one session on the wire: one `sid`, one increasing `sn` sequence per event target across all players, one `msd`, one stream of periodic reports.

The child is a real `CmcdReporter`, so the same player code works with a root or a child. Session-owned config (`sid`, `eventTargets`, `version`) is rejected at compile time, and there is no requester parameter. A child cannot change the session's identity, targets, or transport, and the reserved keys `sid` and `msd` are stamped by the reporter after all caller-supplied data, so no reporting call can override them either. A companion `activate()` method selects which reporter's data goes into periodic `TIME_INTERVAL` reports, so those reports describe the content the user is watching.

This proposal depends on a prerequisite fix PR that seals those reserved keys and repairs three related session-state bugs in the current single-reporter code. See [Prerequisite fixes](#prerequisite-fixes).

```ts
// The primary player owns the session
const reporter = new CmcdReporter({
	cid: 'primary-movie',
	enabledKeys: ['sid', 'cid', 'br', 'bl', 'mtp', 'ot', 'sf'],
	eventTargets: [{
		url: 'https://collector.example.com/cmcd',
		events: ['ps', 'e', 't', 'rr', 'as', 'ae', 'abs', 'abe'],
		enabledKeys: ['sid', 'cid', 'v', 'e', 'ts', 'sn', 'sta', 'url', 'rc', 'msd'],
		batchSize: 10,
	}],
})
reporter.start()

// An interstitial asset player reports into the same session
const child = reporter.createChildReporter({ cid: 'ad-creative-42' })

child.update({ sta: CmcdPlayerState.PLAYING, pt: 0 }) // child-owned playback state
child.recordEvent(CMCD_EVENT_AD_START)                // goes into the root's queues with the next shared sn
child.createRequestReport(segmentRequest)             // shared request-mode sn, child's cid
child.activate()                                      // TIME_INTERVAL reports now use the child's data
```

## Motivation

CMCD v2 expects one session to span several players. The `sid` key description says: "A playback session typically consists of the playback of a single media asset along with accompanying content such as advertisements. This session may comprise the playback of primary content combined with interstitial content." The `bg` key is defined as "All players in a session are currently in a state that is not visible to the user due to a user interaction". The spec clearly allows multiple players to report under one session ID.

`CmcdReporter` cannot do that today. All sequencing state is private to each instance: the per-target `sn` counters, `msdSent` flags, batching queues, and interval timers live in a private map keyed by that instance's own normalized config objects, and the request-mode `sn` counter and its `msdSent` flag live in a plain private field. Two reporters created with the same `sid` still have fully separate counters and queues.

The concrete failure is hls.js interstitials with CMCD v2 event reporting. Each `HlsAssetPlayer` wraps a full child `Hls` instance. The parent's config is copied into the child, so the child's `CMCDController` builds its own `CmcdReporter`. Even when the app sets `cmcd.sessionId` so the `sid` stays the same, every asset player:

- restarts each target's Sequence Number at 0, so the collector sees `sn` 0, 1, 2… repeated for each player within one `sid`. The spec requires `sn` to increase monotonically per combination of mode and target within a session;
- sends `msd` again, although it "MUST only be sent once per Session ID";
- starts its own `TIME_INTERVAL` timers, so each target receives duplicate periodic reports;
- keeps its own state-change dedup baseline, so the session's `ps`/`bc` events no longer come from one consistent source.

If the app does not set `cmcd.sessionId`, the result is worse: each asset player uses its own generated uuid, so every ad gets a different `sid` and the session falls apart. Shaka Player's `InterstitialAdManager` has the same problem: the secondary player copies the base player's CMCD config with no session coordination. dash.js shows the expected behavior: DASH ad periods play inside a single `MediaPlayer` with a single CMCD model, so one `sid` and one `sn` sequence happen automatically. Collectors already expect one `sid` to span content boundaries. Child-player architectures break that expectation today.

Neither available workaround is sound:

- **A second reporter with the same `sid`** cannot share counters, queues, timers, or `msd` state. They are private to each instance by design, and making them public would expose mutable internals.
- **Sharing one reporter instance between players** corrupts state. The reporter has a single data store, so a preloading asset player that writes `sta: 'd'` overwrites the presenting player's data. A single dedup baseline suppresses real transitions: the ad's `sta: 'p'` hides the primary player's later resume event. And a `cid` that switches between content and ad fires an incorrect `c` event on every write.

Players need one reporter-shaped object per player, with one shared session behind them. That split (playback state per player, session state owned once) is this proposal.

## Guide-level explanation

### Creating a child reporter

A root reporter is constructed exactly as today and owns the session. Each additional player in the session gets a child:

```ts
const child = reporter.createChildReporter({
	cid: 'ad-creative-42',       // this playback's content ID; deliberately not inherited
	// enabledKeys, transmissionMode: inherited from the creating reporter unless overridden
})
```

The child is a real `CmcdReporter`. Every method a player calls (`update()`, `recordEvent()`, `recordResponseReceived()`, `createRequestReport()`, `start()`, `stop()`, `flush()`, `isRequestReportingEnabled()`) has the same signature and works on a child. The same integration code drives the primary player and every asset player.

The child **owns** (per playback): its data store (`cid`, `sta`, `pt`, `bl`, `pr`, `br`, `mtp`, `ot`, `nr`, …), its state-change dedup baseline, and its whole request-mode report config (`enabledKeys`, `transmissionMode`, `customHeaderMap`, `transform`; useful when an ad CDN needs query params instead of custom headers, or routes custom keys differently).

The child **shares** (per session, root-owned): the `sid`, each event target's version, `sn` counter and queue, the request-mode version and `sn` counter, the `TIME_INTERVAL` timers, the once-per-session `msd`, the session-wide backgrounded state (`bg`), and the event-report requester.

`bg` is root-owned and root-written: `child.update({ bg })` is ignored, the same as `child.update({ sid })`. The key means "all players in a session" are hidden, which no single player can establish. See [`bg`](#bg-is-root-owned).

Session-owned settings cannot be passed to a child. The compiler rejects them, and the editor tooltip explains why:

```ts
reporter.createChildReporter({
	cid: 'ad-creative-42',
	// sid: '...'          ← compile error: the session ID is owned by the root
	// eventTargets: [...] ← compile error: targets, queues, and timers are root-owned
	// version: CMCD_V2    ← compile error: the version is root-owned, per mode and per target
})
```

### One session on the wire

Events recorded by a child go into the root's per-target queues and take the next shared sequence number. Reports from all players form one increasing `sn` sequence per target (some keys omitted for readability):

```text
POST https://collector.example.com/cmcd

cid="primary-movie",e=ps,sid="f7a0…",sn=17,sta=p,ts=1753305600000,v=2
cid="primary-movie",e=abs,sid="f7a0…",sn=18,ts=1753305601000,v=2          ← parent: ad break starts
cid="ad-creative-42",e=ps,sid="f7a0…",sn=19,sta=p,ts=1753305601500,v=2    ← child: same sid, next sn
cid="ad-creative-42",e=rr,rc=200,sid="f7a0…",sn=20,ts=1753305602000,v=2   ← child media response
```

Collectors use the `cid` on each line to attribute it to a playback, and can rebuild the session from one continuous `sn` sequence per target. `msd` is sent on exactly one report per target per mode for the whole session, no matter which player's report carries it. A pre-roll asset player may supply the session's `msd`: the spec measures to when "any media begins playback, whether it be primary content or interstitial content".

### `activate()`: periodic reports follow the presented content

The root owns the `TIME_INTERVAL` timers. A child's `start()` is a safe no-op, and its `stop()` never touches the timers, so creating and destroying asset players cannot duplicate or stop the periodic reports. By default, periodic reports use the root's data. When an interstitial starts presenting, make its reporter the active one:

```ts
child.activate()    // TIME_INTERVAL reports now use the ad's cid/sta/pt/bl
// …ad ends…
reporter.activate() // reports use primary data again
```

`activate()` is optional. Without it, periodic reports keep describing the root's playback. A child's `stop()` returns the active role to the root if that child held it, so normal teardown needs no extra code. Two details: the return-to-root happens on every `stop()`, not only at teardown, and `start()` never takes the active role, because that would let a preloading child take it from the presenting player. A controller that stops and restarts a child that is still presenting (for example, a runtime CMCD disable/enable toggle) must call `activate()` again after `start()`.

### Lifecycle

Children are cheap and disposable. Create one per asset playback and drop it.

- `child.start()`: no-op. The session's timers are already running, and player churn must not send extra `t` events.
- `child.stop()`: returns the active role to the root if held. Session timers are not touched.
- `child.stop(true)` / `child.flush()`: flushes the session's queues. A child's recorded events are never lost on teardown, because they already live in the root's queues.
- There is no dispose method to forget. The root holds no reference to its children, except the active-reporter pointer, which is cleared by `child.stop()` or by the next `activate()` (see Drawbacks for what happens if neither is called). A dropped child is normal garbage. A child holds a strong reference to its root, so the session stays alive while any child lives. This is intended.

### hls.js interstitials integration

The whole change lives inside hls.js: one config field, one `createChildReporter()` call, two `activate()` calls at existing interstitials-controller trigger points, and an internal hook that gives the interstitials controller the primary reporter. `CMCDController` accepts an injected reporter, and `createAssetPlayer()` creates a child per asset. Config object values already flow from parent to child by reference, so `playerConfig.cmcd` is a proven channel. The block below sketches the hls.js diff; identifiers other than `createChildReporter`, `activate`, and `cmcd.reporter` are existing hls.js internals:

```ts
// config: one new field on the existing cmcd config surface.
// Typed structurally, so an app that resolves a separate copy of
// @svta/cml-cmcd can still inject. `Pick` drops the class's private
// members, which are what make a bare `CmcdReporter` annotation
// nominal and reject cross-copy instances. See Drawbacks.
type InjectedCmcdReporter = Pick<CmcdReporter,
	'update' | 'recordEvent' | 'recordResponseReceived' | 'createRequestReport' |
	'createChildReporter' | 'activate' | 'start' | 'stop' | 'flush' |
	'isRequestReportingEnabled'>;

type CMCDControllerConfig = {
	// …existing: sessionId, contentId, useHeaders, includeKeys, eventTargets, loader…
	/** A reporter injected by a parent player. When set, this player reports
	 *  into the parent's CMCD session instead of creating its own. */
	reporter?: InjectedCmcdReporter;
};

// cmcd-controller.ts: one line changes; the rest is today's construction, abridged
this.reporter = cmcd.reporter ?? new CmcdReporter({
	sid: cmcd.sessionId || hls.sessionId,
	cid: cmcd.contentId,
	transmissionMode: cmcd.useHeaders ? CMCD_HEADERS : CMCD_QUERY,
	enabledKeys: cmcd.includeKeys ?? CMCD_KEYS, // today's version-dependent default, abridged
	eventTargets: cmcd.eventTargets,
}, cmcd.loader)
this.reporter.start() // child: safe no-op

// interstitials-controller.ts: createAssetPlayer(). The parent reporter is the
// primary CMCDController's reporter, made available to this controller as part
// of the diff. hls.js already overrides contentId with hash(assetItem.uri)
// here today; keeping that override keeps the child player's config and its
// reporter in agreement on the asset's cid.
if (cmcd && parentReporter) {
	const contentId = hash(assetItem.uri) // hls.js's existing url-hash util
	const childReporter = parentReporter.createChildReporter({ cid: contentId })
	playerConfig.cmcd = { ...cmcd, contentId, reporter: childReporter }
}

// interstitials-controller.ts: active-reporter transfer at the two existing
// trigger sites. This controller creates the child, keeps it, and dispatches
// both events, so no public accessor is needed. This wiring assumes the asset
// presents on its own media element; the right active reporter under
// `interstitialAppendInPlace` (the parent media element keeps presenting) is
// an open question, per Unresolved questions.
// …where INTERSTITIAL_ASSET_STARTED is dispatched:
childReporter.activate() // TIME_INTERVAL reports now use the ad's cid/sta/pt/bl
// …where INTERSTITIALS_PRIMARY_RESUMED is dispatched:
parentReporter.activate() // reports use primary data again

// Teardown needs nothing new: clearAssetPlayer() → child Hls destroy() →
// CMCDController.destroy() → child.stop(true). Reporters released on the
// error path (resetAssetPlayer) are handled the same way.
```

### Non-rendered players and `nr`

A session with children is a session where several players fetch media and at most one renders it. That is exactly what `nr` ("non rendered") is for: "True when the content being retrieved by a player is not rendered as audio or video. The key SHOULD only be sent when it is TRUE."

`nr` needs no new machinery, because it lives in each reporter's own data store, which is already per player. It does need wiring, and the companion integrations should do it. The invariant is one line: **the active reporter is the one that does not set `nr`.** Every other reporter in the session is fetching content nobody is watching.

In hls.js terms:

- An asset player preloading an upcoming interstitial sets `nr: true` alongside its `sta: 'd'`, and clears it when it starts presenting.
- The primary player sets `nr: true` while an interstitial presents on its own media element, and clears it on `INTERSTITIALS_PRIMARY_RESUMED`, next to the existing `activate()` call.
- Under `interstitialAppendInPlace` the parent media element keeps presenting, so which player is non-rendered depends on the answer to the active-reporter question in [Unresolved questions](#unresolved-questions). The two settle together.

Preloading otherwise needs no changes: an asset player that buffers ahead sends request-mode reports (with its own `cid`, `sta: 'd'`, and `nr: true`) using the shared request-mode `sn` while another player presents.

### Ad-insertion SDKs

A player can hand any reporter, root or child, to an ad SDK. The SDK creates one child per creative. Creating a child from a child gives another child of the same root (the hierarchy stays flat), and it inherits the creating reporter's `enabledKeys`/`transmissionMode`:

```ts
adSdk.initialize({
	// The SDK gets the full CmcdReporter API for its own playback.
	// It cannot change the session, the targets, or the transport.
	cmcd: reporter.createChildReporter({ transmissionMode: CMCD_QUERY }),
})

// Inside the SDK, typed only against CmcdReporter:
const ad = this.cmcd.createChildReporter({ cid: creative.adId })
ad.recordEvent(CMCD_EVENT_AD_START)
// …
ad.recordEvent(skipped ? CMCD_EVENT_SKIP : CMCD_EVENT_AD_END)
ad.stop()
```

## Reference-level explanation

### New public surface

One new type-only file, `CmcdChildReporterConfig.ts`, exported from the index via `export type *`, plus two methods on `CmcdReporter`. Expected `cml-cmcd.api.md` diff: the `CmcdChildReporterConfig` type, `CmcdReporter.createChildReporter()`, and `CmcdReporter.activate()`.

```ts
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'

/**
 * Configuration for a child CMCD reporter created with
 * {@link CmcdReporter.createChildReporter}.
 *
 * A child configures its own request-mode reports and nothing else. The
 * playback-scoped members are inherited wholesale from
 * {@link CmcdRequestReportConfig}, so anything that becomes valid
 * request-report config becomes valid child config with no edit here.
 *
 * Session-owned settings (`sid`, `eventTargets`, `version`) belong to the
 * session's root reporter. They are declared `never`, so passing them fails
 * at compile time, even through a widened, non-literal object, and the
 * tooltip explains why.
 *
 * @public
 */
export type CmcdChildReporterConfig = Omit<CmcdRequestReportConfig, 'version'> & {
	/**
	 * The content ID of the playback this child reports on. It is deliberately
	 * NOT inherited from the parent: omitting it reports no `cid`, which is
	 * safer than attributing the child's traffic to the parent's content.
	 *
	 * @defaultValue `undefined`
	 */
	cid?: string;

	/** The session ID is owned by the session's root reporter and cannot be set on a child. */
	sid?: never;

	/** Event targets (URLs, batching, timers, `sn` counters, queues) are owned by the session's root reporter and cannot be set on a child. */
	eventTargets?: never;

	/** The CMCD version is owned by the session's root reporter and cannot be set on a child. */
	version?: never;
}
```

Inheriting from `CmcdRequestReportConfig` rather than listing members by hand is deliberate. Every member of that type is request-mode encoding config, which is precisely the playback-scoped category a child owns: today `enabledKeys`, `transmissionMode`, `customHeaderMap`, and the `transform` shipped in [#399](https://github.com/streaming-video-technology-alliance/common-media-library/pull/399). All of them default to the creating reporter's value. Session state lives on `CmcdReporterConfig` instead (`sid`, `eventTargets`) or is `version`, so it is absent here by construction.

The single `Omit` is not a retreat from the `never`-typed locks argued for in [Rationale](#rationale-and-alternatives). It removes `version` from the inherited members only so the explicit `version?: never` lock below can replace it without a type conflict. The locks stay declared, auditable, and visible in tooltips.

One maintenance obligation follows from the inheritance direction: a **new session-owned field** added to `CmcdReporterConfig` needs an explicit `never` lock added here. It is not silently child-overridable (it is not inherited at all, and object literals reject it as an excess property), but without the lock it is also not explained. A type-level test pins the full lock list so the omission is caught in review.

```ts
export class CmcdReporter {
	/**
	 * Creates a child reporter that reports its own playback under this
	 * reporter's session. The child owns its data store, its state-change
	 * dedup baseline, and its request-mode encoding config. It shares the
	 * session's `sid`, version, sequence numbers, queues, timers, `msd`, and
	 * requester. Calling this on a child creates another child of the same
	 * root (the hierarchy is flat).
	 */
	createChildReporter(config: CmcdChildReporterConfig = {}): CmcdReporter

	/**
	 * Makes this reporter the session's active playback. TIME_INTERVAL
	 * reports then use this reporter's data. The root is active by default.
	 * A child's `stop()` returns the active role to the root if that child
	 * held it. An explicit `activate()` is always honored, including on a
	 * previously stopped child; call it again after restarting a child that
	 * is still presenting.
	 */
	activate(): void
}
```

There is no requester parameter on `createChildReporter`: a child cannot change the session's transport. At runtime the implementation reads only the request-report members and `cid` from the config. A session-owned field passed through `as any` or from plain JavaScript has no effect. This is a tested invariant, not an implementation accident.

### Reserved keys are stamped, not merged

Locking the child *config* is only half of "a child cannot change the session." Every reporting method also takes a `Partial<Cmcd>` of per-call data (`recordEvent()`, `recordResponseReceived()`, `createRequestReport()`), and that data is merged **over** stored state. Two session-owned keys leak through it today:

- `sid`: `recordEvent('ps', { sid: 'other' })` puts `sid="other"` on the wire. On a child that would emit a foreign session ID into the root's queue, carrying a shared `sn` drawn from this session's counter.
- `msd`: a per-call `msd` survives into the report whether or not the once-per-session gate has already fired, so it can be sent more than once under one `sid`, violating "MUST only be sent once per Session ID".

So `sid` and `msd` must be stamped by the reporter **after** all caller-supplied data, in both modes. This is not a new mechanism. [#399](https://github.com/streaming-video-technology-alliance/common-media-library/pull/399) already established it for transforms: `queueTargetEvent()` re-stamps `e` and assigns `sn` and `msd` after a transform runs, so "a transform cannot bypass the target's `events` filter via `e` or break `sn` continuity", and the request path stamps its reporter-owned fields the same way. The fix extends that existing stamping step to cover `sid`, and makes the `msd` gate authoritative rather than merely additive. It lands in the [prerequisite PR](#prerequisite-fixes), because it changes root behavior too.

`v` needs no such treatment, which is worth stating because the opposite is easy to assume. `prepareCmcdData()` already re-stamps `v` from the encoding options on every report in both modes, so neither per-call data nor `update({ v })` can change the emitted version.

### State partition

| State | Scope | Rationale |
|---|---|---|
| `sid` | Session | The spec's session spans primary and interstitial content on one device. Children never store a `sid`. It is injected from the root when each report is created, together with the `sn`, so a root `sid` change needs no notifications. |
| `v` / config `version` | Session, per mode and per target | Root-owned, but *not* one value per session. Each event target already carries its own `version`, and the request path uses the top-level one. `v` is re-stamped from the encoding options on every report, so children inherit whatever the target or mode they are reporting through is configured for, and cannot set either. See [Versions are per mode and per target](#versions-are-per-mode-and-per-target). |
| Per-target event `sn` counters | Session | `sn` is per (session, mode, target) and "MUST be reset to zero on the start of a new session-id". It is assigned at enqueue on the root's counters, so all players form one increasing sequence per target with no gaps. This is the bug being fixed. |
| Request-mode `sn` counter | Session | Same spec clause. Separate counters would emit duplicate `sn` values whenever players share a CDN, which is the normal interstitials case. See Rationale for the shared-counter argument. |
| `msd` value + per-target/request-mode `msdSent` flags | Session | "MUST only be sent once per Session ID and MUST be sent for each reporting mode which is active within the player." In a multi-player session, this design applies the per-mode clause to the session, not to each player: the root's flags gate emission no matter which player's report carries the value, so a child does not re-send a value the session already sent. |
| Event queues, batching, failure re-queue, HTTP 410 disposal | Session | One owner by construction: no queue edits from two owners, no duplicate targets, and a 410 silences the target for every player at once. |
| `TIME_INTERVAL` timers | Session | Exactly one periodic report stream per target per session. Child `start()`/`stop()` cannot arm or disarm the timers. |
| Active-reporter pointer (new) | Session | Selects whose data goes into `t` reports. Root by default; changed by `activate()`; returned to the root by `child.stop()`. |
| Requester | Session | Only event-report POSTs use it, and only the root sends them. |
| Data store (`cid`, `sta`, `pr`, `bl`, `mtp`, `pt`, `br`, `ot`, `nr`, …) | Per player | These fields describe one playback. A preloading child's `sta: 'd'` must never overwrite the presenting player's data. `nr` belongs here too: in a multi-player session it is per player by definition, and the active reporter is the one that does not set it. |
| `lastEmitted` dedup baseline | Per player | Dedup answers "did this player's state change". A shared baseline would suppress real transitions: an ad's `sta: 'p'` would hide the primary player's later identical resume. See Unresolved questions. |
| `bg` value + its dedup baseline | Session, root-written only | The spec scopes `bg` to *all* players in a session, which no single player can establish. Only `root.update({ bg })` writes it; `child.update({ bg })` is ignored, like `child.update({ sid })`. `bg` is injected into every report next to `sid`, so an active child's periodic reports still carry the session's backgrounded state. Its dedup baseline is session-level, so one `b` event fires per real transition. See [`bg` is root-owned](#bg-is-root-owned). |
| Request-mode report config (`enabledKeys`, `transmissionMode`, `customHeaderMap`, `transform`) | Per player (inherited by default) | Request-mode encoding is per player/CDN. An ad CDN may need query params where the primary CDN accepts headers, or a different custom-key header routing. |

#### Session-scoped counters are the application's job

`bsa`, `bsda`, and `dfa` are absolute counts "since session initiation", and `bsd` "MUST only be reported once per reporting mode and report destination". All four are spec-scoped to the session, but all four are values only a player can measure, and the reporter cannot aggregate them: it has no way to know whether a given input is a session total or a per-playback delta, so summing would be wrong as often as it was right.

v1 therefore does not aggregate, and this RFC states the consequence plainly rather than filing it under future work. A session whose players each supply their own local values will emit *decreasing* "since session initiation" counts under one `sid` when a child with a low count reports after a root with a high one. That is a spec violation, and the only correct fix available at this layer is documentation: **the application owns these four keys and must supply session totals**, either by writing them on the root only, or by tracking cross-player totals itself and writing the total to whichever reporter is active.

`bsd` also exposes an inconsistency in this proposal that reviewers should weigh. It is a once-per-mode-per-destination key, the same clause shape that motivates session-gating `msd`, yet it has no gate at all, for roots today or for children here. Either it deserves the `msd` treatment or `msd`'s treatment needs a narrower justification. Gating it changes existing root behavior, so it is not bundled here. See [Unresolved questions](#unresolved-questions).

### Event-mode sequence numbers

Every reporter in a session enqueues through the root's target map. `sn` is assigned at enqueue time (`target.sn++`) on the root's counters, the same place as today. JavaScript is single-threaded, so enqueue order is total, and the single owner dispatches batches in queue order. Delivery order across batches is not guaranteed under retry (today or with children): a batch re-queued after a 429/5xx can arrive after a later-`sn` batch that was already in flight. That is allowed by the spec, because `sn` is assigned at enqueue: `sn` orders the target's reports, not arrival time. The result per (sid, target) is one increasing sequence with no gaps, across the root and any number of children, with batches interleaving all players' events in call order. Events suppressed by dedup, or dropped for a missing required field, consume no `sn`, as today.

### Request-mode sequence numbers

`createRequestReport()` on any reporter takes the next number from the root's request-mode counter. `msd` on the request path is gated by the root's request-mode `msdSent` flag. The child's own request-report config controls the encoding.

There is one shared counter for all request-mode reports, which is exactly today's behavior: `createRequestReport()` already increments a single counter regardless of which host the request goes to. Verified against the built package, with no children involved, requests to two CDNs draw from one sequence:

```text
cdn-a.example → sn=0
cdn-a.example → sn=1
cdn-b.example → sn=2   ← starts at 2, and cdn-a's activity moved it
cdn-b.example → sn=3
```

The spec says sequence numbers "increase independently per each combination of mode and target," and "independently" is fair to read as *cdn-a's traffic should not move cdn-b's numbers*. Under that reading this behavior is already wrong today, for a single reporter with no children.

What this RFC changes is not the mechanism but how much it matters. A single player usually talks to one CDN, so one counter approximated one target well enough. The headline use case here, a primary player plus an interstitial from an ad CDN, is precisely the case where one counter starts describing two real targets. This proposal does not introduce the conflation, but it does make it load-bearing, so it should be settled rather than inherited: see [Unresolved questions](#unresolved-questions).

Fixing it is not simply "key the counter by origin," which is why it is a question and not a decision. Origin is not target identity: one CDN serves many hostnames and one hostname can front several CDNs, so a per-origin map is a heuristic that can split one target or merge two. It is also unbounded, growing an entry per host, where today the cost is one integer. And changing it alters existing root output, so it belongs with the other behavior changes, not inside a feature addition.

### Versions are per mode and per target

An earlier draft of this RFC claimed one CMCD version per session, on the grounds that mixed versions under one `sid` would confuse collectors. That was wrong twice over, and the claim is withdrawn.

It contradicts the library: each event target already takes its own `version`, and reports to that target are encoded with it. A target configured `CMCD_V1` emits a line with no `v` key today, alongside a `CMCD_V2` target under the same `sid`.

It also contradicts the spec, which *recommends* the mixture. Player Processing Requirements says a player "SHOULD support sending CMCD data using v1 syntax […] for Request Mode, while utilizing CMCD v2 syntax (e.g., including v=2) for data transmitted via Event Mode," so that CMCD v1 CDN infrastructure keeps working. Promising one version per `sid` would rule out the compatibility path the spec asks for.

The correct statement is narrower, and it is enough for children: **version is root-owned, per mode and per target.** The request path uses the top-level `version`; each event target uses its own. `v` is re-stamped from the encoding options when each report is prepared, so a child automatically emits whatever version the mode and target it is reporting through are configured for. A child sets neither, which is why `version` is a `never` lock in the child config.

### `msd`

The session owns `msd`. `update({ msd })` from any reporter, root or child, writes through to the session, and the first accepted value wins: it fixes the session's `msd` until a session reset (`sid` change). The spec measures startup delay until *any* media begins playback, so a pre-roll asset player may supply the session's `msd`, and the primary player's later value must not replace it.

First-write-wins only works if "accepted" is defined, and today it is not. The current guard is `if (data.msd && !isNaN(data.msd))`, which:

- **rejects `0`**, a legitimate value, because it is falsy;
- **accepts `Infinity`**, which is stored but then dropped by the encoder, so it never reaches the wire;
- **accepts negatives**: `update({ msd: -500 })` emits `msd=-500` today.

Under last-write-wins these are ordinary input bugs, self-correcting on the next write. Under first-write-wins they become permanent: an `Infinity` or a negative accepted first would lock the session's `msd` for its whole lifetime, and in the `Infinity` case lock it to a value that can never be emitted at all, with no later valid value able to replace it. So the validation is a precondition of this design, not a tidy-up alongside it. The rule becomes: accept a finite, non-negative number, which admits `0` and rejects the rest. It lands in the [prerequisite PR](#prerequisite-fixes) because it changes root behavior.

This tightens today's root behavior on purpose. Today, `update({ msd })` always overwrites the stored value, and each event target and the request path capture whatever value is current at their own first report. A mid-session revision can therefore already send *different* `msd` values across targets and modes under one `sid`, which conflicts with "once per Session ID". Keeping the first accepted write guarantees one value everywhere. Emission is unchanged: at most once per target and once on the request path, per session.

About the spec's trailing qualifier, "for each reporting mode which is active within the player": this design treats the once-per-Session-ID MUST as the controlling rule in a multi-player session. The per-mode clause selects which modes must carry `msd`; the session rule caps how often it may be sent. A second player re-sending it under the same `sid` would break that cap.

### State-change dedup

Each reporter dedups `sta`/`pr`/`cid`/`br` transitions against its own baseline, so two players never suppress each other's transitions. (`bg` is the exception: only the root writes it, it dedups against a session-level baseline, and a root `sid` change clears that baseline together with the per-player ones.) The accepted consequence: the session stream may contain adjacent state events with the same value from *different* players. For example, the primary emits `ps` with `sta: 'p'`, then the ad child starts playing and also emits `ps` with `sta: 'p'`. Each report carries its own `cid`, so collectors can attribute both correctly. Whether the spec means dedup per player or per session stream is an unresolved question below. The implementation keeps the baselines movable to the session without a public API change.

### `bg` is root-owned

`bg` is defined as "All players in a session are currently in a state that is not visible to the user due to a user interaction," and "SHOULD only be sent if it is TRUE."

That definition is a statement about every player at once, so no individual player can establish it. An earlier draft let any reporter write `bg` through to session state on a last-write-wins basis, reasoning that page-level `visibilitychange` gives every player the same visibility anyway. That holds for the dominant case, a hidden tab, and fails for exactly the cases this RFC exists to serve: an interstitial presenting in a PiP window, or a preloading asset player attached to no visible element. In those, one player writing `bg: true` publishes a session-wide claim that is false. Combined with "SHOULD only be sent if it is TRUE," a false positive is the worst available direction of error, because the key's presence is itself the assertion.

So `bg` is root-owned and root-written. `child.update({ bg })` is ignored, the same as `child.update({ sid })`, and for the same reason: it is session identity, not playback state. The value is injected into every report next to `sid`, so an active child's periodic reports still carry the session's backgrounded state without being able to set it.

This puts the key where the knowledge is. Visibility is a page-level fact that the application observes once, via `visibilitychange` on the document, not something each player discovers separately. An application already has to decide what "hidden" means for its own layout; writing that decision to the root is both correct and less work than wiring a listener into every player.

The rejected alternative was aggregation: track visibility per reporter and emit `true` only when all of them are hidden. That is the most literal reading of the spec, and it stays available as a later refinement. It is rejected for v1 because it requires the root to hold a registry of live children in order to poll them, which is precisely the reference the design avoids everywhere else: children are currently garbage the moment they are dropped, and a registry would make every forgotten `stop()` a leak. Paying that for a key the application can set correctly in one line is the wrong trade.

### `TIME_INTERVAL` and the active reporter

Periodic reports use the active reporter's data: the root by default, changed by `activate()`, returned to the root by `child.stop()` if that child was active. Two alternatives were rejected. *Root data only*: during a pre-roll, periodic reports would describe an idle primary player, which is misleading. The obvious workaround, copying ad fields into the root with `update()`, is worse: it fires root-attributed state events with ad values and corrupts the root's dedup baseline. *Merged data*: mixing the primary's `pt` with the ad's `bl` produces reports that describe no real playback. The active-reporter model costs one pointer and matches the "currently presenting item" concept players already track.

### `cid`

A `cid` in the child config seeds the child's store without firing a `c` event. This matches the root constructor, which also seeds `cid` silently. The child's first recorded event already carries its `cid`. A player that wants an explicit content-change marker calls `child.recordEvent(CMCD_EVENT_CONTENT_ID, { cid })`; the child's empty baseline guarantees it fires exactly once. When an interstitial ends, the root's store still holds the primary `cid`, so later root reports carry it without a `c` event (the root's baseline never changed). Collectors attribute by the `cid` key on each report, not by counting `c` events.

### `sid` ownership and session reset

Children cannot change the session. At compile time, `sid` is `never`-typed in the child config. At runtime, `child.update({ sid })` ignores the key, as does `child.update({ bg })`, and a per-call `sid` in any reporting method is overwritten by the reporter's stamp (see [Reserved keys are stamped, not merged](#reserved-keys-are-stamped-not-merged)). Throwing was rejected because reused controller code forwards whole data objects. Forwarding to a session-wide reset was rejected because an ad SDK must not be able to reset the app's session by accident (see Unresolved questions for a dev-mode warning).

Root `update({ sid })` resets the session as today (all shared `sn` counters to zero, dedup baseline cleared), and the reset now also reaches children: each child notices the session change on its next call and clears its own baseline. Later child reports carry the new `sid` automatically, because `sid` is injected at report-creation time: the root's current `sid` is captured into each report at the same moment its `sn` is assigned (`target.sn++` at enqueue for event mode; the `createRequestReport()` call for request mode), never later in the send or encode path. Events already in the queues at the moment of the change keep the old `sid` with their old `sn` and drain as the last reports of the old session. A batch sent after the change may therefore mix old-`sid` lines with new-`sid` lines that start at `sn` 0. Each line is internally consistent, so both the reset-to-zero rule and per-session monotonicity hold.

### Lifecycle semantics by role

| Method | Root (unchanged) | Child |
|---|---|---|
| `start()` | Arms timers; sends the first `t` report immediately | No-op; never takes the active role. Call `activate()` again after restarting a child that is still presenting |
| `stop()` | Disarms timers | Returns the active role to the root if held; timers untouched |
| `stop(true)` | Flush + disarm | Flushes session queues + returns the active role |
| `flush()` | Flushes all queues | Delegates to the root (the queues cannot be split) |
| `update()` / `recordEvent()` / `recordResponseReceived()` | As today | Child-local store and baseline (`msd` writes through to the session; `sid` and `bg` are ignored); enqueues into the root's queues |
| `createRequestReport()` | As today | Child's request-report config; shared session `sn`/`msd` |
| `isRequestReportingEnabled()` | As today | Answers for the child's own `enabledKeys` |

A child stays usable after `root.stop()`, exactly like the root itself: recording still enqueues, and batch-size sends still fire; only the timers are off. There is no session "destroy": releasing all references ends the session through garbage collection, as today.

### Target disposal and failure re-queue

Both stay in the root's send path, unchanged. An HTTP 410 removes the target from the single session map and silences it for every player at once. A 429/5xx puts the failed batch back at the front of the single per-target queue. Children add no second owner, so the failure modes of naive queue sharing (interleaved queue edits, repeated reprocessing, re-queueing into a removed target) cannot occur.

### Grandchildren

`child.createChildReporter()` returns another direct child of the root, so delegation depth is always exactly one and hot paths never walk a chain. The request-report config defaults come from the *creating* reporter, not the root: an ad SDK holding a query-mode child creates query-mode grandchildren without knowing whether it holds the root.

### Concurrency

Guaranteed with any number of live children: one increasing `sn` per event target, and one increasing `sn` across request mode, because all assignment goes through the root's counters on one thread; independent stores and baselines, so a preloading child's `sta: 'd'` never affects the presenting player's reports; `msd`/`msdSent` gate once-only keys no matter which reporter writes first; exactly one periodic report stream exists. Note the asymmetry: event mode is per target, request mode is one counter for every target, which is today's behavior and an open question rather than a guarantee this proposal makes (see [Unresolved questions](#unresolved-questions)). Not guaranteed, and documented: periodic reports describe only the active playback (two players presenting at the same time get no merged report), and cross-player event order inside a batch is call order. That is allowed: `ts` records when the event happened, and `sn` orders the target's reports.

### Prerequisite fixes

Four existing single-reporter bugs sit on this feature's paths. Three of them are not merely adjacent: this design's guarantees are false until they are fixed. They land in **their own PR, before this feature**, as `### Fixed` entries, rather than riding along here. Two reasons: every one of them changes report output for existing single-reporter usage, which deserves its own reviewable diff and changelog entry, and their fixes are what this feature's invariants rest on, so they should be verifiable independently of a much larger feature.

| Fix | Why it blocks this feature |
|---|---|
| **Reserved keys are merge-overridable.** A per-call `sid` reaches the wire, and a per-call `msd` bypasses the once-per-session gate. Stamp both after caller data, extending the mechanism [#399](https://github.com/streaming-video-technology-alliance/common-media-library/pull/399) already added for transforms. | "A child cannot change the session's identity" is false without it. A child could emit a foreign `sid` into the root's queue, or re-send `msd` under one `sid`. |
| **`msd` input is not validated.** `if (data.msd && !isNaN(data.msd))` rejects `0`, accepts `Infinity`, and accepts negatives. Accept finite and non-negative instead. | First-write-wins makes a bad first value permanent for the session, and an `Infinity` locks `msd` to a value the encoder can never emit. |
| **`resetSession()` never clears `msd`/`msdSent`.** After a `sid` change, a new `update({ msd })` is silently never sent: the old session's flags block the new session's `msd` forever. That violates "once per Session ID", which means once per *each* session, not once per reporter. | The session-wide `msd` gate is the mechanism children share. Sharing a broken gate spreads the bug across every player. |
| **`update({ sid: undefined })` removes `sid` from all later reports.** The guard skips the session reset for a missing `sid`, but the merge still writes the explicit `undefined` into the store. | Fixed for free by stamping `sid` at report-creation time, which children need anyway. |

The `msd` first-write-wins change itself also alters root behavior: today `update({ msd })` can be revised at any time and is captured per target at enqueue, so a root-only app that revises `msd` before its first report would lose the revision. That one is a consequence of this proposal rather than a pre-existing bug, so it stays here. See [Unresolved questions](#unresolved-questions).

Two things previously flagged in this section have been withdrawn as factually wrong. Root `update({ v })` does **not** rewrite the version mid-session, and a per-call `v` does not either: `prepareCmcdData()` re-stamps `v` from the encoding options on every report. There is nothing to lock.

### Interaction with report transforms

Per-placement report transforms shipped in [#399](https://github.com/streaming-video-technology-alliance/common-media-library/pull/399), so this is a dependency on merged code rather than a composition claim about a pending proposal. An earlier draft of this RFC said the two composed "without changes to either." That was wrong on the request side, and it contradicted its own next sentence.

**Event mode composes with no changes.** A target's `transform` runs at enqueue on the root's targets, so it sees child reports too; `data.cid` identifies the source, and `queueTargetEvent()` stamps `e`, `sn`, and `msd` after the transform runs, on the root's counters.

**Request mode requires a change, and this RFC makes it.** `transform` lives on `CmcdRequestReportConfig`, so it is playback-scoped and must be child-configurable and inherited from the creating reporter. Rather than list it by hand and risk the same drift again, `CmcdChildReporterConfig` now derives its members from `CmcdRequestReportConfig` wholesale, so `transform`, `customHeaderMap`, and anything added to request-report config later are child-configurable with no edit to this type. See [New public surface](#new-public-surface).

### Internal implementation shape

No public `CmcdSession` type is added, but the implementation groups the session-owned state (counters, queues, timers, `msd` state, requester, active pointer) behind one private session reference: `this` for a root, the root for a child. Root hot paths pay one extra property read and no new branches, and a future public session object (N sibling reporters, no special root) stays purely additive. Session resets reach children through a lazily compared epoch counter (an integer check on the child's next call), so the root keeps no child registry and no child references. References point only from child to root, plus the one bounded active-pointer edge. A dropped child is garbage immediately. A forgotten `stop()` on an activated child keeps one small object alive; the real cost is that `TIME_INTERVAL` reports keep using that dead playback's last data until the next `activate()`. The memory is trivial, the report data is not (see Drawbacks).

### Bundle and performance impact

- `CmcdChildReporterConfig` is type-only: zero runtime bytes, `export type *` barrel entry.
- Runtime additions are `createChildReporter`, `activate`, and role branches in the lifecycle methods: estimated well under 1 KB minified on the `CmcdReporter` class, to be measured against the real `dist/` build in the implementation PR. Class methods are not tree-shakeable one by one, so all `CmcdReporter` importers carry this. Consumers who never import the class are unaffected.
- Root-only users pay one property read on shared-state access and one integer compare in `update()`/`recordEvent()`. No new allocations on any root path.
- A child is one small object holding a data store, an empty baseline, a cached epoch, and a root pointer: no map, no queues, no timers. Creating and destroying asset players allocates and releases only these.

### Testing

Two existing coverage gaps guard the machinery that becomes shared, so they land first and pin current behavior before any refactor: the 429/5xx re-queue path (untested today; the new test pins that a re-queued batch can be re-sent after later-`sn` batches, since delivery order is not guaranteed and `sn` orders the stream) and `sn` reset on `sid` change (the existing test has no assertions). Acceptance gate for the refactor: a reporter with no children passes the entire existing suite unchanged, with byte-identical report output.

New coverage, following the existing mock-requester and `mock.timers` idioms:

- Interleaved root and child events share one increasing `sn` per target; two children share it too; deduped or dropped child events consume no `sn`.
- Child events land in root batches and count toward `batchSize`; root and child `flush()` drain them.
- `msd` sent exactly once per target and once per request path across root and children, with the same value in every mode; `msd` is first-write-wins session-wide, so a later `update({ msd })` from the root or any child after an accepted write is ignored; post-reset `msd` sends and is writable again (prerequisite fix).
- Child `createRequestReport()`: shared `sn`, child `cid`, child `enabledKeys`/`transmissionMode`/`customHeaderMap`/`transform` overrides (query vs headers), input never mutated.
- Dedup isolation: child transitions never suppress root transitions, and the reverse; same-valued cross-player events both emit.
- `bg` root ownership: `child.update({ bg })` has no effect on session state and emits no `b` event; `root.update({ bg })` does; periodic reports from an active child carry the root's `bg`; `sid` change resets the session `bg` baseline.
- Version scoping: two event targets configured with different `version` values emit their own `v` under one `sid`, from both root and child reports; a child cannot set `version`; `update({ v })` and a per-call `v` do not change the emitted version.
- `sid` change: shared counters reset, children lazily clear baselines, children's reports carry the new `sid`; events enqueued before the change but still unsent keep the old `sid`/`sn` and drain correctly, so a later batch may mix old- and new-`sid` lines; `child.update({ sid })` has no effect.
- Lifecycle: child `start()` arms nothing (interval spies); child `stop()` never disarms session timers; active-role transfer including the `stop()` auto-return; a child `stop()`/`start()` cycle leaves the root active until `activate()` is called again; an activated child abandoned without `stop()` keeps feeding periodic reports until the next `activate()` (assert report content); repeated `start()` stays safe with children present.
- 410 disposal observed through a child; re-queue path exercised with child events in the batch.
- Child-config hardening: session-owned fields passed via `as any` have no effect. A type-level test pins the full `never` lock list, so a session-owned field added to `CmcdReporterConfig` without a matching lock fails the build.
- Reserved-key sealing, one test per reporting path (`recordEvent()`, `recordResponseReceived()`, `createRequestReport()`), from both a root and a child: a per-call `sid` never reaches the wire, and a per-call `msd` neither bypasses a closed gate nor satisfies an open one.
- Grandchild flattening and creator-default inheritance across the whole request-report config.
- A `// #region example` block wired into the TSDoc via `{@includeCode}`.

The prerequisite PR carries its own coverage, independent of children: the four fixes above, plus `msd` input validation as a table of accepted and rejected values (`0` accepted; `Infinity`, `-1`, `NaN` rejected).

## Drawbacks

- **Everyone importing `CmcdReporter` pays the bytes.** Under 1 KB, but real. The tree-shakeable alternative (a free factory function) cannot reach private session state and breaks `CmcdReporter`-typed assignability (see Rationale).
- **`activate()` is a new concept.** Correct interstitial periodic reports need two `activate()` call sites in the player's interstitials controller. The default (root data) is safe but stale during interstitials for integrators who skip it.
- **An activated child abandoned without `stop()` leaves periodic reports on dead data.** The active pointer moves only via `stop()` or a later `activate()`. If an activated child is torn down on an error path that skips `stop()` (for example, inside an ad SDK) and no return is wired, every later `TIME_INTERVAL` report carries the dead playback's last data. Likewise, a stray `activate()` from torn-down code takes the active role again, since explicit calls are always honored. Mitigations: always return the role on error paths (the hls.js `INTERSTITIALS_PRIMARY_RESUMED` wiring recovers automatically), and the deferred `detach()` (see Future possibilities) closes this fully.
- **Child `flush()`/`stop(true)` flush the whole session's queues.** Per-child flushing would need per-item attribution in shared queues. Every asset teardown sends partly filled batches; the spec allows it, but batching efficiency drops for ad-heavy content.
- **No inertness after teardown.** A destroyed but still referenced child that keeps recording (a stray async callback) adds events to the live session stream. v1 relies on garbage collection plus `stop()`; a `detach()`-style hard cut is deferred (see Future possibilities).
- **Session-scoped counters without aggregation.** `bsa`/`bsda`/`dfa` and `bsd` remain per-player inputs in v1, so a multi-player session whose players supply local values emits decreasing "since session initiation" counts under one `sid`. The application has to own these four keys; the library cannot fix it for them.
- **Cross-bundle typing needs a `Pick` at every injection boundary.** If a player bundles its own copy of `@svta/cml-cmcd` while the app injects a reporter built from another copy, runtime works (only methods are called), but TypeScript rejects a bare `CmcdReporter` annotation: the class's private members make it nominal, so two declarations of the same class are not interchangeable. The fix belongs on the consuming side and costs one type alias, because `Pick` drops private members and leaves a structural type:

  ```ts
  // In the player, for a field an application assigns to:
  type InjectedCmcdReporter = Pick<CmcdReporter, 'update' | 'recordEvent' | 'createRequestReport' | /* … */>
  ```

  This RFC deliberately does not export a `CmcdReporterLike` interface for it. A published parallel type would have to track the class forever, it would weaken the genuine-instance guarantee that makes `createChildReporter()`'s return type useful, and adopters can express it in one line where they need it. If several players end up hand-rolling the same alias, exporting one becomes a cheap additive follow-up.
- **The fix does nothing until players adopt it.** hls.js needs the `cmcd.reporter` field, the `activate()` wiring, and the `nr` transitions; Shaka needs the same in `InterstitialAdManager`. Companion upstream issues should accompany this RFC.

## Rationale and alternatives

- **Naming: `createChildReporter` over `spawn`/`clone`/`fork`.** `create*` is the package's only factory verb (`createRequestReport`, `createFetchTransport`, `createXhrTransport`; repo-wide `createWebVttCue`, `createIsoBoxReadableStream`), and it autocompletes next to `createRequestReport` on the class. `clone` is misleading: it promises an independent copy, while this object *shares* session state, the opposite of a clone. `spawn`/`fork` have no precedent in this repo and read as process APIs. "Child reporter" names the exact relationship the docs must teach.
- **Same class, not a subclass, interface, or factory function.** Players type their controller fields as `CmcdReporter`. The class has TypeScript-private members, so only a genuine instance is assignable; a look-alike or separate child class would force every player to retype its integration. Same class also preserves `instanceof` and keeps one documented surface. A free `createCmcdChildReporter(parent)` function would be tree-shakeable but cannot reach the reporter's private session state without making mutable internals public, and it has the same return-type problem.
- **`never`-typed locks over `Omit`-only.** `Omit<CmcdReporterConfig, 'sid' | …>` on its own only rejects extra properties on object literals; a widened object passes `sid` through silently. Explicit `never` fields also block widened objects, keep the lock list easy to audit, and show the *reason* in the editor tooltip. Verified: with the locks declared, both `createChildReporter({ sid })` and `createChildReporter(widenedObjectWithSid)` fail to compile. The child config does use one `Omit`, to drop the inherited `version` so the `never` lock can replace it; that is a mechanical necessity, not a substitute for the locks. Cost: locked fields appear in autocomplete (with their explanation); see Unresolved questions.
- **Inheriting child config from `CmcdRequestReportConfig` over listing members.** The alternative, naming `enabledKeys`/`transmissionMode`/`customHeaderMap`/`transform` by hand, has already failed once: the first draft of this RFC listed two members and missed `transform` and `customHeaderMap`, and asserted that report transforms composed "without changes." Inheriting makes the type track the request-report surface automatically, and puts the maintenance burden on the rarer event (a new *session*-owned field, which needs a lock) instead of the common one.
- **Minimal variant without `activate()`** (periodic reports always use root data): rejected. During a pre-roll, periodic reports would describe an idle primary player, and the natural workaround (copying ad fields into the root's `update()`) fires root-attributed state events with ad values and corrupts the root's dedup baseline. A design whose documented workaround causes new bugs is not minimal, just incomplete.
- **Public session-first API** (`CmcdSession` owning targets, reporters as views, explicit `detach()`): the right long-term shape, and this proposal's internals are deliberately arranged so it stays purely additive. Rejected for v1: a larger surface (three or more concepts), a `detach()`-vs-`stop()` distinction that existing destroy paths never call, and, in the session-first variant considered, any child being able to change the session `sid`, the most dangerous wrong-data hazard of any alternative on this list.
- **Document "share one reporter instance across players"**: rejected; it corrupts per-player state (see Motivation).
- **Per-player reporters with collector-side stitching** (accept duplicate `sn` sequences and let collectors sort them out): rejected. It violates the `sn` monotonicity requirement, and CMCD v2 has no per-player key that would make stitching reliable.
- **Shared request-mode `sn` counter** (vs per-child): per-child counters produce outright duplicate `sn` values whenever two players share a CDN, which is the common case, so they are clearly worse. Sharing the root's counter also preserves today's behavior exactly. An earlier draft went further and called a single counter "safe under any reading" of the spec; that overstated it, and the claim is withdrawn. The spec says sequence numbers "increase independently per each combination of mode and target," and one counter shared across CDNs is not independent per target. Whether to key request-mode counters by target is now an open question rather than a settled point, because it is a pre-existing behavior change; see [Unresolved questions](#unresolved-questions).

## Prior art

- **dash.js** plays DASH ad periods inside a single `MediaPlayer` with one CMCD model: one `sid` and a single `sn` sequence across content boundaries happen automatically. This proposal gives multi-player architectures the same behavior.
- **hls.js** already shares parent identity with asset players (`primarySessionId` feeding the `_HLS_primary_id` query param) and already shares object-valued CMCD config by reference (`cmcd.loader`, `cmcd.reporterCallback`): precedent for both the session concept and the injection channel.
- **Shaka Player**'s `InterstitialAdManager` drives a secondary `shaka.Player` with copied CMCD config and no session coordination: the same gap, ready for the same fix.
- **In-package precedent**: `CmcdReporter.createRequestReport()` for factory-method naming; `CmcdReportRecorder.detach()` for the deferred `detach()` verb.

## Unresolved questions

1. **State-change dedup scope.** Does the no-consecutive-duplicates expectation apply per player or per session stream? Per-child baselines (this proposal) can put adjacent same-valued `ps` lines from different players on one `sid` stream, distinguishable by `cid`/`ts`. Needs CTA WAVE / collector-implementer confirmation; the baselines can move to the session either way.
2. **Periodic-report model validation.** Does the active-reporter model match collector expectations, or do collectors want parallel per-player periodic reports, or merged ones? Related: which reporter should be active during hls.js `interstitialAppendInPlace` playback (the parent media element keeps presenting), and what should dual-presentation sessions (for example, a PiP ad) report? The `nr` wiring settles with this: whichever reporter is not active is the one marking its fetches non-rendered, so an answer here is also the answer for `interstitialAppendInPlace`'s `nr`.
3. **Should request-mode `sn` be scoped per target?** One shared counter means traffic to CDN A moves CDN B's sequence, which is hard to square with "increase independently per each combination of mode and target." This is today's single-reporter behavior, not something children introduce, but children make it matter: a primary CDN plus an ad CDN is the first common case where one counter describes two real targets. Scoping it is not free. Origin is not target identity (one CDN fronts many hostnames, one hostname can front several CDNs), a per-origin map is unbounded where today's cost is one integer, and the change alters existing root output. Options: leave it shared and document the reading, key by origin as a documented approximation, or ask CTA WAVE what "target" means in request mode.
4. **Are `bsd` and the absolute counters in scope?** `bsd` is a once-per-mode-per-destination key, the same clause shape that justifies session-gating `msd`, but it has no gate for roots today or children here. Should it get the `msd` treatment in the prerequisite PR? And is documenting that the application owns `bsa`/`bsda`/`dfa` sufficient, or should children suppress them outright given a child cannot know a session total?
5. **`child.update({ sid })` and `child.update({ bg })` are silently ignored.** This conflicts with the repo's preference for actionable failures, but throwing breaks controller code that forwards whole data objects. Is a dev-mode console warning worth it?
6. **`msd` first-write-wins changes root behavior.** Today `update({ msd })` can be revised at any time and is captured per target at enqueue, so a root-only app that revises `msd` before its first report would lose the revision under this proposal. Acceptable, or should the freeze apply only once a session has more than one reporter? (The four [prerequisite fixes](#prerequisite-fixes) are settled: they land in their own PR first.)
7. **Locked-field ergonomics.** Do reviewers prefer the discoverable `never`-typed locks (fields visible in autocomplete with an explanation) or a quieter `Omit`-based config that hides them but only guards object literals?
8. **Child teardown flush scope.** Is a session-wide flush on `child.stop(true)` acceptable (smaller batches at every asset boundary), or should a child's flush be a no-op, given its events are already safe in the root's queues?

## Future possibilities

- **A public `CmcdSession`**: session-first construction with N sibling reporters and no special root; the internal partition already has this shape.
- **`detach()`** (naming precedent: `CmcdReportRecorder.detach`): a hard cut that makes a torn-down child's stray late calls no-ops.
- **Cross-player aggregation**: refine v1's root-owned `bg` into automatic visibility aggregation (backgrounded only when *all* players are hidden), which needs a child registry the current design deliberately avoids, plus aggregation hooks for the session-scoped counters `bsa`/`bsda`/`dfa` and `bsd`.
- **Per-target request-mode `sn` counters**, if collector guidance settles what "target" means in request mode.
- **A `CmcdReporterLike` structural type**, if enough players end up hand-rolling the same `Pick` at their injection boundaries.
- **A readonly `sid` accessor**, so apps can correlate child playbacks externally when the root auto-generated its session ID.
- **Companion player integrations**: the hls.js `cmcd.reporter` field, `activate()` wiring, and `nr` transitions, and the Shaka `InterstitialAdManager` equivalent.

## Revision history

- **2026-07-23 (v1)**: initial draft.
- **2026-07-24 (v2)**: reworded for concision and plain language; no changes to the proposed design.
- **2026-07-27 (v3)**: revised from review. `bg` is now root-owned and root-written rather than last-write-wins from any reporter. `CmcdChildReporterConfig` inherits its members from `CmcdRequestReportConfig`, so the `transform` and `customHeaderMap` shipped in #399 are child-configurable. Withdrew the one-version-per-session claim (versions are per mode and per target, and the spec recommends mixing v1 request mode with v2 event mode) and the claim that a single request-mode `sn` counter is safe under any reading of the spec. Added reserved-key stamping for `sid`/`msd` on the per-call data paths, `msd` input validation, `nr` guidance for non-rendered players, and a `Pick`-based recipe for cross-copy injection typing. Companion fixes became four prerequisite fixes in their own PR ahead of this feature. Removed the claim that root `update({ v })` can rewrite the version mid-session: it cannot, in either mode.

## Final Decision

*(Completed after review)*

**Decision:**
**Rationale:**
**Date:**
