---
status: draft
---

# RFC: Child Reporters for `CmcdReporter`

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-07-23 |
| **Package** | `@svta/cml-cmcd` |
| **Breaking change** | No |

## Summary

Add a `createChildReporter()` method to `CmcdReporter` that returns a child reporter for an additional player joining the same CMCD session — the interstitial asset players of hls.js and Shaka being the driving case. A child owns its playback-scoped state (`cid`, `sta`, `pt`, `bl`, `pr`, `br`, its state-change dedup baseline, and its request-mode encoding config) while delegating all session-scoped state to the root reporter: the `sid`, every per-target event sequence number, the request-mode sequence number, the batched event queues and their timers, and the once-per-session `msd`. The result on the wire is one session: a single monotonic `sn` stream per target across all players, one heartbeat, one `msd`, one `sid`.

The child is a real `CmcdReporter`, so player CMCD controller code runs unchanged against a root or a child. Session-owned config (`sid`, `eventTargets`, `version`) is rejected at compile time, and there is no requester parameter — a child cannot fork the session's identity, targets, or transport. A companion `activate()` method designates which reporter's data feeds periodic `TIME_INTERVAL` reports, so heartbeats follow the content the user is actually watching.

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
child.recordEvent(CMCD_EVENT_AD_START)                // lands in the root's queues, next shared sn
child.createRequestReport(segmentRequest)             // shared request-mode sn, child's cid
child.activate()                                      // heartbeats now snapshot the child's data
```

## Motivation

CMCD v2 defines a session as spanning players. The `sid` key description reads: "A playback session typically consists of the playback of a single media asset along with accompanying content such as advertisements. This session may comprise the playback of primary content combined with interstitial content." The `bg` key is defined as "All players in a session are currently in a state that is not visible to the user due to a user interaction" — the spec explicitly contemplates multiple players reporting under one session ID.

`CmcdReporter` cannot express that today. All sequencing state is private to one instance: the per-target `sn` counters, `msdSent` flags, batching queues, and interval timers live in a private map keyed by that instance's own normalized config objects, and the request-mode `sn` counter and its `msdSent` flag live in a plain private field. Two reporters constructed with the same `sid` still get fully independent counters and queues.

The concrete failure is hls.js interstitials with CMCD v2 event reporting (raised by the hls.js lead maintainer). Each `HlsAssetPlayer` wraps a full child `Hls` instance; the parent's config is spread into the child's, so the child's `CMCDController` constructs its own `CmcdReporter`. Even when the app pins `cmcd.sessionId` so `sid` continuity holds, every asset player:

- restarts each target's Sequence Number at 0, so the collector sees `sn` 0, 1, 2… repeated per player within one `sid` — violating the spec's requirement that `sn` increase monotonically per combination of mode and target within a session;
- re-sends `msd`, which "MUST only be sent once per Session ID";
- arms its own `TIME_INTERVAL` timers, duplicating heartbeat streams against the same target;
- maintains an independent state-change dedup baseline, so the session stream's `ps`/`bc` events no longer reflect one coherent report source.

And when the app does not set `cmcd.sessionId`, each asset player falls back to its own per-instance uuid — a different `sid` per ad, fragmenting the session entirely. Shaka Player's `InterstitialAdManager` has the same gap: the secondary player copies the base player's CMCD config wholesale with no session coordination. dash.js is the instructive contrast: DASH ad periods play inside a single `MediaPlayer` with a single CMCD model, so `sid` continuity and one `sn` stream come for free — collectors already assume one `sid` spans content boundaries; child-player architectures break that assumption today.

Neither available workaround is sound:

- **Constructing a second reporter with the same `sid`** cannot share counters, queues, timers, or `msd` bookkeeping — those are instance-private by design, and exposing them publicly would trade a bug for an API that leaks mutable internals.
- **Sharing one reporter instance across players** corrupts state: the reporter holds a single persistent data store, so a preloading asset player writing `sta: 'd'` clobbers the presenting player's snapshot mid-playback; a single dedup baseline cross-suppresses transitions (the ad's `sta: 'p'` swallows the primary's later, genuine resume event); and `cid` flip-flopping between content and ad fires spurious `c` events on every write.

What players need is a reporter-shaped object per player with a shared session behind it. That split — playback state per player, session state owned once — is this proposal.

## Guide-level explanation

### Creating a child reporter

A root reporter is constructed exactly as today and owns the session. Each additional player in the session gets a child:

```ts
const child = reporter.createChildReporter({
	cid: 'ad-creative-42',       // this playback's content ID — deliberately not inherited
	// enabledKeys, transmissionMode: inherited from the spawning reporter unless overridden
})
```

The child is a real `CmcdReporter`. Every method a player's CMCD integration calls — `update()`, `recordEvent()`, `recordResponseReceived()`, `createRequestReport()`, `start()`, `stop()`, `flush()`, `isRequestReportingEnabled()` — works on a child with the same signatures, so the same controller code drives the primary player and every asset player.

What the child **owns** (per playback): its persistent data store (`cid`, `sta`, `pt`, `bl`, `pr`, `br`, `mtp`, `ot`, …), its state-change dedup baseline, and the encoding of its own request-mode reports (`enabledKeys`, `transmissionMode` — an ad CDN that strips custom headers can be switched to query params without touching the primary's mode).

What the child **shares** (per session, root-owned): the `sid` and CMCD version stamped on every report, each event target's `sn` counter and batching queue, the request-mode `sn` counter, the `TIME_INTERVAL` timers, the once-per-session `msd`, the session-level backgrounded state (`bg`), and the event-report requester.

Session-owned settings cannot be passed to a child — the compiler rejects them, and the editor tooltip explains why:

```ts
reporter.createChildReporter({
	cid: 'ad-creative-42',
	// sid: '...'          ← compile error: the session ID is owned by the root
	// eventTargets: [...] ← compile error: targets, queues, and timers are root-owned
	// version: CMCD_V2    ← compile error: the version is stamped once per session
})
```

### One session on the wire

Events recorded by a child land in the root's per-target queues and take the next shared sequence number, so parent and child events interleave in one monotonic stream per target (some keys omitted for readability):

```text
POST https://collector.example.com/cmcd

