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

A child owns the state of its own playback: `cid`, `sta`, `pt`, `bl`, `pr`, `br`, its state-change dedup (duplicate suppression) baseline, and its request-mode encoding config. All session-wide state stays with the root reporter: the `sid`, every sequence number, the batched event queues and their timers, and the once-per-session `msd`. The result is one session on the wire: one `sid`, one increasing `sn` sequence per target across all players, one `msd`, one stream of periodic reports.

The child is a real `CmcdReporter`, so the same player code works with a root or a child. Session-owned config (`sid`, `eventTargets`, `version`) is rejected at compile time, and there is no requester parameter. A child cannot change the session's identity, targets, or transport. A companion `activate()` method selects which reporter's data goes into periodic `TIME_INTERVAL` reports, so those reports describe the content the user is watching.

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

The child **owns** (per playback): its data store (`cid`, `sta`, `pt`, `bl`, `pr`, `br`, `mtp`, `ot`, …), its state-change dedup baseline, and the encoding of its own request-mode reports (`enabledKeys`, `transmissionMode`; useful when an ad CDN needs query params instead of custom headers).

The child **shares** (per session, root-owned): the `sid` and CMCD version on every report, each event target's `sn` counter and queue, the request-mode `sn` counter, the `TIME_INTERVAL` timers, the once-per-session `msd`, the session-level backgrounded state (`bg`), and the event-report requester.

Session-owned settings cannot be passed to a child. The compiler rejects them, and the editor tooltip explains why:

```ts
reporter.createChildReporter({
	cid: 'ad-creative-42',
	// sid: '...'          ← compile error: the session ID is owned by the root
	// eventTargets: [...] ← compile error: targets, queues, and timers are root-owned
	// version: CMCD_V2    ← compile error: the version is stamped once per session
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
// config: one new field on the existing cmcd config surface
type CMCDControllerConfig = {
	// …existing: sessionId, contentId, useHeaders, includeKeys, eventTargets, loader…
	/** A reporter injected by a parent player. When set, this player reports
	 *  into the parent's CMCD session instead of creating its own. */
	reporter?: CmcdReporter;
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

Preloading needs no changes: an asset player that buffers ahead sends request-mode reports (with its own `cid` and `sta: 'd'`) using the shared request-mode `sn` while another player presents.

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
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdTransmissionMode } from './CmcdTransmissionMode.ts'

/**
 * Configuration for a child CMCD reporter created with
 * {@link CmcdReporter.createChildReporter}.
 *
 * Only playback-scoped settings may be provided. Session-owned settings
 * (`sid`, `eventTargets`, `version`) belong to the session's root reporter.
 * They are declared `never`, so passing them fails at compile time, even
 * through a widened, non-literal object, and the tooltip explains why.
 *
 * @public
 */
export type CmcdChildReporterConfig = {
	/**
	 * The content ID of the playback this child reports on. It is deliberately
	 * NOT inherited from the parent: omitting it reports no `cid`, which is
	 * safer than attributing the child's traffic to the parent's content.
	 *
	 * @defaultValue `undefined`
	 */
	cid?: string;

	/**
	 * The CMCD keys to include in this child's request-mode reports.
	 *
	 * @defaultValue the creating reporter's `enabledKeys`
	 */
	enabledKeys?: CmcdKey[];

	/**
	 * The transmission mode for this child's request-mode reports.
	 *
	 * @defaultValue the creating reporter's `transmissionMode`
	 */
	transmissionMode?: CmcdTransmissionMode;

	/** The session ID is owned by the session's root reporter and cannot be set on a child. */
	sid?: never;

	/** Event targets (URLs, batching, timers, `sn` counters, queues) are owned by the session's root reporter and cannot be set on a child. */
	eventTargets?: never;

	/** The CMCD version is stamped once per session and cannot be set on a child. */
	version?: never;
}
```

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

There is no requester parameter on `createChildReporter`: a child cannot change the session's transport. At runtime the implementation reads only `cid`, `enabledKeys`, and `transmissionMode` from the config. A session-owned field passed through `as any` or from plain JavaScript has no effect. This is a tested invariant, not an implementation accident.

### State partition

