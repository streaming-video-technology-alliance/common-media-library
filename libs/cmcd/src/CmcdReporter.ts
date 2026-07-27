import type { HttpRequest, HttpResponse } from '@svta/cml-utils'
import { uuid } from '@svta/cml-utils'
import { CMCD_DEFAULT_TIME_INTERVAL } from './CMCD_DEFAULT_TIME_INTERVAL.ts'
import { CMCD_MIME_TYPE } from './CMCD_MIME_TYPE.ts'
import { CMCD_PARAM } from './CMCD_PARAM.ts'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdEventReportConfig } from './CmcdEventReportConfig.ts'
import { CMCD_EVENT_CUSTOM_EVENT, CMCD_EVENT_ERROR, CMCD_EVENT_RESPONSE_RECEIVED, CMCD_EVENT_TIME_INTERVAL, CmcdEventType } from './CmcdEventType.ts'
import { CMCD_STATE_EVENT_FIELDS } from './CMCD_STATE_EVENT_FIELDS.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdObjectTypeList } from './CmcdObjectTypeList.ts'
import type { CmcdReportConfig } from './CmcdReportConfig.ts'
import type { CmcdReporterConfig } from './CmcdReporterConfig.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'
import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import { CMCD_EVENT_MODE, CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import { CMCD_HEADERS, CMCD_QUERY } from './CmcdTransmissionMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'
import { encodeCmcd } from './encodeCmcd.ts'
import { encodePreparedCmcd } from './encodePreparedCmcd.ts'
import { prepareCmcdData } from './prepareCmcdData.ts'
import { toPreparedCmcdHeaders } from './toPreparedCmcdHeaders.ts'

type CmcdReportConfigNormalized = CmcdReportConfig & {
	version: CmcdVersion;
}

type CmcdEventReportConfigNormalized = CmcdEventReportConfig & CmcdReportConfigNormalized & {
	events: CmcdEventType[];
	interval: number;
	batchSize: number;
}

type CmcdReporterConfigNormalized = CmcdReporterConfig & CmcdReportConfigNormalized & {
	sid: string;
	eventTargets: CmcdEventReportConfigNormalized[];
}

function createEncodingOptions(reportingMode: CmcdReportingMode, config: CmcdReportConfig & Pick<CmcdRequestReportConfig, 'customHeaderMap'>, baseUrl?: string): CmcdEncodeOptions {
	const enabledKeySet = new Set(config.enabledKeys ?? [])

	return {
		version: config.version || CMCD_V2,
		reportingMode,
		filter: (key: CmcdKey) => enabledKeySet.has(key),
		baseUrl,
		customHeaderMap: config.customHeaderMap,
	}
}

/**
 * Tracked state field for dedup + auto-trigger.
 */
type StateField = 'sta' | 'pr' | 'cid' | 'bg' | 'br'

/**
 * One row in the STATE_FIELDS dispatch table.
 *
 * `snapshot` captures the value stored in `lastEmitted` for dedup
 * comparisons. Reference types must clone so the baseline doesn't
 * share a reference with the caller's input, which would let in-place
 * mutation silently poison the dedup state.
 */
type StateFieldEntry = {
	field: StateField
	event: CmcdEventType
	equal: (a: unknown, b: unknown) => boolean
	snapshot: (v: unknown) => unknown
}

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
		const bk = bp && Object.keys(bp)[0]
		if (ak !== bk) return false
		if (ak !== undefined && bk !== undefined && ap && bp && ap[ak as keyof typeof ap] !== bp[bk as keyof typeof bp]) return false
	}

	return true
}

const equal = Object.is
const identity = <T>(v: T): T => v

/**
 * Maps each tracked state field to its event type and equality function.
 * Order matters: `update()` fires events in this order for multi-field updates.
 */
