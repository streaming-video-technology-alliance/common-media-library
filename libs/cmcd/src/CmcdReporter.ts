import type { HttpRequest, HttpResponse } from '@svta/cml-utils'
import { applyReportPolicy } from './applyReportPolicy.ts'
import { CMCD_MIME_TYPE } from './CMCD_MIME_TYPE.ts'
import { CMCD_PARAM } from './CMCD_PARAM.ts'
import { CMCD_REQUEST_PROVENANCE } from './CMCD_REQUEST_PROVENANCE.ts'
import { CMCD_REQUIRED_EVENT_KEYS } from './CMCD_REQUIRED_EVENT_KEYS.ts'
import type { Cmcd } from './Cmcd.ts'
import { CMCD_EVENT_RESPONSE_RECEIVED, CMCD_EVENT_TIME_INTERVAL, CmcdEventType } from './CmcdEventType.ts'
import type { CmcdPlaybackState } from './CmcdPlaybackState.ts'
import { CMCD_ROOT_PID, createCmcdPlaybackState, mintProvenance } from './CmcdPlaybackState.ts'
import type { CmcdReporterConfig } from './CmcdReporterConfig.ts'
import type { CmcdReporterCustomData } from './CmcdReporterCustomData.ts'
import type { CmcdRequestProvenance } from './CmcdRequestProvenance.ts'
import { CMCD_EVENT_MODE, CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import { CmcdSessionLedger } from './CmcdSessionLedger.ts'
import type { CmcdEventTargetState, CmcdSessionState } from './CmcdSessionState.ts'
import { CMCD_DEFAULT_REQUEST_TARGET, createCmcdSessionState } from './CmcdSessionState.ts'
import type { CmcdTransformRequest } from './CmcdTransformRequest.ts'
import { CMCD_HEADERS, CMCD_QUERY } from './CmcdTransmissionMode.ts'
import { acceptStateChange, CMCD_STATE_FIELDS } from './acceptStateChange.ts'
import { copyReportValues } from './copyReportValues.ts'
import type { CmcdEventReportConfigNormalized, CmcdReporterConfigNormalized } from './createCmcdReporterConfig.ts'
import { createCmcdReporterConfig, createEncodingOptions } from './createCmcdReporterConfig.ts'
import { decodeCmcd } from './decodeCmcd.ts'
import { encodeCmcd } from './encodeCmcd.ts'
import { encodePreparedCmcd } from './encodePreparedCmcd.ts'
import { prepareCmcdData } from './prepareCmcdData.ts'
import { stampReport } from './stampReport.ts'
import { toPreparedCmcdHeaders } from './toPreparedCmcdHeaders.ts'

/**
 * Decodes the per-call data snapshot a provenance record carries into
 * fresh, encodable report data: tokens revive as `SfToken` and
 * params-bearing items as `SfItem` (`useSymbol: false`), so every value
 * keeps its wire type through re-encoding. Only called in
 * `recordResponseReceived()`. Returns an empty object when the record is
 * absent, carries no snapshot, or the snapshot does not parse (a value
 * this reporter did not write); the response then reports its derived keys
 * over the session's data alone.
 */
function decodeSnapshot(provenance: unknown): Cmcd {
	const encoded = (provenance !== null && typeof provenance === 'object')
		? (provenance as { data?: unknown; }).data
		: undefined

	if (typeof encoded !== 'string' || !encoded) {
		return {}
	}

	try {
		return decodeCmcd(encoded, { useSymbol: false }) as Cmcd
	}
	catch {
		return {}
	}
}

function defaultRequester(request: HttpRequest): Promise<{ status: number; }> {
	const { url, ...init } = request
	return fetch(url, init)
}

/**
 * The CMCD reporter.
 *
 * `C` describes the player's own `customData`, which the reporter passes
 * through to each configured `transform`. It is inferred from the
 * configuration, so annotating a single `transform` types the request in every
 * other one; the default leaves `customData` values `unknown`.
 *
 * @typeParam C - The shape of the player's `customData`. Defaults to
 *                `Record<string, unknown>`.
 *
 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#reporting-modes-when-we-send-data | CTA-5004-B Reporting Modes}
 *
 * @public
 */
export class CmcdReporter<C = Record<string, unknown>> {
	private timeOrigin = performance.timeOrigin || performance.timing?.fetchStart || Date.now() - performance.now()
	private config: CmcdReporterConfigNormalized<C>

	private ledger: CmcdSessionLedger<C>
	private fanOutDepth = 0
	private evictPending = false

	/**
	 * The reporter's own playback: the persistent data store, base provenance
	 * record and dedup baseline every report the reporter builds is drawn
	 * from. Outlives the session it reports into; `startSession()` archives
	 * its store on the ended session and recreates it under the new `sid`.
	 */
	private playback: CmcdPlaybackState

	/**
	 * Armed time-interval timers by target config. Timers outlive session
	 * changes (their callbacks report into whichever session is current at
	 * fire time), so they live on the reporter rather than the session.
	 */
	private intervals = new Map<CmcdEventReportConfigNormalized<C>, ReturnType<typeof setInterval>>()
	private started = false

	private requester: (request: HttpRequest) => Promise<{ status: number; }>

	/**
	 * Creates a new CMCD reporter.
	 *
	 * @param config - The configuration for the CMCD reporter.
	 * @param requester - The function to use to send the request.
	 *                    The default is a simple wrapper around the
	 *                    native `fetch` API.
	 */
	constructor(config: Partial<CmcdReporterConfig<C>>, requester: (request: HttpRequest) => Promise<{ status: number; }> = defaultRequester) {
		this.config = createCmcdReporterConfig(config)
		this.playback = createCmcdPlaybackState(CMCD_ROOT_PID, this.config.sid, 0, {
			cid: this.config.cid,
			v: this.config.version,
		})
		this.ledger = new CmcdSessionLedger(this.config.sessionRetention, createCmcdSessionState(this.config.sid, undefined, this.config.eventTargets))
		this.requester = requester
	}

	/**
	 * Resets the playback's dedup baseline when the ledger epoch has moved
	 * past the one it last observed.
	 */
	private syncPlayback(): void {
		if (this.playback.epoch !== this.ledger.epoch) {
			this.playback.epoch = this.ledger.epoch
			this.playback.lastEmitted = {}
		}
	}

	/**
	 * Starts the CMCD reporter. Called by the player when the reporter is enabled.
	 *
	 * Note: This fires an initial time-interval event immediately (synchronously)
	 * before the first interval elapses. Ensure CMCD data (sid, cid, etc.) is
	 * populated before calling start().
	 */
	start(): void {
		this.started = true

		// The initial time-interval event is fired synchronously per target, so a
		// throwing transform must not abort the loop: later targets would never
		// have their intervals armed and would report nothing for the session,
		// and a retried start() would fail on the same target again. Same
		// continue-then-rethrow contract as `emitEvent()`.
		let failure: { error: unknown; } | undefined

		// The fan-out is pinned to the session that was current when start()
		// was called: a transform can synchronously rotate the session, and
		// pairing the new session with the old session's targets would let a
		// report consume another session's sequence numbers.
		const session = this.ledger.current

		this.fanOutDepth++

		try {
			session.eventTargets.forEach((target, config) => {
				// Disarm any existing timer so repeated start() calls do not leak intervals.
				this.disarmInterval(config)

				// A target disposed via HTTP 410 stays silent for the rest of the
				// session. Armed before the initial event so a throwing transform
				// leaves the timer in the same state a successful start() would,
				// rather than silently disabling the target.
				if (target.disposed || !this.armInterval(config)) {
					return
				}

				try {
					this.recordTargetEvent(session, target, config, CMCD_EVENT_TIME_INTERVAL)
					this.processEventTargets()
				}
				catch (error) {
					failure ??= { error }
				}
			})
		}
		finally {
			this.fanOutDepth--
		}

		this.maybeEvict()

		if (failure) {
			throw failure.error
		}
	}

	/**
	 * Arms the time-interval timer for an event target when its config calls
	 * for one. Returns whether a timer was armed. The callback reports into
	 * whichever session is current when it fires.
	 */
	private armInterval(config: CmcdEventReportConfigNormalized<C>): boolean {
		// If the interval is 0 or the TIME_INTERVAL event is not enabled, do not start the interval.
		if (config.interval === 0 || !config.events.includes(CMCD_EVENT_TIME_INTERVAL)) {
			return false
		}

		this.intervals.set(config, setInterval(() => {
			const session = this.ledger.current
			const target = session.eventTargets.get(config)

			if (target) {
				this.recordTargetEvent(session, target, config, CMCD_EVENT_TIME_INTERVAL)
				this.processEventTargets()
			}
		}, config.interval * 1000))

		return true
	}

	/**
	 * Stops the CMCD reporter. Called by the player when the reporter is disabled.
	 *
	 * @param flush - Whether to flush the event targets.
	 */
	stop(flush: boolean = false): void {
		this.started = false

		if (flush) {
			this.flush()
		}

		for (const config of this.config.eventTargets) {
			this.disarmInterval(config)
		}
	}

	/**
	 * Forces the sending of all event reports, regardless of the batch size or interval.
	 * Useful for sending outstanding reports when the player is destroyed or a playback
	 * session ends.
	 */
	flush(): void {
		this.processEventTargets(true)
	}

	/**
	 * Updates the CMCD data.
	 *
	 * Called by the player when data changes. For tracked state fields
	 * (`sta`, `pr`, `cid`, `bg`, `br`), if the new value differs from the
	 * last-reported value (the value most recently emitted on the wire for
	 * that field), the corresponding state-change event is automatically
	 * fired. Comparing against the last-reported value (rather than the
	 * previous persisted value) ensures the first state-change event in a
	 * new session always emits, even when the persisted value didn't change
	 * across the `sid` boundary.
	 *
	 * Multi-field updates fire multiple events in the order: `sta` → `pr` →
	 * `cid` → `bg` → `br`. The order of keys in the input object does not
	 * affect the firing order.
	 *
	 * To attach snapshot context (e.g., `bl`, `mtp`, `pt`, `ltc`) to a
	 * state-change event, ensure those fields are in the reporter's data
	 * before the state field changes. Either include them alongside the
	 * state field in the same `update()` call, or persist them via earlier
	 * `update()` calls — auto-fired events emit whatever is currently in
	 * the persistent data store. This is also how to keep `TIME_INTERVAL`
	 * reports useful — those events draw from the persistent data store
	 * with no caller hook for per-event data, so fields the player wants
	 * in periodic reports must be kept fresh here.
	 *
	 * A `sid` change resets the dedup baseline.
	 *
	 * `sid` and `msd` are session-owned: the reporter tracks them itself and
	 * stamps them onto every outgoing report, so this method is the only way
	 * to change them. A per-call value on {@link CmcdReporter.recordEvent},
	 * {@link CmcdReporter.createRequestReport}, or
	 * {@link CmcdReporter.recordResponseReceived} has no effect; response
	 * attribution is by the provenance record alone.
	 * `msd` must be a finite number of milliseconds between `0` and
	 * `999_999_999_999_999` (the RFC 8941 integer maximum); it is rounded to
	 * the nearest integer, and invalid values are ignored.
	 *
	 * @param data - The data to update.
	 */
	update(data: Partial<Cmcd>): void {
		this.syncPlayback()

		if (data.sid && data.sid !== this.ledger.current.sid) {
			this.startSession(data.sid)
		}

		const session = this.ledger.current
		const { msd } = data

		// CTA-5004-B defines msd as integer milliseconds, sent once per session.
		// 0 is a valid instant-start value; anything non-finite or negative is
		// ignored so it can neither reach the wire nor consume the send gate.
		// The rounded value must also fit an RFC 8941 structured-field integer
		// (at most 999_999_999_999_999), or serialization throws after the
		// gate is already consumed.
		if (typeof msd === 'number' && Number.isFinite(msd) && msd >= 0) {
			const rounded = Math.round(msd)

			if (rounded <= 999_999_999_999_999) {
				session.msd = rounded
			}
		}

		// sid and msd are session-owned: tracked in their own fields, stripped
		// from the persistent store, and stamped onto each report at queue time.
		this.playback.data = { ...this.playback.data, ...data, sid: undefined, msd: undefined }

		// bg is session-owned too, but its value is a report field rather than a
		// stamp: it is tracked here and picked up when each report is built, and
		// the key is deleted from the store rather than left undefined. Dedup and
		// emission stay in the event path.
		if ('bg' in data) {
			session.bg = data.bg
			delete this.playback.data.bg
		}

		// A cid change re-mints the playback's base provenance record, so a
		// request issued from here on carries the new cid while requests
		// already in flight keep the one they were issued under. Their late
		// responses then report the content the request was actually about.
		if (this.playback.data.cid !== this.playback.provenance.cid) {
			this.playback.provenance = mintProvenance(session.sid, this.playback.data.cid)
		}

		// Auto-trigger state-change events for any tracked field the caller
		// supplied. The emit path applies the same dedup against the last
		// wire-emitted value, so a value that did not change is suppressed there.
		for (const entry of CMCD_STATE_FIELDS) {
			if (entry.field in data) {
				this.recordEvent(entry.event)
			}
		}
	}

	/**
	 * Starts a new session: the current one is archived in place for stale
	 * attribution, a fresh one takes over, ended sessions are drained, and
	 * the oldest are evicted beyond the configured retention.
	 *
	 * The data store is carried over, and the archived snapshot is frozen:
	 * the ended session's value graph is detached first, so nested values
	 * the caller handed to `update()` can no longer mutate it, and the new
	 * session starts from a shallow copy of the detached graph, so `cid`,
	 * `br`, custom keys and the rest survive a `sid` change as they always
	 * have. Sessions are keyed by `sid`, which CTA-5004-B expects to be
	 * unique per playback session: reusing one replaces the retained
	 * namesake, whose remaining state dies as if evicted and whose late
	 * responses relabel onto the replacement.
	 */
	private startSession(sid: string): void {
		const snapshot = copyReportValues({ ...this.playback.data })
		const bg = this.ledger.current.bg
		this.ledger.rotate(createCmcdSessionState(sid, bg, this.config.eventTargets), this.playback.pid, snapshot)
		this.playback = createCmcdPlaybackState(this.playback.pid, sid, this.ledger.epoch, { ...snapshot })

		// Drain ended sessions before eviction can destroy their queues: a
		// partial batch the ended session could never fill again leaves now.
		this.processEventTargets()
		this.requestEvict()

		// Timers keep ticking across session changes. Configs whose timer was
		// disarmed by a 410 in the previous session re-arm here, because the
		// new session's targets are fresh; the immediate report start() fires
		// is not repeated.
		if (this.started) {
			for (const config of this.config.eventTargets) {
				if (!this.intervals.has(config)) {
					this.armInterval(config)
				}
			}
		}
	}

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

	/**
	 * Records an event. Called by the player when an event occurs.
	 *
	 * For state-change events (`PLAY_STATE`, `PLAYBACK_RATE`, `CONTENT_ID`,
	 * `BACKGROUNDED_MODE`, `BITRATE_CHANGE`), this method:
	 * 1. Persists the dedup field from `data` (if present) into the reporter's
	 *    persistent data store — equivalent to a write-through `update()`.
	 * 2. Drops the event entirely if the dedup field has no value after the
	 *    write-through (never set, or cleared via `update({ field: undefined })`).
	 *    State-change events without their required field would violate CTA-5004-B.
	 * 3. Suppresses the event if the field's current value matches the
	 *    last-emitted value (no state transition).
	 *
	 * For all other event types, the event is always emitted.
	 *
	 * For state-change events, prefer {@link CmcdReporter.update} — including
	 * for snapshot enrichment via a combined call like
	 * `update({ sta: 'p', bl: [3000], mtp: [8500] })`. Calling `recordEvent()`
	 * for a state-change event after `update()` has already auto-fired it
	 * silently drops the second call's `data`, because dedup suppresses the
	 * second emission.
	 *
	 * Use `recordEvent()` directly for events whose payload is intrinsic to
	 * the event call — `CUSTOM_EVENT` with `cen`, `ERROR` with `ec`,
	 * ad-lifecycle events, `MUTE`/`UNMUTE`, `PLAYER_EXPAND`/`PLAYER_COLLAPSE`,
	 * `SKIP`. For `RESPONSE_RECEIVED`, prefer
	 * {@link CmcdReporter.recordResponseReceived}, which derives the
	 * per-response fields automatically.
	 *
	 * @param type - The type of event to record.
	 * @param data - Additional data to record with the event. This data
	 *               only applies to this event report, except for the dedup
	 *               field of a state-change event, which is also persisted
	 *               into the reporter's data store. Session-owned keys
	 *               (`sid`, `msd`) supplied here are ignored; the reporter
	 *               stamps its own values.
	 */
	recordEvent(type: CmcdEventType, data: Partial<Cmcd> = {}): void {
		this.emitEvent(this.ledger.current, type, data)
	}

	/**
	 * Records an event across every configured target of a session, applying
	 * state-change dedup once before per-target fan-out.
	 *
	 * @param session - The session the event belongs to. Everything session-scoped
	 *                  the event touches (bg, counters, gates, queues, the archived
	 *                  data snapshot) is that session's; only
	 *                  `recordResponseReceived()` ever passes an archived one.
	 * @param type - The type of event to record.
	 * @param data - Additional data to record with the event.
	 * @param request - The media request that triggered the event, when
	 *                  one exists. Only `recordResponseReceived()`
	 *                  populates this; it is threaded through to each
	 *                  target's `transform`.
	 */
	private emitEvent(session: CmcdSessionState<C>, type: CmcdEventType, data: Partial<Cmcd>, request?: HttpRequest): void {
		this.syncPlayback()

		// Passing the current playback is safe for an archived session: only
		// RESPONSE_RECEIVED is ever emitted into one, and a non-state event
		// touches neither the playback's store nor the session's bg state.
		if (!acceptStateChange(this.playback, session, type, data)) {
			return
		}

		// A throwing transform must not abort the fan-out. The dedup baseline
		// above is already committed and is never rolled back, so aborting here
		// would strand the transition: targets after the throwing one would
		// never receive it, and the caller's retry would be deduped away.
		let failure: { error: unknown; } | undefined

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

		// Surfaced only once every target has had its turn and the queues have
		// been processed. Transforms must not throw; this makes the violation
		// visible without letting it starve unrelated targets.
		if (failure) {
			throw failure.error
		}
	}

	/**
	 * Records an event for a target. Called by the reporter when an event occurs.
	 *
	 * @param target - The target to record the event for.
	 * @param config - The configuration for the target.
	 * @param type - The type of event to record.
	 * @param data - Additional data to record with the event. This data
	 *               only applies to this event report. Persistent data should
	 *               be updated using `update()`.
	 * @param request - The media request that triggered the event, when
	 *                  one exists. Passed to the target's `transform`.
	 */
	private recordTargetEvent(session: CmcdSessionState<C>, target: CmcdEventTargetState, config: CmcdEventReportConfigNormalized<C>, type: CmcdEventType, data: Partial<Cmcd> = {}, request?: HttpRequest): void {
		if (target.disposed || !config.events.includes(type)) {
			return
		}

		// The session's sid is stamped over any per-call value here so a
		// transform sees the session identity the report will carry. The store
		// is resolved per call: a transform that rotates the session mid
		// fan-out leaves later targets reading the archived snapshot.
		const item: Cmcd = {
			...(session.snapshots.get(CMCD_ROOT_PID) ?? this.playback.data),
			...(session.bg !== undefined && { bg: session.bg }),
			...data,
			sid: session.sid,
			e: type,
			ts: data.ts ?? Date.now(),
		}

		const report = applyReportPolicy(item, config.transform, request, CMCD_REQUIRED_EVENT_KEYS.get(type), true)

		if (report == null) {
			return
		}

		this.queueTargetEvent(session, target, config, report, type)
	}

	/**
	 * Stamps the reporter-owned fields on a finished event report, encodes it,
	 * and pushes the wire line to the target's queue.
	 *
	 * Called after any transform has run, so a transform cannot bypass the
	 * target's `events` filter via `e`, break `sn` continuity, or substitute
	 * the session identity carried by `sid` and `msd`. Encoding here means a
	 * report that cannot serialize throws inside the recording call that
	 * produced it, instead of rejecting the batch send and re-queueing
	 * forever.
	 *
	 * @param target - The target to queue the report for.
	 * @param config - The configuration for the target.
	 * @param report - The finished report data.
	 * @param type - The type of event being reported.
	 */
	private queueTargetEvent(session: CmcdSessionState<C>, target: CmcdEventTargetState, config: CmcdEventReportConfigNormalized<C>, report: Cmcd, type: CmcdEventType): void {
		const attach = stampReport(report, session, target, config.enabledKeys?.includes('msd') ?? false, type)

		target.queue.push(encodeCmcd(report, createEncodingOptions(CMCD_EVENT_MODE, config)))

		target.sn++

		if (attach) {
			target.msdSent = true
		}
	}

	/**
	 * Records a response-received event. Called by the player when a media
	 * request response has been fully received.
	 *
	 * This method automatically derives the `rr` event keys from the
	 *
	 * - `url` - the original requested URL (before any redirects)
	 * - `rc` - the HTTP response status code
	 * - `ts` - the request initiation time (from `resourceTiming.startTime`)
	 * - `ttfb` - time to first byte (from `resourceTiming.responseStart`)
	 * - `ttlb` - time to last byte (from `resourceTiming.duration`)
	 *
	 * Additional keys like `ttfbb`, `cmsdd`, `cmsds`, and `smrt` can be
	 * supplied via the `data` parameter if the player has access to them.
	 *
	 * The request's `customData` is generic, so a player can pass a request
	 * carrying its own taxonomy (e.g. `{ requestType: 'segment' }`) without a
	 * cast. The reporter reads only the provenance record that
	 * {@link CmcdReporter.createRequestReport} writes there; every other key
	 * is left untouched and stays visible to an event target's `transform`
	 * via its `request` argument.
	 *
	 * A reporter given a concrete `C` requires the request to satisfy it, so a
	 * request the configured transforms could not read is rejected here rather
	 * than reaching them; see {@link CmcdReporterCustomData}.
	 *
	 * The event is attributed to the session that issued the request, and to
	 * nothing else: the provenance record that
	 * {@link CmcdReporter.createRequestReport} stored on the request's
	 * `customData` (under {@link CMCD_REQUEST_PROVENANCE}) selects the
	 * session by its `sid`, or the response is dropped rather than
	 * relabeled. There is no other key: a record lost to a serialization
	 * boundary (and not restored; see the bridge notes on
	 * {@link CMCD_REQUEST_PROVENANCE}) and a session no longer retained
	 * (see `CmcdReporterConfig.sessionRetention`) both drop, and a per-call
	 * `data.sid` cannot substitute. The record is honored wherever its
	 * `sid` resolves: a request decorated by another reporter configured
	 * with the same session attributes here, as does a hand-built record.
	 * A response that completes after a `sid` change reports under its own
	 * retained session, with that session's data snapshot and sequence
	 * numbers.
	 *
	 * Request-time report keys come from the record's encoded per-call
	 * `data` snapshot, decoded fresh per response, and the record's `cid`
	 * reports in place of the session's current one, so a response that
	 * completes after a mid-session content change keeps the meaning it
	 * had when its request was issued.
	 *
	 * @typeParam RD - The `customData` this request carries. Defaults to the
	 *                reporter's own `C`.
	 *
	 * @param response - The HTTP response received.
	 * @param data - Additional CMCD data to include with the event.
	 *               Values provided here override any auto-derived values.
	 *               Session-owned keys (`sid`, `msd`) supplied here are
	 *               ignored; attribution is by the provenance record alone.
	 */
	recordResponseReceived<RD extends CmcdReporterCustomData<C> = C>(response: HttpResponse<HttpRequest<RD & { cmcd?: Cmcd; [CMCD_REQUEST_PROVENANCE]?: CmcdRequestProvenance }>>, data: Partial<Cmcd> = {}): void {
		const { request } = response

		const url = data.url ?? request?.url

		if (!url) {
			return
		}

		// Attribution is by the provenance record alone: its sid names a
		// retained session, or the response is dropped rather than relabeled.
		const provenance = request.customData?.[CMCD_REQUEST_PROVENANCE]
		const session = this.ledger.resolve(provenance)

		if (!session) {
			return
		}

		// Request-time report data comes from the per-call snapshot on the
		// same record, decoded fresh per response, never from the
		// player-facing `customData.cmcd` object: the snapshot is
		// reporter-written bytes, immune to caller mutation and lossless
		// across any boundary the record is carried over.
		const cmcd = decodeSnapshot(provenance)

		// The record's cid is the content the request was issued under. It
		// overrides the session store's current value so a response landing
		// after a mid-session content change keeps its meaning, and it
		// yields to the decoded snapshot and per-call data above it.
		const { cid } = provenance as { cid?: unknown; }

		const urlObj = new URL(url)
		urlObj.searchParams.delete(CMCD_PARAM)

		const derived: Partial<Cmcd> = {
			url: urlObj.toString(),
			rc: response.status,
		}

		const timing = response.resourceTiming

		if (timing) {
			if (timing.startTime != null) {
				derived.ts = Math.round(this.timeOrigin + timing.startTime)

				if (timing.responseStart != null) {
					derived.ttfb = Math.round(timing.responseStart - timing.startTime)
				}
			}

			if (timing.duration != null) {
				derived.ttlb = Math.round(timing.duration)
			}
		}

		this.emitEvent(session, CMCD_EVENT_RESPONSE_RECEIVED, {
			...(typeof cid === 'string' && cid ? { cid } : undefined),
			...cmcd,
			...derived,
			...data,
		}, request)
	}

	/**
	 * Applies the CMCD request report data to the request. Called by the player
	 * before sending the request.
	 *
	 * @param req - The request to apply the CMCD request report to.
	 * @returns The request with the CMCD request report applied.
	 *
	 * @deprecated Use {@link CmcdReporter.createRequestReport} instead.
	 */
	applyRequestReport(req: HttpRequest): HttpRequest {
		return this.createRequestReport(req) ?? req
	}

	/**
	 * Checks if the request reporting is enabled.
	 *
	 * @returns `true` if the request reporting is enabled, `false` otherwise.
	 */
	isRequestReportingEnabled(): boolean {
		return !!this.config.enabledKeys?.length
	}

	/**
	 * The provenance record to stamp on a returned request: the playback's
	 * frozen base record, extended with the caller's per-call data encoded
	 * as a CMCD string when there is any. Requests without per-call data
	 * share the base record, so decoration stays a single property write.
	 * The snapshot never contains reporter-stamped fields, and a value that
	 * cannot encode contributes no snapshot rather than failing the
	 * request; its response still attributes and reports derived keys over
	 * session data, matching `decodeSnapshot()`'s tolerance on the read
	 * side.
	 */
	private createRequestProvenance(data: Partial<Cmcd> | undefined, baseUrl: string | undefined): CmcdRequestProvenance {
		const base = this.playback.provenance

		if (!data) {
			return base
		}

		try {
			const encoded = encodeCmcd(data as Cmcd, {
				version: this.config.version,
				reportingMode: CMCD_REQUEST_MODE,
				baseUrl,
			})

			return encoded ? Object.freeze({ ...base, data: encoded }) : base
		}
		catch {
			return base
		}
	}

	/**
	 * Creates a new request with the CMCD request report data applied. Called by the player
	 * before sending the request.
	 *
	 * A reporter given a concrete `C` requires the request's `customData` to
	 * satisfy it, so a request the configured transform could not read is
	 * rejected here rather than reaching it; see
	 * {@link CmcdReporterCustomData}.
	 *
	 * @typeParam R - The request being decorated. Its `customData` must satisfy
	 *                the reporter's `C`.
	 *
	 * @param request - The request to apply the CMCD request report to.
	 * @param data - The data to apply to the request. This data only
	 *               applies to this request report. Persistent data
	 *               should be updated using `update()`.
	 * @returns The request with the CMCD request report applied.
	 */
	createRequestReport<R extends HttpRequest<CmcdReporterCustomData<C>> = HttpRequest<C>>(request: R, data?: Partial<Cmcd>): R & CmcdRequestReport<R['customData']> {
		const { customData = {}, headers = {}, ...rest } = request
		const report = {
			...rest,
			headers: {
				...headers,
			},
			customData: {
				...customData,
				cmcd: {},
				// Session provenance rides every returned request, including
				// ones this method does not decorate (request reporting
				// disabled, or a transform cancels below): the request was
				// still issued by this session, and its response still needs
				// attribution. The per-call data is captured on the record
				// here, before any early return, key filter, or transform
				// can lose it, so a late response reports the caller's own
				// request-time inputs.
				[CMCD_REQUEST_PROVENANCE]: this.createRequestProvenance(data, request.url),
			},
		} as R & CmcdRequestReport<R['customData']>

		if (!this.config.enabledKeys?.length || !report.url) {
			return report
		}

		// Request reports are always current-session. The session's sid is
		// stamped over any per-call value here so a transform sees the
		// session identity the report will carry.
		const session = this.ledger.current
		const merged: Cmcd = { ...this.playback.data, ...(session.bg !== undefined && { bg: session.bg }), ...data, sid: session.sid }
		const { transform } = this.config

		// The caller's request is passed, not the internal clone, so a
		// transform cannot alter the outgoing report through it.
		const cmcdData: Cmcd | null = applyReportPolicy(merged, transform, request as CmcdTransformRequest<C>, undefined, false)

		if (cmcdData == null) {
			return report
		}

		let stamps = session.requestTargets.get(CMCD_DEFAULT_REQUEST_TARGET)

		if (!stamps) {
			stamps = { sn: 0, msdSent: false }
			session.requestTargets.set(CMCD_DEFAULT_REQUEST_TARGET, stamps)
		}

		const sendMsd = stampReport(cmcdData, session, stamps, true)

		const url = new URL(report.url)
		const options = createEncodingOptions(CMCD_REQUEST_MODE, this.config, report.url)

		// The player-facing view is detached from the persistent store:
		// prepareCmcdData builds a fresh object but copies values by
		// reference, and players read this object to identify requests, so a
		// shared array would leak mutation into the store. The reporter never
		// reads it back; the response path works from the encoded snapshot on
		// the provenance record.
		const cmcd = report.customData.cmcd = copyReportValues(prepareCmcdData(cmcdData, options))

		const encoded = encodePreparedCmcd(cmcd)

		switch (this.config.transmissionMode) {
			case CMCD_QUERY:
				if (encoded) {
					url.searchParams.set(CMCD_PARAM, encoded)
					report.url = url.toString()
				}
				break

			case CMCD_HEADERS:
				Object.assign(report.headers, toPreparedCmcdHeaders(cmcd, options.customHeaderMap))
				break
		}

		stamps.sn++

		if (sendMsd && cmcd.msd !== undefined) {
			stamps.msdSent = true
		}

		return report
	}

	/**
	 * Processes the event targets. Called by the reporter when an event occurs.
	 *
	 * @param flush - Whether to flush the event targets.
	 */
	private processEventTargets(flush: boolean = false): void {
		let reprocess = false

		// Oldest session first, so an archived session's late reports leave
		// ahead of current traffic.
		this.ledger.forEach((session) => {
			// An archived session receives no further regular events, so its
			// queues could never fill a batch again; its remainders are always
			// drain-eligible, preserving the pre-existing behavior of unsent
			// old-sid events draining after a session change.
			const drain = flush || session !== this.ledger.current

			session.eventTargets.forEach((target, config) => {
				const { queue } = target

				// A disposed target's queue can be non-empty again if a failed
				// batch was re-queued after disposal; it must stay unsent.
				if (target.disposed || !queue.length) {
					return
				}

				if (queue.length < config.batchSize && !drain) {
					return
				}

				const deleteCount = drain ? queue.length : config.batchSize
				const events = queue.splice(0, deleteCount)
				this.sendEventReport(session, config, events).catch(() => {
					// Re-queue events that failed to send. The target belongs
					// to the batch's own session, so a failure after a session
					// change re-queues there, never into the current session.
					target.queue.unshift(...events)
				})

				reprocess ||= queue.length > 0
			})
		})

		if (reprocess) {
			this.processEventTargets()
		}
	}

	/**
	 * Sends an event report. Called by the reporter when a batch is ready to be sent.
	 *
	 * @param config - The target config to send the event report to.
	 * @param data - The encoded report lines to send in the event report.
	 */
	private async sendEventReport(session: CmcdSessionState<C>, config: CmcdEventReportConfigNormalized<C>, data: string[]): Promise<void> {
		const response = await this.requester({
			url: config.url,
			method: 'POST',
			headers: {
				'Content-Type': CMCD_MIME_TYPE,
			},
			body: data.join('\n') + '\n',
		})

		const { status } = response

		if (status === 410) {
			// CTA-5004-B scopes 410 suppression to "the remainder of the
			// current session". The batch's own session is disposed, so a
			// delayed 410 that lands after a session change silences the
			// session that sent it, never the one that replaced it.
			this.disposeEventTarget(session, config)
		} else if (status === 429 || (status > 499 && status < 600)) {
			throw new Error(`Event report failed with status ${status}`)
		}
	}

	/**
	 * Cancels the time-interval timer for an event target config and clears the
	 * stored id. Safe to call when no timer is armed (clearInterval(undefined)
	 * is a no-op).
	 */
	private disarmInterval(config: CmcdEventReportConfigNormalized<C>): void {
		clearInterval(this.intervals.get(config))
		this.intervals.delete(config)
	}

	/**
	 * Silences an event target URL for the remainder of its session: drops the
	 * queues and blocks further enqueues for every config in the session that
	 * reports to the URL, per CTA-5004-B's per-target-URL suppression scope,
	 * and cancels their timers when the session is the live one. Used when the
	 * collector signals the target is gone (HTTP 410). A session started after
	 * the disposal is unaffected, since it gets fresh target state.
	 */
	private disposeEventTarget(session: CmcdSessionState<C>, config: CmcdEventReportConfigNormalized<C>): void {
		session.eventTargets.forEach((target, sibling) => {
			if (sibling.url !== config.url || target.disposed) {
				return
			}

			target.disposed = true
			target.queue.length = 0

			// The timer belongs to the live session only; an archived session's
			// disposal is bookkeeping and must not silence current reporting.
			if (session === this.ledger.current) {
				this.disarmInterval(sibling)
			}
		})
	}
}