| State | Scope | Rationale |
|---|---|---|
| `sid` | Session | The spec's session spans primary and interstitial content on one device. Children never store a `sid`. It is injected from the root when each report is created, together with the `sn`, so a root `sid` change needs no notifications. |
| `v` / config `version` | Session | Stamped on every report. Mixed versions under one `sid` would confuse collectors. |
| Per-target event `sn` counters | Session | `sn` is per (session, mode, target) and "MUST be reset to zero on the start of a new session-id". It is assigned at enqueue on the root's counters, so all players form one increasing sequence per target with no gaps. This is the bug being fixed. |
| Request-mode `sn` counter | Session | Same spec clause. Separate counters would emit duplicate `sn` values whenever players share a CDN, which is the normal interstitials case. See Rationale for the shared-counter argument. |
| `msd` value + per-target/request-mode `msdSent` flags | Session | "MUST only be sent once per Session ID and MUST be sent for each reporting mode which is active within the player." In a multi-player session, this design applies the per-mode clause to the session, not to each player: the root's flags gate emission no matter which player's report carries the value, so a child does not re-send a value the session already sent. |
| Event queues, batching, failure re-queue, HTTP 410 disposal | Session | One owner by construction: no queue edits from two owners, no duplicate targets, and a 410 silences the target for every player at once. |
| `TIME_INTERVAL` timers | Session | Exactly one periodic report stream per target per session. Child `start()`/`stop()` cannot arm or disarm the timers. |
| Active-reporter pointer (new) | Session | Selects whose data goes into `t` reports. Root by default; changed by `activate()`; returned to the root by `child.stop()`. |
| Requester | Session | Only event-report POSTs use it, and only the root sends them. |
| Data store (`cid`, `sta`, `pr`, `bl`, `mtp`, `pt`, `br`, `ot`, …) | Per player | These fields describe one playback. A preloading child's `sta: 'd'` must never overwrite the presenting player's data. |
| `lastEmitted` dedup baseline | Per player | Dedup answers "did this player's state change". A shared baseline would suppress real transitions: an ad's `sta: 'p'` would hide the primary player's later identical resume. See Unresolved questions. |
| `bg` value + its dedup baseline | Session | The spec scopes `bg` to all players in a session. `update({ bg })` on any reporter writes through to root-owned session state, and `bg` is injected into every report next to `sid`/`v`, so an active child's periodic reports carry the session's backgrounded state. Its dedup baseline is session-level: root and child writing the same value emit one `b` event, fired from the writing reporter with that reporter's data. Page-level `visibilitychange` gives every player the same visibility, so last-write-wins is enough; aggregation for split-visibility cases is deferred (see Future possibilities). |
| Request-mode `enabledKeys` + `transmissionMode` | Per player (inherited by default) | Request-mode encoding is per player/CDN. An ad CDN may need query params where the primary CDN accepts headers. |

The session-scoped counters `bsa`/`bsda`/`dfa` ("since session initiation") and `bsd` (reported "once per reporting mode and report destination") get no cross-player aggregation in v1. They stay player-supplied numeric inputs via `update()`, because there is no obvious merge rule to impose (see Future possibilities).

### Event-mode sequence numbers

Every reporter in a session enqueues through the root's target map. `sn` is assigned at enqueue time (`target.sn++`) on the root's counters, the same place as today. JavaScript is single-threaded, so enqueue order is total, and the single owner dispatches batches in queue order. Delivery order across batches is not guaranteed under retry (today or with children): a batch re-queued after a 429/5xx can arrive after a later-`sn` batch that was already in flight. That is allowed by the spec, because `sn` is assigned at enqueue: `sn` orders the target's reports, not arrival time. The result per (sid, target) is one increasing sequence with no gaps, across the root and any number of children, with batches interleaving all players' events in call order. Events suppressed by dedup, or dropped for a missing required field, consume no `sn`, as today.

### Request-mode sequence numbers

`createRequestReport()` on any reporter takes the next number from the root's request-mode counter. `msd` on the request path is gated by the root's request-mode `msdSent` flag. The child's own `enabledKeys`/`transmissionMode` control the encoding.

### `msd`

The session owns `msd`. `update({ msd })` from any reporter, root or child, writes through to the session, and the first accepted value wins: it fixes the session's `msd` until a session reset (`sid` change). The spec measures startup delay until *any* media begins playback, so a pre-roll asset player may supply the session's `msd`, and the primary player's later value must not replace it.

This tightens today's root behavior on purpose. Today, `update({ msd })` always overwrites the stored value, and each event target and the request path capture whatever value is current at their own first report. A mid-session revision can therefore already send *different* `msd` values across targets and modes under one `sid`, which conflicts with "once per Session ID". Keeping the first accepted write guarantees one value everywhere. Emission is unchanged: at most once per target and once on the request path, per session.