cid="primary-movie",e=ps,sid="f7a0…",sn=17,sta=p,ts=1753305600000,v=2
cid="primary-movie",e=abs,sid="f7a0…",sn=18,ts=1753305601000,v=2          ← parent: ad break starts
cid="ad-creative-42",e=ps,sid="f7a0…",sn=19,sta=p,ts=1753305601500,v=2    ← child: same sid, next sn
cid="ad-creative-42",e=rr,rc=200,sid="f7a0…",sn=20,ts=1753305602000,v=2   ← child media response
```

Collectors attribute each line to a playback by its `cid`; the session is reconstructable from one contiguous `sn` sequence per target. `msd` rides exactly one report per target per mode for the whole session, no matter which player's report happens to carry it — a pre-roll asset player can legitimately supply the session's `msd` (the spec measures to when "any media begins playback, whether it be primary content or interstitial content").

### Heartbeats follow the presented content: `activate()`

The root owns the `TIME_INTERVAL` timers — a child's `start()` is a safe no-op and its `stop()` never touches them, so asset-player churn can neither duplicate nor kill the session heartbeat. By default, periodic reports snapshot the root's data. When an interstitial starts presenting, hand the heartbeat to its reporter:

```ts
child.activate()    // TIME_INTERVAL reports now carry the ad's cid/sta/pt/bl
// …ad ends…
reporter.activate() // heartbeats carry primary data again
```

`activate()` is optional: without it, heartbeats simply keep describing the root's playback. A child's `stop()` automatically hands the heartbeat back to the root if that child held it, so teardown paths need no extra wiring. The auto-revert applies to every `stop()`, not just teardown, and `start()` never (re)claims the heartbeat — a claiming `start()` would let a preloading child steal it from the presenter. A controller that transiently stops and restarts a still-presenting child (for example, a runtime CMCD disable/enable toggle) must call `activate()` again after `start()`.

### Lifecycle

Children are cheap and disposable — create one per asset playback and drop it:

- `child.start()` — no-op (the session heartbeat is already running; churn must not spam synthetic `t` events).
- `child.stop()` — releases the heartbeat if the child held it; never disturbs session timers.
- `child.stop(true)` / `child.flush()` — flushes the session's queues. A child's recorded events are never lost on teardown because they already live in the root's queues.
- There is no dispose method to forget: the root holds no reference to its children (except the active-heartbeat pointer, which is cleared only by `child.stop()` or a subsequent `activate()` — see Drawbacks for what happens when neither is called), so a dropped child is ordinary garbage. A child holds a strong reference to its root, keeping the session alive while any child lives — intended.

### hls.js interstitials integration

The migration lives entirely inside hls.js: one config seam, one `createChildReporter()` call, two `activate()` call sites at existing interstitials-controller trigger points, and an internal hook giving the interstitials controller the primary reporter. `CMCDController` accepts an injected reporter, and `createAssetPlayer()` spawns a child per asset (config object values already flow parent-to-child by reference, so `playerConfig.cmcd` is a proven channel). The block below sketches the hls.js diff — identifiers other than `createChildReporter`, `activate`, and `cmcd.reporter` are existing hls.js internals:

```ts
// config: one additive field on the existing cmcd config surface
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
// primary CMCDController's reporter, surfaced to this controller as part of the
// diff. hls.js already overrides contentId with hash(assetItem.uri) here today;
// keeping that override keeps the child player's config surface and its
// reporter in agreement on the asset's cid.
if (cmcd && parentReporter) {
	const contentId = hash(assetItem.uri) // hls.js's existing url-hash util
	const childReporter = parentReporter.createChildReporter({ cid: contentId })
	playerConfig.cmcd = { ...cmcd, contentId, reporter: childReporter }
}