const STATE_FIELDS: readonly StateFieldEntry[] = /* @__PURE__ */ Array.from(
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

const STATE_FIELDS_BY_EVENT: ReadonlyMap<CmcdEventType, StateFieldEntry> = /* @__PURE__ */ new Map(
	/* @__PURE__ */ STATE_FIELDS.map(e => [e.event, e]),
)

/**
 * Maps each event type to the key CTA-5004-B requires beyond `e` and `ts`.
 * Built from the state-change table plus the three event types whose
 * required key rides the caller's per-event data.
 */
const CMCD_REQUIRED_EVENT_KEYS: ReadonlyMap<CmcdEventType, CmcdKey> = /* @__PURE__ */ new Map([
	.../* @__PURE__ */ CMCD_STATE_EVENT_FIELDS,
	[CMCD_EVENT_CUSTOM_EVENT, 'cen'] as const,
	[CMCD_EVENT_ERROR, 'ec'] as const,
	[CMCD_EVENT_RESPONSE_RECEIVED, 'url'] as const,
])

/**
 * Whether a required key's value will survive report preparation.
 *
 * This is `isValid` minus its `false` exclusion, plus an empty-array check.
 * `false` must count as usable because `bg: false` is a legitimate value on a
 * backgrounded-mode event, which the encoder emits as `?0`; treating it as
 * unusable would let restoration silently revert a transform that cleared it.
 * Empty strings, empty lists and non-finite numbers are dropped downstream, so
 * a transform substituting one leaves the report short a required key.
 */
function isUsableRequiredValue(value: unknown): boolean {
	if (value == null || value === '') {
		return false
	}

	if (typeof value === 'number') {
		return Number.isFinite(value)
	}

	return !Array.isArray(value) || value.length > 0
}

/**
 * Copies an `SfItem`-shaped value and its `params` record.
 *
 * The prototype is preserved because `prepareCmcdData`, the formatter map,
 * validation, and the structured-field encoder all branch on
 * `instanceof SfItem`. A plain spread (and `structuredClone`) would return a
 * prototype-less object and silently change what goes on the wire.
 */
function copyItemValue(value: unknown): unknown {
	if (value === null || typeof value !== 'object') {
		return value
	}

	const copy = Object.assign(Object.create(Object.getPrototypeOf(value)), value) as { params?: unknown; }

	if (copy.params !== null && typeof copy.params === 'object') {
		copy.params = { ...copy.params }
	}

	return copy
}

/**
 * Copies the nested values of a report in place so a transform cannot mutate
 * the reporter's persistent data, or another target's report for the same
 * event, by mutating an array or an `SfItem` it was handed.
 *
 * Complete for the CMCD value space rather than best-effort: `CmcdValue` and
 * `CmcdCustomValue` admit only primitives, `SfItem<primitive>`, and arrays of
 * those, and `SfItem.params` is a flat record. Only called where a transform
 * is configured.
 */
function copyReportValues(data: Cmcd): Cmcd {
	const record = data as Record<string, unknown>

	for (const key in record) {
		const value = record[key]

		if (Array.isArray(value)) {
			const copy = new Array(value.length)

			for (let i = 0; i < value.length; i++) {
				copy[i] = copyItemValue(value[i])
			}

			record[key] = copy
		}
		else if (value !== null && typeof value === 'object') {
			record[key] = copyItemValue(value)
		}
	}

	return data
}

function defaultRequester(request: HttpRequest): Promise<{ status: number; }> {
	const { url, ...init } = request
	return fetch(url, init)
}

function createCmcdReporterConfig(config: Partial<CmcdReporterConfig>): CmcdReporterConfigNormalized {
	// Apply top-level config defaults
	const {
		version = CMCD_V2,
		eventTargets = [],
		sid = uuid(),
		transmissionMode = CMCD_QUERY,
		...rest
	} = config

	return {
		...rest,
		version,
		transmissionMode,
		sid,
		// Apply target config defaults
		eventTargets: eventTargets.reduce((acc, target) => {
			if (target?.url && target.events?.length) {
				acc.push({
					version: target.version || CMCD_V2,
					enabledKeys: target.enabledKeys?.slice() || [],
					url: target.url,
					events: target.events.slice(),
					interval: target.interval ?? CMCD_DEFAULT_TIME_INTERVAL,
					batchSize: target.batchSize || 1,
					transform: target.transform,
				})
			}
			return acc
		}, [] as CmcdEventReportConfigNormalized[]),
	}
}

type CmcdTarget = {
	sn: number;
	msdSent: boolean;
}

type CmcdEventTarget = CmcdTarget & {
	intervalId: ReturnType<typeof setInterval> | undefined;
	queue: Cmcd[];
}

/**
 * The CMCD reporter.
 *
 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#reporting-modes-when-we-send-data | CTA-5004-B Reporting Modes}
 *
 * @public
 */
export class CmcdReporter {
	private timeOrigin = performance.timeOrigin || performance.timing?.fetchStart || Date.now() - performance.now()
	private data: Cmcd = {}
	private config: CmcdReporterConfigNormalized
	private msd: number = NaN
	private eventTargets = new Map<CmcdEventReportConfigNormalized, CmcdEventTarget>()
	private lastEmitted: Partial<Pick<Cmcd, StateField>> = {}
	private requestTarget: CmcdTarget = {
		sn: 0,
		msdSent: false,
	}

	private requester: (request: HttpRequest) => Promise<{ status: number; }>

	/**
	 * Creates a new CMCD reporter.
	 *
	 * @param config - The configuration for the CMCD reporter.
	 * @param requester - The function to use to send the request.
	 *                    The default is a simple wrapper around the
	 *                    native `fetch` API.
	 */
	constructor(config: Partial<CmcdReporterConfig>, requester: (request: HttpRequest) => Promise<{ status: number; }> = defaultRequester) {
		this.config = createCmcdReporterConfig(config)
		this.data = {
			cid: this.config.cid,
			sid: this.config.sid,
			v: this.config.version,
		}
		this.requester = requester

		for (const target of this.config.eventTargets) {
			this.eventTargets.set(target, {
				intervalId: undefined,
				sn: 0,
				msdSent: false,
				queue: [],
			})
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
		// The initial time-interval event is fired synchronously per target, so a
		// throwing transform must not abort the loop: later targets would never
		// have their intervals armed and would report nothing for the session,
		// and a retried start() would fail on the same target again. Same
		// continue-then-rethrow contract as `emitEvent()`.
		let failure: { error: unknown; } | undefined

		this.eventTargets.forEach((target, config) => {
			// Disarm any existing timer so repeated start() calls do not leak intervals.
			this.disarmInterval(target)

			// If the interval is 0 or the TIME_INTERVAL event is not enabled, do not start the interval.
			if (config.interval === 0 || !config.events.includes(CMCD_EVENT_TIME_INTERVAL)) {
				return
			}

			const timeIntervalEvent = () => {
				this.recordTargetEvent(target, config, CMCD_EVENT_TIME_INTERVAL)
				this.processEventTargets()
			}

			// Armed before the initial event so a throwing transform leaves the
			// timer in the same state a successful start() would, rather than
			// silently disabling the target.
			target.intervalId = setInterval(timeIntervalEvent, config.interval * 1000)

			try {
				timeIntervalEvent()
			}
			catch (error) {
				failure ??= { error }
			}
		})

		if (failure) {
			throw failure.error
		}
	}

	/**
	 * Stops the CMCD reporter. Called by the player when the reporter is disabled.
	 *
	 * @param flush - Whether to flush the event targets.
	 */
	stop(flush: boolean = false): void {
		if (flush) {
			this.flush()
		}

		this.eventTargets.forEach((target) => {
			this.disarmInterval(target)
		})
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
	 * @param data - The data to update.
	 */
	update(data: Partial<Cmcd>): void {
		if (data.sid && data.sid !== this.data.sid) {
			this.resetSession()
		}

		if (data.msd && !isNaN(data.msd)) {
			this.msd = data.msd
		}

		// msd is tracked separately via this.msd and sent once per target,
		// so it is stripped from the persistent data store after each update.
		this.data = { ...this.data, ...data, msd: undefined }

		// Auto-trigger state-change events for any tracked field whose value
		// differs from the last wire-emitted value. Comparing against lastEmitted
		// (not the pre-merge value) ensures correctness after a session reset,
		// and unifies the comparison basis with recordEvent's internal dedup.
		for (const entry of STATE_FIELDS) {
			if (entry.field in data && !entry.equal(this.data[entry.field], this.lastEmitted[entry.field])) {
				this.recordEvent(entry.event)
			}
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
	 *               into the reporter's data store.
	 */
	recordEvent(type: CmcdEventType, data: Partial<Cmcd> = {}): void {
		this.emitEvent(type, data)
	}

	/**
	 * Records an event across every configured target, applying
	 * state-change dedup once before per-target fan-out.
	 *
	 * @param type - The type of event to record.
	 * @param data - Additional data to record with the event.
	 * @param request - The media request that triggered the event, when
	 *                  one exists. Only `recordResponseReceived()`
	 *                  populates this; it is threaded through to each
	 *                  target's `transform`.
	 */
	private emitEvent(type: CmcdEventType, data: Partial<Cmcd>, request?: HttpRequest): void {
		const entry = STATE_FIELDS_BY_EVENT.get(type)
		if (entry) {
			const field = entry.field
			const incoming = data[field]

			if (incoming !== undefined) {
				Object.assign(this.data, { [field]: incoming })
			}

			const current = this.data[field]

			// Never emit a state-change event with a missing required field — per
			// CTA-5004-B these events must carry their dedup field. Catches both
			// "no value ever set" and "previous value was cleared to undefined".
			if (current === undefined) {
				return
			}

			if (entry.equal(current, this.lastEmitted[field])) {
				return
			}

			Object.assign(this.lastEmitted, { [field]: entry.snapshot(current) })
		}

		// A throwing transform must not abort the fan-out. The dedup baseline
		// above is already committed and is never rolled back, so aborting here
		// would strand the transition: targets after the throwing one would
		// never receive it, and the caller's retry would be deduped away.
		let failure: { error: unknown; } | undefined

		this.eventTargets.forEach((target, config) => {
			try {
				this.recordTargetEvent(target, config, type, data, request)
			}
			catch (error) {
				failure ??= { error }
			}
		})

		this.processEventTargets()

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
	private recordTargetEvent(target: CmcdEventTarget, config: CmcdEventReportConfigNormalized, type: CmcdEventType, data: Partial<Cmcd> = {}, request?: HttpRequest): void {
		if (!config.events.includes(type)) {
			return
		}

		// Each target gets its own copy, so a transform that mutates in
		// place affects neither sibling targets nor the persistent data.
		const item: Cmcd = {
			...this.data,
			...data,
			e: type,
			ts: data.ts ?? Date.now(),
		}

		const { transform } = config

		if (!transform) {
			this.queueTargetEvent(target, item, type)
			return
		}

		// The spread above is shallow, so nested values are still shared with
		// the persistent store and with the other targets' copies.
		copyReportValues(item)

		// Captured so a transform cannot strip a key the event requires.
		// `CmcdKey` spans custom keys too, so index through a record view.
		const requiredKey = CMCD_REQUIRED_EVENT_KEYS.get(type)
		const requiredValue = requiredKey ? (item as Record<string, unknown>)[requiredKey] : undefined
		const ts = item.ts

		const report = transform(item, request)

		// A cancelled report consumes neither a sequence number nor msd.
		if (report == null) {
			return
		}

		// Restore, never fabricate: a required key that was already absent (or
		// already unusable) before the transform ran was a caller bug, not a
		// transform bug. Removal and substitution are both covered, because a
		// value the encoder drops leaves the report just as invalid as a missing
		// one.
		if (!isUsableRequiredValue(report.ts)) {
			report.ts = ts
		}

		if (requiredKey && isUsableRequiredValue(requiredValue) && !isUsableRequiredValue((report as Record<string, unknown>)[requiredKey])) {
			Object.assign(report, { [requiredKey]: requiredValue })
		}

		this.queueTargetEvent(target, report, type)
	}

	/**
	 * Stamps the reporter-owned fields on a finished event report and pushes it
	 * to the target's queue.
	 *
	 * Called after any transform has run, so a transform cannot bypass the
	 * target's `events` filter via `e` or break `sn` continuity.
	 *
	 * @param target - The target to queue the report for.
	 * @param report - The finished report data.
	 * @param type - The type of event being reported.
	 */
	private queueTargetEvent(target: CmcdEventTarget, report: Cmcd, type: CmcdEventType): void {
		report.e = type
		report.sn = target.sn++

		if (!isNaN(this.msd) && !target.msdSent) {
			report.msd = this.msd
			target.msdSent = true
		}

		target.queue.push(report)
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
	 * cast. The reporter only reads the optional `cmcd` key that
	 * {@link CmcdReporter.createRequestReport} writes there; every other key is
	 * left untouched and stays visible to an event target's `transform` via
	 * its `request` argument.
	 *
	 * @param response - The HTTP response received.
	 * @param data - Additional CMCD data to include with the event.
	 *               Values provided here override any auto-derived values.
	 */
	recordResponseReceived<C>(response: HttpResponse<HttpRequest<C & { cmcd?: Cmcd }>>, data: Partial<Cmcd> = {}): void {
		const { request } = response

		const url = data.url ?? request?.url

		if (!url) {
			return
		}

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

		const cmcd = request.customData?.cmcd ?? {}

		this.emitEvent(CMCD_EVENT_RESPONSE_RECEIVED, { ...cmcd, ...derived, ...data }, request)
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
	 * Creates a new request with the CMCD request report data applied. Called by the player
	 * before sending the request.
	 *
	 * @param request - The request to apply the CMCD request report to.
	 * @param data - The data to apply to the request. This data only
	 *               applies to this request report. Persistent data
	 *               should be updated using `update()`.
	 * @returns The request with the CMCD request report applied.
	 */
	createRequestReport<R extends HttpRequest = HttpRequest>(request: R, data?: Partial<Cmcd>): R & CmcdRequestReport<R['customData']> {
		const { customData = {}, headers = {}, ...rest } = request
		const report = {
			...rest,
			headers: {
				...headers,
			},
			customData: {
				...customData,
				cmcd: {},
			},
		} as R & CmcdRequestReport<R['customData']>

		if (!this.config.enabledKeys?.length || !report.url) {
			return report
		}

		const merged: Cmcd = { ...this.data, ...data }
		const { transform } = this.config
		let cmcdData: Cmcd | null = merged

		if (transform) {
			// The spread above is shallow, so nested values are still shared
			// with the persistent store.
			copyReportValues(merged)

			// The caller's request is passed, not the internal clone, so a
			// transform cannot alter the outgoing report through it.
			cmcdData = transform(merged, request)

			// A cancelled report consumes neither a sequence number nor msd.
			if (cmcdData == null) {
				return report
			}
		}

		// Reporter-owned fields are stamped after the transform runs.
		cmcdData.sn = this.requestTarget.sn++

		if (!isNaN(this.msd) && !this.requestTarget.msdSent) {
			cmcdData.msd = this.msd
			this.requestTarget.msdSent = true
		}

		const url = new URL(report.url)
		const options = createEncodingOptions(CMCD_REQUEST_MODE, this.config, report.url)

		const cmcd = report.customData.cmcd = prepareCmcdData(cmcdData, options)

		switch (this.config.transmissionMode) {
			case CMCD_QUERY:
				const param = encodePreparedCmcd(cmcd)
				if (param) {
					url.searchParams.set(CMCD_PARAM, param)
					report.url = url.toString()
				}
				break

			case CMCD_HEADERS:
				Object.assign(report.headers, toPreparedCmcdHeaders(cmcd, options.customHeaderMap))
				break
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

		this.eventTargets.forEach((target, config) => {
			const { queue } = target

			if (!queue.length) {
				return
			}

			if (queue.length < config.batchSize && !flush) {
				return
			}

			const deleteCount = flush ? queue.length : config.batchSize
			const events = queue.splice(0, deleteCount)
			this.sendEventReport(config, events).catch(() => {
				// Re-queue events that failed to send
				target.queue.unshift(...events)
			})

			reprocess ||= queue.length > 0
		})

		if (reprocess) {
			this.processEventTargets()
		}
	}

	/**
	 * Sends an event report. Called by the reporter when a batch is ready to be sent.
	 *
	 * @param config - The target config to send the event report to.
	 * @param data - The data to send in the event report.
	 */
	private async sendEventReport(config: CmcdEventReportConfigNormalized, data: Cmcd[]): Promise<void> {
		const options = createEncodingOptions(CMCD_EVENT_MODE, config)
		const response = await this.requester({
			url: config.url,
			method: 'POST',
			headers: {
				'Content-Type': CMCD_MIME_TYPE,
			},
			body: data.map(item => encodeCmcd(item, options)).join('\n') + '\n',
		})

		const { status } = response

		if (status === 410) {
			this.disposeEventTarget(config)
		} else if (status === 429 || (status > 499 && status < 600)) {
			throw new Error(`Event report failed with status ${status}`)
		}
	}

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

	/**
	 * Resets the session related data. Called when the session ID changes.
	 */
	private resetSession(): void {
		this.eventTargets.forEach(target => target.sn = 0)
		this.requestTarget.sn = 0
		this.lastEmitted = {}
	}
}