About the spec's trailing qualifier, "for each reporting mode which is active within the player": this design treats the once-per-Session-ID MUST as the controlling rule in a multi-player session. The per-mode clause selects which modes must carry `msd`; the session rule caps how often it may be sent. A second player re-sending it under the same `sid` would break that cap.

### State-change dedup

Each reporter dedups `sta`/`pr`/`cid`/`br` transitions against its own baseline, so two players never suppress each other's transitions. (`bg` is the exception: it dedups against the session-level baseline, and a root `sid` change clears that baseline together with the per-player ones.) The accepted consequence: the session stream may contain adjacent state events with the same value from *different* players. For example, the primary emits `ps` with `sta: 'p'`, then the ad child starts playing and also emits `ps` with `sta: 'p'`. Each report carries its own `cid`, so collectors can attribute both correctly. Whether the spec means dedup per player or per session stream is an unresolved question below. The implementation keeps the baselines movable to the session without a public API change.

### `TIME_INTERVAL` and the active reporter

Periodic reports use the active reporter's data: the root by default, changed by `activate()`, returned to the root by `child.stop()` if that child was active. Two alternatives were rejected. *Root data only*: during a pre-roll, periodic reports would describe an idle primary player, which is misleading. The obvious workaround, copying ad fields into the root with `update()`, is worse: it fires root-attributed state events with ad values and corrupts the root's dedup baseline. *Merged data*: mixing the primary's `pt` with the ad's `bl` produces reports that describe no real playback. The active-reporter model costs one pointer and matches the "currently presenting item" concept players already track.

### `cid`