// interstitials-controller.ts: heartbeat handoff at the two existing trigger
// sites — this controller spawns the child, retains it, and dispatches both
// events, so no public accessor is needed. The wiring assumes the asset
// presents on its own media element; the right active reporter under
// `interstitialAppendInPlace` (the parent media element keeps presenting) is
// an open question — see Unresolved questions.
// …where INTERSTITIAL_ASSET_STARTED is dispatched:
childReporter.activate() // TIME_INTERVAL reports now carry the ad's cid/sta/pt/bl
// …where INTERSTITIALS_PRIMARY_RESUMED is dispatched:
parentReporter.activate() // heartbeats carry primary data again

// Teardown needs nothing new: clearAssetPlayer() → child Hls destroy() →
// CMCDController.destroy() → child.stop(true). Reporters released on the
// error path (resetAssetPlayer) are handled identically.
```

Preloading works unchanged: an asset player buffering ahead issues request-mode reports (with its own `cid` and `sta: 'd'`) on the shared request-mode `sn` while another player presents.

### Ad-insertion SDKs

A player can hand any reporter — root or child — to an ad SDK; the SDK spawns one child per creative. Spawning from a child creates another child of the same root (the hierarchy is flat), inheriting the spawner's `enabledKeys`/`transmissionMode`:

```ts
adSdk.initialize({
	// Full CmcdReporter API for its own playback; structurally unable to
	// rotate the session, re-point targets, or swap transport.
	cmcd: reporter.createChildReporter({ transmissionMode: CMCD_QUERY }),
})

// Inside the SDK — typed only against CmcdReporter:
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
 * (`sid`, `eventTargets`, `version`) belong to the session's root reporter;
 * they are declared `never` so that passing them fails at compile time — even
 * through a widened, non-literal object — with the reason in the tooltip.
 *
 * @public
 */
export type CmcdChildReporterConfig = {
	/**
	 * The content ID of the playback this child reports on. Deliberately NOT
	 * inherited from the parent: omitting it reports no `cid` rather than
	 * silently attributing the child's traffic to the parent's content.
	 *
	 * @defaultValue `undefined`
	 */
	cid?: string;

	/**
	 * The CMCD keys to include in this child's request-mode reports.
	 *
	 * @defaultValue the spawning reporter's `enabledKeys`
	 */
	enabledKeys?: CmcdKey[];

	/**
	 * The transmission mode for this child's request-mode reports.
	 *
	 * @defaultValue the spawning reporter's `transmissionMode`
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
	 * reporter's session. The child owns its persistent data store, its
	 * state-change dedup baseline, and its request-mode encoding config; it
	 * shares the session's `sid`, version, per-target event sequence numbers
	 * and queues, request-mode sequence number, interval timers, `msd`, and
	 * requester. Calling this on a child creates another child of the same
	 * root (the hierarchy is flat).
	 */
	createChildReporter(config: CmcdChildReporterConfig = {}): CmcdReporter

	/**
	 * Makes this reporter the session's active playback: subsequent
	 * TIME_INTERVAL reports snapshot this reporter's persistent data. The
	 * root is active by default. A child's `stop()` reverts the active
	 * reporter to the root if that child was active. An explicit `activate()`
	 * is always honored, including on a previously stopped child — re-call it
	 * after restarting a still-presenting child.
	 */
	activate(): void
}
```

There is no requester parameter on `createChildReporter` — the session's transport is structurally not forkable. At runtime the implementation reads only `cid`, `enabledKeys`, and `transmissionMode` from the config, so a session-owned field smuggled past the compiler (`as any`, plain JavaScript) is inert; this is a tested invariant, not an implementation accident.

### State partition

| State | Scope | Rationale |
|---|---|---|
| `sid` | Session | The spec's session spans primary and interstitial content on one device. Children never store a `sid`; it is injected from the root at report-creation time, atomically with `sn` stamping, so a root `sid` rotation propagates without notifications. |
| `v` / config `version` | Session | Stamped on every report; mixed versions under one `sid` are incoherent for collectors. |
| Per-target event `sn` counters | Session | `sn` is per (session, mode, target) and "MUST be reset to zero on the start of a new session-id". Stamped at enqueue on the root's counters, so all players form one monotonic, gap-free stream per target — the bug being fixed. |
| Request-mode `sn` counter | Session | Same spec clause. Per-instance counters emit duplicate `sn` within (sid, request mode, target) whenever players share a CDN — the normal interstitials case. See Rationale for the shared-counter defense. |
| `msd` value + per-target/request-mode `msdSent` flags | Session | "MUST only be sent once per Session ID and MUST be sent for each reporting mode which is active within the player." In a multi-player session this design reads the per-mode clause against the session rather than each player: emission is gated by the root's flags regardless of which player's report carries it, so a child whose modes are active does not re-send a value the session has already sent. |
| Event queues, batching, failure re-queue, HTTP 410 disposal | Session | Single owner by construction: no splice/unshift interleaving between owners, no duplicate targets, and a 410 silences the target for every player atomically. |
| `TIME_INTERVAL` timers | Session | Exactly one heartbeat per target per session; child `start()`/`stop()` cannot arm or disarm. |
| Active-reporter pointer (new) | Session | Selects whose data feeds `t` reports; root by default; handed off via `activate()`; auto-reverted by `child.stop()`. |
| Requester | Session | Only event-report POSTs use it, and only the root sends. |
| Persistent data store (`cid`, `sta`, `pt`, `bl`, `pr`, `br`, `mtp`, `ot`, …) | Per player | These fields describe one playback. A preloading child's `sta: 'd'` must never clobber the presenting player's snapshot. |
| `lastEmitted` dedup baseline | Per player | Dedup answers "did *this player's* state change". Sharing would cross-suppress: an ad's `sta: 'p'` would swallow the primary's later identical resume. See Unresolved questions. |
| `bg` value + its dedup baseline | Session | The spec scopes `bg` to all players in a session. `update({ bg })` on any reporter writes through to root-owned session state, and `bg` is injected into every report alongside `sid`/`v`, so an active child's heartbeats carry the session's backgrounded state. Its dedup baseline is session-level: root and child writes of the same value emit one `b` event, fired from the writing reporter with that reporter's snapshot. Page-level `visibilitychange` gives every player identical visibility, so last-write-wins suffices; aggregation for split-visibility cases is deferred (see Future possibilities). |
| Request-mode `enabledKeys` + `transmissionMode` | Per player (inherited by default) | Request-mode encoding is per player/CDN; an ad CDN may need query params where the primary CDN takes headers. |

The session-scoped counters `bsa`/`bsda`/`dfa` ("since session initiation") and `bsd` (reported "once per reporting mode and report destination") get no cross-player aggregation in v1: they remain player-supplied numeric inputs via `update()`, with no obvious merge rule to impose (see Future possibilities).

### Event-mode sequence numbers

Every reporter in a session enqueues through the root's target map; `sn` is stamped at enqueue time (`target.sn++`) on the root's counters, exactly where it is stamped today. JavaScript's single thread makes enqueue order total, and the existing FIFO queue plus unshift-on-failure machinery — still with exactly one owner — dispatches batches in queue order. Delivery order across batches is not guaranteed under retry (today or with children): a batch re-queued after a 429/5xx can arrive after a later-`sn` batch that was already in flight. That is spec-legal — `sn` is stamped at enqueue, so `sn`, not arrival order, sequences the target stream. Result: per (sid, target), one monotonic, gap-free sequence across the root and any number of children, with batch bodies interleaving all players' events in call order. Events suppressed by dedup or dropped for a missing required field consume no `sn`, as today.

### Request-mode sequence numbers

`createRequestReport()` on any reporter takes the next number from the root's request-mode counter. `msd` on the request path is gated by the root's request-mode `msdSent` flag. The child's own `enabledKeys`/`transmissionMode` govern encoding.

### `msd`

Session-owned by the root. `update({ msd })` from any reporter — root or child — writes through to the session and is first-write-wins: the first accepted value freezes the session's `msd` until a session reset (`sid` rotation). The spec measures startup delay to when *any* media begins playback — a pre-roll asset player legitimately supplies the session's `msd`, and the primary player's later value must not overwrite it. This deliberately tightens today's root behavior, where `update({ msd })` overwrites the stored value unconditionally and each event target or the request path captures whatever value is current at its own first enqueue — so a mid-session revision can already emit *different* `msd` values across targets and modes under one `sid`, sitting poorly with "once per Session ID". Freezing on the first accepted write guarantees every target and mode emits the same value. Emission is unchanged: at most once per target and once on the request path, per session.

On the spec's trailing qualifier — "for each reporting mode which is active within the player" — this design reads the once-per-Session-ID MUST as controlling in a multi-player session: the per-mode clause selects which modes must carry `msd`, while the session bound caps how often it may be sent; a second player re-sending it under the same `sid` would violate the cap.

### State-change dedup

Each reporter dedups `sta`/`pr`/`cid`/`br` transitions against its own baseline, so two players' transitions never suppress each other. (`bg` is the exception: it dedups against the session-level baseline per the state partition above, and a root `sid` rotation clears that baseline along with the per-player ones.) Consequence, owned and documented: the session stream may contain adjacent same-valued state events from *different* players — the primary emits `ps` with `sta: 'p'`, then the ad child starts playing and emits `ps` with the same `sta: 'p'` — but each report carries its own `cid`, so collectors can attribute correctly. Whether the spec intends dedup per player or per session stream is an unresolved question below; the implementation keeps the baselines relocatable to the session without public API change.

### `TIME_INTERVAL` and the active reporter

Periodic reports snapshot the active reporter's persistent data — root by default, changed by `activate()`, auto-reverted to the root by `child.stop()` if that child was active. Two alternatives were rejected: *root-data-only* means heartbeats during a pre-roll describe an idle primary player (misleading, and the tempting workaround — mirroring ad fields into the root via `update()` — fires root-attributed state events with ad values and poisons the root's dedup baseline); *merged data* produces a chimera (primary `pt` with ad `bl`) that is incoherent and impossible to document. The active-reporter model costs one pointer and maps directly onto the "presenting item" concept players already track.

### `cid`

Spawn-time `cid` seeds the child's store without firing a `c` event — exact parity with the root constructor, which also seeds `cid` silently. The child's first recorded event already carries its `cid` in the snapshot. A player wanting an explicit content-change marker calls `child.recordEvent(CMCD_EVENT_CONTENT_ID, { cid })`; the child's empty baseline guarantees it fires exactly once. When an interstitial ends, the root's store still holds the primary `cid`, so subsequent root reports carry it with no spurious `c` event (the root's baseline never changed). Collectors attribute by the `cid` key on each report, not by counting `c` events.

### `sid` ownership and session reset

Children cannot change the session. At compile time, `sid` is `never`-typed in the spawn config. At runtime, `child.update({ sid })` ignores the key — throwing was rejected because reused controller code forwards whole data objects, and delegating to a session-wide reset was rejected because an ad SDK must not be able to rotate the app's session by accident (see Unresolved questions for a dev-mode warning).

Root `update({ sid })` resets the session exactly as today — every shared `sn` counter to zero, dedup baseline cleared — and the reset now also reaches children: each child lazily observes the session change on its next call and clears its own baseline. Children's subsequent reports carry the new `sid` automatically because `sid` is injected at report-creation time: the root's current `sid` is captured into each report item at the same moment its `sn` is stamped (`target.sn++` at enqueue for event mode; the `createRequestReport()` call for request mode) — never later in the send/encode path. Events already sitting in the shared queues when the root rotates therefore keep the old `sid` with their old `sn` and drain as trailing old-session reports; a batch body sent after a rotation may mix trailing old-`sid` lines with new-`sid` lines starting at `sn` 0, each line internally consistent, preserving both the reset-to-zero rule and per-session monotonicity.

### Lifecycle semantics by role

| Method | Root (unchanged) | Child |
|---|---|---|
| `start()` | Arms timers; fires initial synchronous `t` event | No-op; never (re)claims the active-heartbeat pointer — re-call `activate()` after restarting a still-presenting child |
| `stop()` | Disarms timers | Releases the active-heartbeat pointer if held; timers untouched |
| `stop(true)` | Flush + disarm | Flush session queues + release pointer |
| `flush()` | Flush all queues | Delegates to the root (queues are indivisible) |
| `update()` / `recordEvent()` / `recordResponseReceived()` | As today | Child-local store and baseline (`msd` and `bg` write through to the session); enqueues into root queues |
| `createRequestReport()` | As today | Child's encoding config; shared session `sn`/`msd` |
| `isRequestReportingEnabled()` | As today | Answers for the child's own `enabledKeys` |

A child remains usable after `root.stop()` in the same way the root itself is: recording continues to enqueue, and batch-size-driven sends still fire; only the heartbeat is disarmed. There is no session "destroy" — releasing all references ends the session via garbage collection, as today.

### Target disposal and failure re-queue

Both live exclusively in the root's send path, unchanged. An HTTP 410 deletes the target from the single session map, atomically silencing every player. A 429/5xx re-queues the failed batch at the front of the single per-target queue. Children introduce no second owner, so the hazards of naive queue sharing (splice/unshift interleaving, reprocess ping-pong, re-queue into a drained or disposed target) are structurally absent.

### Grandchildren

`child.createChildReporter()` returns another direct child of the root — delegation depth is always exactly one, so hot paths never walk a chain. Defaults (`enabledKeys`, `transmissionMode`) inherit from the *spawning* reporter, not the root: an ad SDK handed a query-mode child spawns query-mode grandchildren without knowing it isn't holding the root.

### Concurrency

Guaranteed with any number of live children: one monotonic `sn` per (mode, target) — all stamping funnels through root counters on one thread; independent stores and baselines — a preloading child's `sta: 'd'` never suppresses or corrupts the presenter's stream; `msd`/`msdSent` gate once-only keys regardless of which reporter races first; exactly one heartbeat stream exists. Not guaranteed, and documented: heartbeats describe only the active playback (a session with two simultaneously *presenting* players gets no merged snapshot), and cross-player event order within a batch is call order — spec-legal, since `ts` records occurrence time and `sn` orders the target stream.

### Companion fixes

Two latent single-reporter bugs sit directly on this feature's paths and are proposed as `### Fixed` changelog entries (severable into a preceding PR if reviewers prefer; see Unresolved questions):