A `cid` in the child config seeds the child's store without firing a `c` event. This matches the root constructor, which also seeds `cid` silently. The child's first recorded event already carries its `cid`. A player that wants an explicit content-change marker calls `child.recordEvent(CMCD_EVENT_CONTENT_ID, { cid })`; the child's empty baseline guarantees it fires exactly once. When an interstitial ends, the root's store still holds the primary `cid`, so later root reports carry it without a `c` event (the root's baseline never changed). Collectors attribute by the `cid` key on each report, not by counting `c` events.

### `sid` ownership and session reset

Children cannot change the session. At compile time, `sid` is `never`-typed in the child config. At runtime, `child.update({ sid })` ignores the key. Throwing was rejected because reused controller code forwards whole data objects. Forwarding to a session-wide reset was rejected because an ad SDK must not be able to reset the app's session by accident (see Unresolved questions for a dev-mode warning).

Root `update({ sid })` resets the session as today (all shared `sn` counters to zero, dedup baseline cleared), and the reset now also reaches children: each child notices the session change on its next call and clears its own baseline. Later child reports carry the new `sid` automatically, because `sid` is injected at report-creation time: the root's current `sid` is captured into each report at the same moment its `sn` is assigned (`target.sn++` at enqueue for event mode; the `createRequestReport()` call for request mode), never later in the send or encode path. Events already in the queues at the moment of the change keep the old `sid` with their old `sn` and drain as the last reports of the old session. A batch sent after the change may therefore mix old-`sid` lines with new-`sid` lines that start at `sn` 0. Each line is internally consistent, so both the reset-to-zero rule and per-session monotonicity hold.

### Lifecycle semantics by role

| Method | Root (unchanged) | Child |
|---|---|---|
| `start()` | Arms timers; sends the first `t` report immediately | No-op; never takes the active role. Call `activate()` again after restarting a child that is still presenting |
| `stop()` | Disarms timers | Returns the active role to the root if held; timers untouched |
| `stop(true)` | Flush + disarm | Flushes session queues + returns the active role |
| `flush()` | Flushes all queues | Delegates to the root (the queues cannot be split) |
| `update()` / `recordEvent()` / `recordResponseReceived()` | As today | Child-local store and baseline (`msd` and `bg` write through to the session); enqueues into the root's queues |
| `createRequestReport()` | As today | Child's encoding config; shared session `sn`/`msd` |
| `isRequestReportingEnabled()` | As today | Answers for the child's own `enabledKeys` |

A child stays usable after `root.stop()`, exactly like the root itself: recording still enqueues, and batch-size sends still fire; only the timers are off. There is no session "destroy": releasing all references ends the session through garbage collection, as today.

### Target disposal and failure re-queue

Both stay in the root's send path, unchanged. An HTTP 410 removes the target from the single session map and silences it for every player at once. A 429/5xx puts the failed batch back at the front of the single per-target queue. Children add no second owner, so the failure modes of naive queue sharing (interleaved queue edits, repeated reprocessing, re-queueing into a removed target) cannot occur.

### Grandchildren

`child.createChildReporter()` returns another direct child of the root, so delegation depth is always exactly one and hot paths never walk a chain. Defaults (`enabledKeys`, `transmissionMode`) come from the *creating* reporter, not the root: an ad SDK holding a query-mode child creates query-mode grandchildren without knowing whether it holds the root.

### Concurrency

Guaranteed with any number of live children: one increasing `sn` per (mode, target), because all assignment goes through the root's counters on one thread; independent stores and baselines, so a preloading child's `sta: 'd'` never affects the presenting player's reports; `msd`/`msdSent` gate once-only keys no matter which reporter writes first; exactly one periodic report stream exists. Not guaranteed, and documented: periodic reports describe only the active playback (two players presenting at the same time get no merged report), and cross-player event order inside a batch is call order. That is allowed: `ts` records when the event happened, and `sn` orders the target's reports.

### Companion fixes

Two existing single-reporter bugs sit on this feature's paths. They are proposed as `### Fixed` changelog entries, and can be split into a separate PR if reviewers prefer (see Unresolved questions):

1. **`resetSession()` never clears `msd`/`msdSent`.** After a `sid` change, a new `update({ msd })` is silently never sent: the old session's flags block the new session's `msd` forever. That violates "once per Session ID", which means once per *each* session, not once per reporter. The reset will clear both.
2. **`update({ sid: undefined })` removes `sid` from all later reports.** The guard skips the session reset for a missing `sid`, but the merge still writes the explicit `undefined` into the store. Injecting `sid` at report-creation time (needed for children anyway) also fixes this for roots.

Related but not changed here: root `update({ v })` can still rewrite the version mid-session. Children are protected (`version` is locked and `v` comes from the session), but locking the root's `v` after construction is a behavior change outside this RFC's scope. It is flagged for reviewers.

### Interaction with the report-transforms proposal

This proposal composes with [Report Transforms for `CmcdReporter` (#390)](https://github.com/streaming-video-technology-alliance/common-media-library/pull/390) without changes to either. Event mode: a target's `transform` runs at enqueue on the root's targets, so it also sees child reports; `data.cid` identifies the source, and `sn` is assigned after the transform on the root's counters, exactly per that RFC's reporter-owned-fields rule. Request mode: the top-level `transform` belongs to the request-report config, so it would join `enabledKeys`/`transmissionMode` as playback-scoped child config, inherited from the creating reporter unless overridden.

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
- `msd` sent exactly once per target and once per request path across root and children, with the same value in every mode; `msd` is first-write-wins session-wide, so a later `update({ msd })` from the root or any child after an accepted write is ignored; post-reset `msd` sends and is writable again (companion fix).
- Child `createRequestReport()`: shared `sn`, child `cid`, child `enabledKeys`/`transmissionMode` overrides (query vs headers), input never mutated.
- Dedup isolation: child transitions never suppress root transitions, and the reverse; same-valued cross-player events both emit.
- `bg` session scoping: a child's `update({ bg })` writes through to session state; periodic reports from an active child carry the session `bg`; root and child writing the same `bg` value emit exactly one `b` event; `sid` change resets the session `bg` baseline.
- `sid` change: shared counters reset, children lazily clear baselines, children's reports carry the new `sid`; events enqueued before the change but still unsent keep the old `sid`/`sn` and drain correctly, so a later batch may mix old- and new-`sid` lines; `child.update({ sid })` has no effect.
- Lifecycle: child `start()` arms nothing (interval spies); child `stop()` never disarms session timers; active-role transfer including the `stop()` auto-return; a child `stop()`/`start()` cycle leaves the root active until `activate()` is called again; an activated child abandoned without `stop()` keeps feeding periodic reports until the next `activate()` (assert report content); repeated `start()` stays safe with children present.
- 410 disposal observed through a child; re-queue path exercised with child events in the batch.
- Child-config hardening: session-owned fields passed via `as any` have no effect.
- Grandchild flattening and creator-default inheritance.
- A `// #region example` block wired into the TSDoc via `{@includeCode}`.

## Drawbacks

- **Everyone importing `CmcdReporter` pays the bytes.** Under 1 KB, but real. The tree-shakeable alternative (a free factory function) cannot reach private session state and breaks `CmcdReporter`-typed assignability (see Rationale).
- **`activate()` is a new concept.** Correct interstitial periodic reports need two `activate()` call sites in the player's interstitials controller. The default (root data) is safe but stale during interstitials for integrators who skip it.
- **An activated child abandoned without `stop()` leaves periodic reports on dead data.** The active pointer moves only via `stop()` or a later `activate()`. If an activated child is torn down on an error path that skips `stop()` (for example, inside an ad SDK) and no return is wired, every later `TIME_INTERVAL` report carries the dead playback's last data. Likewise, a stray `activate()` from torn-down code takes the active role again, since explicit calls are always honored. Mitigations: always return the role on error paths (the hls.js `INTERSTITIALS_PRIMARY_RESUMED` wiring recovers automatically), and the deferred `detach()` (see Future possibilities) closes this fully.
- **Child `flush()`/`stop(true)` flush the whole session's queues.** Per-child flushing would need per-item attribution in shared queues. Every asset teardown sends partly filled batches; the spec allows it, but batching efficiency drops for ad-heavy content.
- **No inertness after teardown.** A destroyed but still referenced child that keeps recording (a stray async callback) adds events to the live session stream. v1 relies on garbage collection plus `stop()`; a `detach()`-style hard cut is deferred (see Future possibilities).
- **Session-scoped counters without aggregation.** `bsa`/`bsda`/`dfa` and `bsd` remain per-player inputs in v1, so a multi-player session can emit per-player values for spec-session-scoped counters.
- **Cross-bundle typing.** If a player bundles its own copy of `@svta/cml-cmcd` while the app injects a reporter built from another copy, runtime works (only methods are called), but TypeScript rejects the assignment because private members make the class nominal. Needs documented single-copy/dedupe guidance.
- **The fix does nothing until players adopt it.** hls.js needs the `cmcd.reporter` field and `activate()` wiring; Shaka needs the same in `InterstitialAdManager`. Companion upstream issues should accompany this RFC.

## Rationale and alternatives

- **Naming: `createChildReporter` over `spawn`/`clone`/`fork`.** `create*` is the package's only factory verb (`createRequestReport`, `createFetchTransport`, `createXhrTransport`; repo-wide `createWebVttCue`, `createIsoBoxReadableStream`), and it autocompletes next to `createRequestReport` on the class. `clone` is misleading: it promises an independent copy, while this object *shares* session state, the opposite of a clone. `spawn`/`fork` have no precedent in this repo and read as process APIs. "Child reporter" names the exact relationship the docs must teach.
- **Same class, not a subclass, interface, or factory function.** Players type their controller fields as `CmcdReporter`. The class has TypeScript-private members, so only a genuine instance is assignable; a look-alike or separate child class would force every player to retype its integration. Same class also preserves `instanceof` and keeps one documented surface. A free `createCmcdChildReporter(parent)` function would be tree-shakeable but cannot reach the reporter's private session state without making mutable internals public, and it has the same return-type problem.
- **`never`-typed locks over `Omit`.** `Omit<CmcdReporterConfig, 'sid' | …>` only rejects extra properties on object literals; a widened object passes `sid` through silently, and future additions to `CmcdReporterConfig` silently become child-overridable. Explicit `never` fields also block widened objects, keep the lock list easy to audit, and show the *reason* in the editor tooltip. Cost: locked fields appear in autocomplete (with their explanation); see Unresolved questions.
- **Minimal variant without `activate()`** (periodic reports always use root data): rejected. During a pre-roll, periodic reports would describe an idle primary player, and the natural workaround (copying ad fields into the root's `update()`) fires root-attributed state events with ad values and corrupts the root's dedup baseline. A design whose documented workaround causes new bugs is not minimal, just incomplete.
- **Public session-first API** (`CmcdSession` owning targets, reporters as views, explicit `detach()`): the right long-term shape, and this proposal's internals are deliberately arranged so it stays purely additive. Rejected for v1: a larger surface (three or more concepts), a `detach()`-vs-`stop()` distinction that existing destroy paths never call, and, in the session-first variant considered, any child being able to change the session `sid`, the most dangerous wrong-data hazard of any alternative on this list.
- **Document "share one reporter instance across players"**: rejected; it corrupts per-player state (see Motivation).
- **Per-player reporters with collector-side stitching** (accept duplicate `sn` sequences and let collectors sort them out): rejected. It violates the `sn` monotonicity requirement, and CMCD v2 has no per-player key that would make stitching reliable.
- **Shared request-mode `sn` counter** (vs per-child): the spec scopes `sn` per combination of mode and target within a session, and request-mode "target" granularity is arguably per-CDN. A single session counter is safe under *any* reading: a globally increasing sequence stays increasing when split into per-origin sub-sequences, and the spec requires an increasing sequence, not a gapless one. Per-child counters produce outright duplicates whenever players share a CDN, the common case. A per-origin counter map remains a compatible future refinement.

## Prior art

- **dash.js** plays DASH ad periods inside a single `MediaPlayer` with one CMCD model: one `sid` and a single `sn` sequence across content boundaries happen automatically. This proposal gives multi-player architectures the same behavior.
- **hls.js** already shares parent identity with asset players (`primarySessionId` feeding the `_HLS_primary_id` query param) and already shares object-valued CMCD config by reference (`cmcd.loader`, `cmcd.reporterCallback`): precedent for both the session concept and the injection channel.
- **Shaka Player**'s `InterstitialAdManager` drives a secondary `shaka.Player` with copied CMCD config and no session coordination: the same gap, ready for the same fix.
- **In-package precedent**: `CmcdReporter.createRequestReport()` for factory-method naming; `CmcdReportRecorder.detach()` for the deferred `detach()` verb.

## Unresolved questions

1. **State-change dedup scope.** Does the no-consecutive-duplicates expectation apply per player or per session stream? Per-child baselines (this proposal) can put adjacent same-valued `ps` lines from different players on one `sid` stream, distinguishable by `cid`/`ts`. Needs CTA WAVE / collector-implementer confirmation; the baselines can move to the session either way.
2. **Periodic-report model validation.** Does the active-reporter model match collector expectations, or do collectors want parallel per-player periodic reports, or merged ones? Related: which reporter should be active during hls.js `interstitialAppendInPlace` playback (the parent media element keeps presenting), and what should dual-presentation sessions (for example, a PiP ad) report?
3. **`child.update({ sid })` is silently ignored.** This conflicts with the repo's preference for actionable failures, but throwing breaks controller code that forwards whole data objects. Is a dev-mode console warning worth it?
4. **Behavior changes: bundled or split?** Should the `resetSession()` `msd`/`msdSent` fix and the `update({ sid: undefined })` fix land in this feature PR as `### Fixed` entries, or in their own PR first? Both change report output for existing edge-case usage. The session-wide `msd` freeze also changes root behavior (today `update({ msd })` can be revised at any time and is captured per target at enqueue): a root-only app that revises `msd` before its first report today would lose the revision. The same question applies to it. And should root `update({ v })` be locked in the same change, or deferred to a separate proposal?
5. **Locked-field ergonomics.** Do reviewers prefer the discoverable `never`-typed locks (fields visible in autocomplete with an explanation) or a quieter `Omit`-based config that hides them but only guards object literals?
6. **Child teardown flush scope.** Is a session-wide flush on `child.stop(true)` acceptable (smaller batches at every asset boundary), or should a child's flush be a no-op, given its events are already safe in the root's queues?

## Future possibilities

- **A public `CmcdSession`**: session-first construction with N sibling reporters and no special root; the internal partition already has this shape.
- **`detach()`** (naming precedent: `CmcdReportRecorder.detach`): a hard cut that makes a torn-down child's stray late calls no-ops.
- **Cross-player aggregation**: refine v1's last-write-wins session `bg` into automatic visibility aggregation (backgrounded only when *all* players are hidden) for split-visibility cases, and aggregation hooks for the session-scoped counters `bsa`/`bsda`/`dfa` and `bsd`.
- **Per-origin request-mode `sn` counters**, if collector guidance favors gapless per-CDN sequences.
- **A readonly `sid` accessor**, so apps can correlate child playbacks externally when the root auto-generated its session ID.
- **Companion player integrations**: the hls.js `cmcd.reporter` field and `activate()` wiring, and the Shaka `InterstitialAdManager` equivalent.

## Revision history

- **2026-07-23 (v1)**: initial draft.
- **2026-07-24 (v2)**: reworded for concision and plain language; no changes to the proposed design.

## Final Decision

*(Completed after review)*

**Decision:**
**Rationale:**
**Date:**