1. **`resetSession()` never clears `msd`/`msdSent`.** After a `sid` rotation, a fresh `update({ msd })` is silently never sent — the old session's flags suppress the new session's `msd` forever, violating "once per Session ID" (which implies once per *each* session, not once per reporter). The reset will clear both.
2. **`update({ sid: undefined })` deletes the `sid` from all subsequent reports.** The guard skips the session reset for a nullish `sid`, but the merge still spreads the explicit `undefined` into the store. Injecting `sid` at report-creation time (required for children anyway) fixes this for roots too.

Related but left unchanged in this proposal: `update({ v })` can still rewrite the stamped version mid-session on a root. Children are protected (`version` is locked and `v` is injected from the session), but locking the root's `v` after construction is a behavior change beyond this RFC's scope — flagged for reviewers.

### Interaction with the report-transforms proposal

This proposal composes with [Report Transforms for `CmcdReporter` (#390)](https://github.com/streaming-video-technology-alliance/common-media-library/pull/390) without changes to either. Event-mode: a target's `transform` runs at enqueue on the root's targets, so it sees child reports too — `data.cid` distinguishes the source, and `sn` is stamped after the transform on the root's counters, exactly per that RFC's reporter-owned-fields rule. Request-mode: the top-level `transform` is part of the request-report config, so it would join `enabledKeys`/`transmissionMode` as playback-scoped spawn config, inherited from the spawning reporter unless overridden.

### Internal implementation shape

No public `CmcdSession` type is introduced, but the implementation groups the session-owned state (counters, queues, timers, `msd` bookkeeping, requester, active pointer) behind a single private session reference that is `this` for a root and the root for a child. Root hot paths therefore pay one extra monomorphic property read and zero new branches; a future public session object (N sibling reporters, no privileged root) becomes purely additive. Session resets propagate to children via a lazily-compared epoch counter — an integer check on the child's next call — so the root needs no child registry and holds no child references. Reference direction is strictly child→root (plus the one bounded active-pointer edge), which is the whole leak story: a dropped child is garbage immediately. A forgotten `stop()` on an activated child pins one small object and — the real cost — leaves session `TIME_INTERVAL` reports snapshotting that dead playback's frozen `cid`/`sta`/`pt` until the next `activate()`; the memory is trivial, the wire data is not (see Drawbacks).

### Bundle and performance impact

- `CmcdChildReporterConfig` is type-only: zero runtime bytes, `export type *` barrel entry.
- Runtime additions are `createChildReporter`, `activate`, and role branches in the lifecycle methods — estimated well under 1 KB minified on the `CmcdReporter` class, to be measured against the real `dist/` build in the implementation PR. Class methods are not per-method tree-shakeable, so all `CmcdReporter` importers carry this; consumers who never import the class are unaffected.
- Root-only users pay one property hop on shared-state access and one integer compare in `update()`/`recordEvent()`; no new allocations on any root path.
- A child allocates one small object: a data store, an empty baseline, a cached epoch, a root pointer — no map, no queues, no timers. Asset-player churn creates and releases only these.

### Testing

Two existing gaps guard the now-shared machinery and land first, pinning current behavior before any refactor: the 429/5xx re-queue path (no coverage today; the test pins that a re-queued batch is re-sent after later-`sn` batches already dispatched — delivery order is not guaranteed, `sn` sequences the stream) and `sn` reset on `sid` change (the existing test is assertion-free). The acceptance gate for the refactor itself: a reporter with no children passes the entire existing suite unchanged, with byte-identical wire output.

New coverage, following the existing mock-requester and `mock.timers` idioms:

- Interleaved root and child events share one monotonic `sn` per target; two children share it too; deduped/dropped child events consume no `sn`.
- Child events land in root batches and count toward `batchSize`; root and child `flush()` drain them.
- `msd` sent exactly once per target and once per request path across root and children, with the same value in every mode; `msd` is first-write-wins session-wide — a later `update({ msd })` from the root or any child after an accepted write is ignored; post-reset `msd` sends and is writable again (companion fix).
- Child `createRequestReport()`: shared `sn`, child `cid`, child `enabledKeys`/`transmissionMode` overrides (query vs headers), input never mutated.
- Dedup isolation: child transitions never suppress root transitions and vice versa; same-valued cross-player events both emit.
- `bg` session scoping: a child's `update({ bg })` writes through to session state; heartbeats from an active child carry the session `bg`; root and child writing the same `bg` value emit exactly one `b` event; `sid` rotation resets the session `bg` baseline.
- `sid` rotation: shared counters reset, children lazily clear baselines, children's reports carry the new `sid`; events enqueued before the rotation but still unsent retain the old `sid`/`sn` and drain correctly, so a post-rotation batch may mix old- and new-`sid` lines; `child.update({ sid })` is inert.
- Lifecycle: child `start()` arms nothing (interval spies); child `stop()` never disarms session timers; active-pointer handoff including the `stop()` auto-revert; a child `stop()`/`start()` cycle leaves the root active until `activate()` is re-called; an activated child abandoned without `stop()` keeps feeding heartbeats until the next `activate()` (assert heartbeat content); re-`start()` idempotency with children present.
- 410 disposal observed through a child; re-queue path exercised with child events in the batch.
- Spawn-config hardening: session-owned fields passed via `as any` are inert.
- Grandchild flattening and spawner-default inheritance.
- A `// #region example` block wired into the TSDoc via `{@includeCode}`.

## Drawbacks

- **Everyone importing `CmcdReporter` pays the bytes.** Sub-kilobyte, but real; the tree-shakeable alternative (a free factory function) cannot reach private session state and breaks `CmcdReporter`-typed assignability (see Rationale).
- **`activate()` is a new concept.** Correct interstitial heartbeats need two `activate()` call sites in the player's interstitials controller. The default (root data) is safe but stale during interstitials for integrators who skip it.
- **An activated child abandoned without `stop()` freezes the heartbeat on dead data.** The active pointer moves only via `stop()` or a later `activate()`; if an activated child is torn down on an error path that skips `stop()` (for example, inside an ad SDK) and no revert is wired, every subsequent `TIME_INTERVAL` report carries the dead playback's frozen store. Likewise, a stray `activate()` from torn-down code re-grabs the heartbeat — explicit calls are always honored. Mitigations: always revert on error paths (the hls.js `INTERSTITIALS_PRIMARY_RESUMED` wiring recovers automatically), and the deferred `detach()` (see Future possibilities) hardens this fully.
- **Child `flush()`/`stop(true)` flush the whole session's queues** — per-child flushing would require per-item attribution in shared queues. Every asset teardown force-sends partially filled batches; spec-legal, but reduces batching efficiency for ad-heavy content.
- **No post-teardown inertness.** A destroyed-but-still-referenced child that keeps recording (a stray async callback) injects events into the live session stream. v1 relies on GC plus `stop()`; a `detach()`-style hard cut is deferred (see Future possibilities).
- **Session-scoped counters without aggregation.** `bsa`/`bsda`/`dfa` and `bsd` remain per-player inputs in v1; a multi-player session can emit per-player values for spec-session-scoped counters.
- **Cross-bundle nominal typing.** If a player bundles its own copy of `@svta/cml-cmcd` while the app injects a reporter built from another copy, runtime works (interface calls only), but TypeScript rejects the assignment because private members make the class nominal. Needs documented single-copy/dedupe guidance.
- **The fix is inert until players adopt it.** hls.js needs the `cmcd.reporter` seam and `activate()` wiring; Shaka the equivalent in `InterstitialAdManager`. Companion upstream issues should accompany this RFC.

## Rationale and alternatives

- **Naming: `createChildReporter` over `spawn`/`clone`/`fork`.** `create*` is the package's only factory verb (`createRequestReport`, `createFetchTransport`, `createXhrTransport`; repo-wide `createWebVttCue`, `createIsoBoxReadableStream`), and it autocompletes beside `createRequestReport` on the class. `clone` is actively misleading — it promises an independent copy, while this object *shares* session state, the opposite of a clone. `spawn`/`fork` have no in-repo precedent and read as process APIs. "Child reporter" names the exact relationship the docs must teach.
- **Same class, not a subclass, interface, or factory function.** Players type their controller fields `CmcdReporter`; because the class has TypeScript-private members, only a genuine instance is assignable, so a structural look-alike or separate child class would force every player to retype its integration. Same class preserves `instanceof`, keeps one documented surface, and reuses existing method implementations via role branches. A free `createCmcdChildReporter(parent)` function would be tree-shakeable but cannot reach the reporter's private session state without publicizing mutable internals — and its return type problem is the same.
- **`never`-typed locks over `Omit`.** `Omit<CmcdReporterConfig, 'sid' | …>` only rejects excess properties on object literals; a widened object smuggles `sid` through silently, and future additions to `CmcdReporterConfig` silently become child-overridable. Explicit `never` fields block widened objects too, keep the lock list auditable, and surface the *reason* in the editor tooltip. Cost: locked fields appear in autocomplete (with their explanation) — see Unresolved questions.
- **Minimal variant without `activate()`** (heartbeats always snapshot root data): rejected. During a pre-roll, periodic reports would describe an idle primary player, and the natural workaround — mirroring ad fields into the root's `update()` — fires root-attributed state events with ad values and corrupts the root's dedup baseline. A design whose documented workaround is a pit of failure is not minimal, just incomplete.
- **Public session-first API** (`CmcdSession` owning targets, reporters as views, explicit `detach()`): the right long-term shape, and this proposal's internals are deliberately arranged so it stays purely additive. Rejected for v1: a larger surface (three-plus concepts), a `detach()`-vs-`stop()` distinction that existing destroy paths never call, and — in the session-first variant considered — any child being able to rotate the session `sid`, the single worst wrong-wire-data hazard of any alternative on this list.
- **Document "share one reporter instance across players"**: rejected; corrupts per-player state (see Motivation).
- **Per-player reporters with collector-side stitching** (accept duplicate `sn` streams, let collectors de-conflict by heuristics): rejected; it violates the `sn` monotonicity requirement, and CMCD v2 has no per-player discriminator key that would make stitching reliable.
- **Shared request-mode `sn` counter** (vs per-child): the spec scopes `sn` per combination of mode and target within a session; request-mode "target" granularity is arguably per-CDN. A single session counter is safe under *any* reading: a globally monotonic sequence remains monotonic when partitioned into per-origin sub-streams, and the spec requires monotonicity, not contiguity — while per-child counters produce outright duplicates whenever players share a CDN, the common case. A per-origin counter map remains a compatible future refinement.

## Prior art

- **dash.js** plays DASH ad periods inside a single `MediaPlayer` with one CMCD model: `sid` continuity and a single `sn` stream across content boundaries are automatic. This proposal gives multi-player architectures the same wire behavior.
- **hls.js** already shares parent identity with asset players (`primarySessionId` feeding the `_HLS_primary_id` query param) and already shares object-valued CMCD config by reference (`cmcd.loader`, `cmcd.reporterCallback`) — precedent for both the session concept and the injection channel.
- **Shaka Player**'s `InterstitialAdManager` drives a secondary `shaka.Player` with copied CMCD config and no session coordination — the same gap, ready for the same fix.
- **In-package precedent**: `CmcdReporter.createRequestReport()` for factory-method naming; `CmcdReportRecorder.detach()` for the deferred inert-ification verb.

## Unresolved questions

1. **State-change dedup scope.** Is the no-consecutive-duplicates expectation per player or per session stream? Per-child baselines (this proposal) can put adjacent same-valued `ps` lines from different players on one `sid` stream, distinguishable by `cid`/`ts`. Needs CTA WAVE / collector-implementer confirmation; the baselines are kept relocatable to the session either way.
2. **Heartbeat model validation.** Does the active-reporter model match collector expectations, or do collectors want parallel per-player heartbeats or merged snapshots? Related: which reporter should be active during hls.js `interstitialAppendInPlace` playback (the parent media element keeps presenting), and what should dual-presentation sessions (e.g. a PiP ad) report?
3. **`child.update({ sid })` is silently ignored.** This conflicts with the repo's actionable-failure preference, but throwing breaks controller code that forwards whole data objects. Is a dev-mode console warning worth it?
4. **Behavior changes: bundled or split?** Should the `resetSession()` `msd`/`msdSent` fix and the `update({ sid: undefined })` fix land in this feature PR as `### Fixed` entries, or precede it in their own PR? Both change wire output for existing edge-case usage. The session-wide `msd` freeze also changes root behavior (today `update({ msd })` is revisable at any time and captured per-target at enqueue): a root-only app that revises `msd` before its first report today would lose the revision. Same question for it — and should root `update({ v })` be locked in the same change, or deferred to a separate proposal?
5. **Locked-field ergonomics.** Do reviewers prefer the discoverable `never`-typed locks (fields visible in autocomplete with an explanation) or a quieter `Omit`-based config that hides them but only guards object literals?
6. **Child teardown flush scope.** Is session-wide flush on `child.stop(true)` acceptable (smaller batches at every asset boundary), or should a child's flush be a no-op given its events are already safe in the root's queues?

## Future possibilities

- **A public `CmcdSession`**: session-first construction with N sibling reporters and no privileged root; the internal partition is already this shape.
- **`detach()`** (naming precedent: `CmcdReportRecorder.detach`): hard-cut inert-ification so a torn-down child's stray late calls become no-ops.
- **Cross-player aggregation**: refine v1's last-write-wins session `bg` into automatic visibility aggregation (backgrounded only when *all* players are hidden) for split-visibility cases, and aggregation hooks for the session-scoped counters `bsa`/`bsda`/`dfa` and `bsd`.
- **Per-origin request-mode `sn` counters**, if collector guidance favors contiguous per-CDN sequences.
- **A readonly `sid` accessor**, so apps can correlate child playbacks externally when the root auto-generated its session ID.
- **Companion player integrations**: the hls.js `cmcd.reporter` seam and `activate()` wiring, and the Shaka `InterstitialAdManager` equivalent.

## Revision history

- **2026-07-23 (v1)**: initial draft.

## Final Decision

*(Completed after review)*

**Decision:**
**Rationale:**
**Date:**
