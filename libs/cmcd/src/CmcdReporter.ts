import { SfItem, SfToken } from '@svta/cml-structured-field-values'
import type { HttpRequest, HttpResponse } from '@svta/cml-utils'
import { uuid } from '@svta/cml-utils'
import { CMCD_DEFAULT_TIME_INTERVAL } from './CMCD_DEFAULT_TIME_INTERVAL.ts'
import { CMCD_MIME_TYPE } from './CMCD_MIME_TYPE.ts'
import { CMCD_PARAM } from './CMCD_PARAM.ts'
import { CMCD_REQUEST_PROVENANCE } from './CMCD_REQUEST_PROVENANCE.ts'
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
import type { CmcdReporterCustomData } from './CmcdReporterCustomData.ts'
import type { CmcdRequestProvenance } from './CmcdRequestProvenance.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'
import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import { CMCD_EVENT_MODE, CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdTransformRequest } from './CmcdTransformRequest.ts'
import { CMCD_HEADERS, CMCD_QUERY } from './CmcdTransmissionMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'
import { encodeCmcd } from './encodeCmcd.ts'
import { encodePreparedCmcd } from './encodePreparedCmcd.ts'
import { prepareCmcdData } from './prepareCmcdData.ts'
import { toPreparedCmcdHeaders } from './toPreparedCmcdHeaders.ts'

type CmcdReportConfigNormalized = CmcdReportConfig & {
	version: CmcdVersion;
}

type CmcdEventReportConfigNormalized<C> = CmcdEventReportConfig<C> & CmcdReportConfigNormalized & {
	events: CmcdEventType[];
	interval: number;
	batchSize: number;
}

type CmcdReporterConfigNormalized<C> = CmcdReporterConfig<C> & CmcdReportConfigNormalized & {
	sid: string;
	eventTargets: CmcdEventReportConfigNormalized<C>[];
	sessionRetention: number;
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
 * those, and `SfItem.params` is a flat record. Called where a transform is
 * configured, and on the ended session's store at archival, where it detaches
 * the frozen snapshot from caller-held references.
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

/**
 * Rebuilds one value from a request's stored CMCD data as a detached,
 * encodable value.
 *
 * The stored object may have crossed a boundary that drops prototypes (the
 * documented JSON bridge), leaving `SfItem`-shaped plain objects that the
 * encoder's `instanceof` branches reject. Item-shaped values with params are
 * rebuilt as `SfItem`; param-less ones unwrap to their bare value, which
 * encoding re-wraps per key. A custom-key `SfToken` is indistinguishable from
 * its string after JSON and degrades to one.
 */
function canonicalCmcdValue(value: unknown): unknown {
	if (value === null || typeof value !== 'object') {
		return value
	}

	if (value instanceof SfItem || value instanceof SfToken) {
		return copyItemValue(value)
	}

	if ('value' in value) {
		const { value: inner, params } = value as { value: unknown; params?: unknown; }

		if (params !== null && typeof params === 'object' && Object.keys(params).length) {
			return new SfItem(inner, { ...params })
		}

		return inner
	}

	return value
}

/**
 * Rebuilds a request's stored CMCD data as a fresh, detached, encodable
 * object via {@link canonicalCmcdValue}. Only called in
 * `recordResponseReceived()`, where the stored data may have been serialized
 * and revived by the caller between decoration and response.
 */
function canonicalizeCmcd(data: Cmcd): Cmcd {
	const result: Record<string, unknown> = {}
	const record = data as Record<string, unknown>

	for (const key in record) {
		const value = record[key]
		result[key] = Array.isArray(value) ? value.map(canonicalCmcdValue) : canonicalCmcdValue(value)
	}

	return result as Cmcd
}

function defaultRequester(request: HttpRequest): Promise<{ status: number; }> {
	const { url, ...init } = request
	return fetch(url, init)
}

function createCmcdReporterConfig<C>(config: Partial<CmcdReporterConfig<C>>): CmcdReporterConfigNormalized<C> {
	// Apply top-level config defaults
	const {
		version = CMCD_V2,
		eventTargets = [],
		sid = uuid(),
		transmissionMode = CMCD_QUERY,
		...rest
	} = config

	// Type-checked, never type-coerced: a numeric string or boolean falls
	// back to the default instead of converting, and a Symbol must not
	// throw under Math.floor's ToNumber.
	const retention = config.sessionRetention
	const sessionRetention = typeof retention === 'number' ? Math.floor(retention) : NaN

	return {
		...rest,
		version,
		transmissionMode,
		sid,
		sessionRetention: sessionRetention >= 0 ? sessionRetention : 2,
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
		}, [] as CmcdEventReportConfigNormalized<C>[]),
	}
}

type CmcdTarget = {
	sn: number;
	msdSent: boolean;
}

type CmcdEventTarget = CmcdTarget & {
	/**
	 * Finished, encoded report lines awaiting send. Reports are encoded at
	 * enqueue, so a value that cannot serialize throws inside the recording
	 * call, and a queued line is immune to later mutation of the values it
	 * was built from.
	 */
	queue: string[];
	disposed: boolean;
}

/**
 * The state owned by one session (one `sid`). Everything CTA-5004-B scopes
 * to the session lives here, so a report that belongs to an earlier session
 * (a response completing after a `sid` change, a re-queued batch) is built
 * from and accounted against its own session rather than the current one.
 */
type CmcdSession<C> = {
	sid: string;
	/**
	 * Frozen provenance record minted for this session, carrying the opaque
	 * token. Stamped on decorated requests under
	 * {@link CMCD_REQUEST_PROVENANCE} so a late response resolves this exact
	 * session, independent of wire keys and of `sid` reuse. Only exact
	 * issued tokens attribute; see `resolveSession()`.
	 */
	provenance: CmcdRequestProvenance;
	data: Cmcd;
	msd: number;
	lastEmitted: Partial<Pick<Cmcd, StateField>>;
	eventTargets: Map<CmcdEventReportConfigNormalized<C>, CmcdEventTarget>;
	requestTarget: CmcdTarget;
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

	/**
	 * Retained sessions keyed by provenance token, insertion-ordered oldest
	 * first, the current session last. The ended-session count is capped by
	 * `config.sessionRetention`; a reused `sid` is retained alongside its
	 * namesake, so a `sid` string can match more than one entry.
	 */
	private sessions = new Map<string, CmcdSession<C>>()
	private session: CmcdSession<C>

	/**
	 * Tombstones for evicted sessions' tokens. A token found here was issued
	 * by this reporter but its session is gone, so the response drops instead
	 * of falling back to `sid` lookup, which could relabel a reused `sid`'s
	 * retained namesake. Tokens that were never issued (altered or foreign)
	 * appear in neither `sessions` nor here, and fall back. Grows by one
	 * small string per ended session for the reporter's lifetime.
	 */
	private evictedTokens = new Set<string>()

	/**
	 * Newest retained session per `sid`, so the fallback chain for tokenless
	 * and foreign-token responses resolves in constant time regardless of
	 * the retention size. Maintained on insertion and eviction.
	 */
	private sessionsBySid = new Map<string, CmcdSession<C>>()

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
		this.session = this.createSession(this.config.sid, {
			cid: this.config.cid,
			v: this.config.version,
		})
		this.sessions.set(this.session.provenance.token, this.session)
		this.sessionsBySid.set(this.session.sid, this.session)
		this.requester = requester
	}

	/**
	 * Creates the state for a new session: fresh counters, gates, queues and
	 * dedup baseline for every configured target.
	 */
	private createSession(sid: string, data: Cmcd): CmcdSession<C> {
		const eventTargets = new Map<CmcdEventReportConfigNormalized<C>, CmcdEventTarget>()

		for (const target of this.config.eventTargets) {
			eventTargets.set(target, {
				sn: 0,
				msdSent: false,
				queue: [],
				disposed: false,
			})
		}

		return {
			sid,
			// Frozen because it is handed out on every decorated request; the
			// token string, not the record's identity, is what classifies.
			provenance: Object.freeze({ token: uuid() }),
			data,
			msd: NaN,
			lastEmitted: {},
			eventTargets,
			requestTarget: {
				sn: 0,
				msdSent: false,
			},
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
		const session = this.session

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
			const session = this.session
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
	 * to change them. A per-call value on {@link CmcdReporter.recordEvent} or
	 * {@link CmcdReporter.createRequestReport} has no effect; on
	 * {@link CmcdReporter.recordResponseReceived} a per-call `sid` selects the
	 * retained session the response belongs to, but never relabels a report.
	 * `msd` must be a finite number of milliseconds between `0` and
	 * `999_999_999_999_999` (the RFC 8941 integer maximum); it is rounded to
	 * the nearest integer, and invalid values are ignored.
	 *
	 * @param data - The data to update.
	 */
	update(data: Partial<Cmcd>): void {
		if (data.sid && data.sid !== this.session.sid) {
			this.startSession(data.sid)
		}

		const session = this.session
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
		session.data = { ...session.data, ...data, sid: undefined, msd: undefined }

		// Auto-trigger state-change events for any tracked field whose value
		// differs from the last wire-emitted value. Comparing against lastEmitted
		// (not the pre-merge value) ensures correctness after a session change,
		// and unifies the comparison basis with recordEvent's internal dedup.
		for (const entry of STATE_FIELDS) {
			if (entry.field in data && !entry.equal(session.data[entry.field], session.lastEmitted[entry.field])) {
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
	 * have. Sessions are keyed by provenance token, so a reused `sid` is a
	 * new session retained alongside its namesake: a `sid` change is a new
	 * session per CTA-5004-B, never a resumption.
	 */
	private startSession(sid: string): void {
		this.session.data = copyReportValues({ ...this.session.data })
		this.session = this.createSession(sid, { ...this.session.data })
		this.sessions.set(this.session.provenance.token, this.session)
		this.sessionsBySid.set(sid, this.session)

		// Drain ended sessions before eviction can destroy their queues: a
		// partial batch the ended session could never fill again leaves now.
		this.processEventTargets()

		// An evicted session's unsent queues die with it, and its token
		// leaves a tombstone so its stale responses drop instead of falling
		// back. The current session was inserted last, so oldest-first
		// eviction never reaches it, and `Infinity` retention never evicts.
		for (const [token, session] of this.sessions) {
			if (this.sessions.size <= this.config.sessionRetention + 1) {
				break
			}

			this.sessions.delete(token)
			this.evictedTokens.add(token)

			// The sid index points at the newest holder of the name; an
			// older evicted namesake must not clear it.
			if (this.sessionsBySid.get(session.sid) === session) {
				this.sessionsBySid.delete(session.sid)
			}
		}

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
		this.emitEvent(this.session, type, data)
	}

	/**
	 * Records an event across every configured target of a session, applying
	 * state-change dedup once before per-target fan-out.
	 *
	 * @param session - The session the event belongs to. Everything the event
	 *                  touches (data store, dedup baseline, counters, queues)
	 *                  is that session's; only `recordResponseReceived()` ever
	 *                  passes an archived one.
	 * @param type - The type of event to record.
	 * @param data - Additional data to record with the event.
	 * @param request - The media request that triggered the event, when
	 *                  one exists. Only `recordResponseReceived()`
	 *                  populates this; it is threaded through to each
	 *                  target's `transform`.
	 */
	private emitEvent(session: CmcdSession<C>, type: CmcdEventType, data: Partial<Cmcd>, request?: HttpRequest): void {
		const entry = STATE_FIELDS_BY_EVENT.get(type)
		if (entry) {
			const field = entry.field
			const incoming = data[field]

			if (incoming !== undefined) {
				Object.assign(session.data, { [field]: incoming })
			}

			const current = session.data[field]

			// Never emit a state-change event with a missing required field — per
			// CTA-5004-B these events must carry their dedup field. Catches both
			// "no value ever set" and "previous value was cleared to undefined".
			if (current === undefined) {
				return
			}

			if (entry.equal(current, session.lastEmitted[field])) {
				return
			}

			Object.assign(session.lastEmitted, { [field]: entry.snapshot(current) })
		}

		// A throwing transform must not abort the fan-out. The dedup baseline
		// above is already committed and is never rolled back, so aborting here
		// would strand the transition: targets after the throwing one would
		// never receive it, and the caller's retry would be deduped away.
		let failure: { error: unknown; } | undefined

		session.eventTargets.forEach((target, config) => {
			try {
				this.recordTargetEvent(session, target, config, type, data, request)
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
	private recordTargetEvent(session: CmcdSession<C>, target: CmcdEventTarget, config: CmcdEventReportConfigNormalized<C>, type: CmcdEventType, data: Partial<Cmcd> = {}, request?: HttpRequest): void {
		if (target.disposed || !config.events.includes(type)) {
			return
		}

		// The session's sid is stamped over any per-call value here so a
		// transform sees the session identity the report will carry.
		const item: Cmcd = {
			...session.data,
			...data,
			sid: session.sid,
			e: type,
			ts: data.ts ?? Date.now(),
		}

		const { transform } = config

		if (!transform) {
			this.queueTargetEvent(session, target, config, item, type)
			return
		}

		// The spread above is shallow, so nested values are still shared with
		// the persistent store and with sibling targets' inputs; a transform
		// gets its own detached copy so in-place mutation reaches neither.
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
	private queueTargetEvent(session: CmcdSession<C>, target: CmcdEventTarget, config: CmcdEventReportConfigNormalized<C>, report: Cmcd, type: CmcdEventType): void {
		report.e = type
		report.sn = target.sn++
		report.sid = session.sid

		// msd may only ride a report through the once-per-target gate, and only
		// when the target's key filter will retain it (msd is never force-added
		// at encode time): consuming the gate for a report that filters msd out
		// would silently drop it for the session. A value smuggled in via
		// per-call data or a transform is stripped, so the gate stays the
		// single source of once-per-session semantics.
		if (!isNaN(session.msd) && !target.msdSent && config.enabledKeys?.includes('msd')) {
			report.msd = session.msd
			target.msdSent = true
		}
		else {
			delete report.msd
		}

		target.queue.push(encodeCmcd(report, createEncodingOptions(CMCD_EVENT_MODE, config)))
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
	 * A reporter given a concrete `C` requires the request to satisfy it, so a
	 * request the configured transforms could not read is rejected here rather
	 * than reaching them; see {@link CmcdReporterCustomData}.
	 *
	 * The event is attributed to the session that issued the request: the
	 * provenance record that {@link CmcdReporter.createRequestReport} stored
	 * on the request's `customData` (under {@link CMCD_REQUEST_PROVENANCE})
	 * selects the session by its `token`. A request carrying no provenance,
	 * or a value written by another reporter instance, falls back to the
	 * `sid` stored in the request's CMCD data, then to a per-call
	 * `data.sid`, then to the current session. A response that completes after a `sid` change
	 * reports under its own retained session, with that session's data
	 * snapshot and sequence numbers (see
	 * `CmcdReporterConfig.sessionRetention`). When the attributed session is
	 * no longer retained, the event is dropped rather than relabeled with
	 * the current `sid`.
	 *
	 * @typeParam RD - The `customData` this request carries. Defaults to the
	 *                reporter's own `C`.
	 *
	 * @param response - The HTTP response received.
	 * @param data - Additional CMCD data to include with the event.
	 *               Values provided here override any auto-derived values.
	 *               `data.sid` is an attribution key, not report data.
	 */
	recordResponseReceived<RD extends CmcdReporterCustomData<C> = C>(response: HttpResponse<HttpRequest<RD & { cmcd?: Cmcd; [CMCD_REQUEST_PROVENANCE]?: CmcdRequestProvenance }>>, data: Partial<Cmcd> = {}): void {
		const { request } = response

		const url = data.url ?? request?.url

		if (!url) {
			return
		}

		// The stored request data is canonicalized, not trusted: the caller
		// may have serialized and revived the request (the documented JSON
		// bridge), leaving prototype-less values the encoder rejects, and a
		// live object may still share values the caller can mutate.
		const cmcd = canonicalizeCmcd(request.customData?.cmcd ?? {})
		const session = this.resolveSession(request.customData?.[CMCD_REQUEST_PROVENANCE], cmcd.sid || data.sid)

		// A key that names no retained session (evicted, or never owned by
		// this reporter) cannot be attributed, and emitting the event under
		// the current sid would relabel another session's response.
		if (!session) {
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

		this.emitEvent(session, CMCD_EVENT_RESPONSE_RECEIVED, { ...cmcd, ...derived, ...data }, request)
	}

	/**
	 * Resolves the session a response belongs to. Reporter-written provenance
	 * is authoritative and classified by the exact issued token inside the
	 * record: a retained token attributes, an evicted token's tombstone drops
	 * the response (falling through to `sid` lookup would relabel a reused
	 * `sid`'s retained namesake), and a value this reporter never issued —
	 * foreign, altered, or not shaped like a provenance record — falls back
	 * to the `sid` chain, where the newest retained session wins a reused
	 * name, then to the current session when no key exists at all. The token
	 * is read structurally, so a JSON-revived copy of an issued record
	 * attributes exactly.
	 */
	private resolveSession(provenance: unknown, sid: string | undefined): CmcdSession<C> | undefined {
		if (provenance !== null && typeof provenance === 'object') {
			const { token } = provenance as { token?: unknown; }

			if (typeof token === 'string') {
				const session = this.sessions.get(token)

				if (session) {
					return session
				}

				if (this.evictedTokens.has(token)) {
					return undefined
				}
			}
		}

		if (!sid) {
			return this.session
		}

		return this.sessionsBySid.get(sid)
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
				// attribution.
				[CMCD_REQUEST_PROVENANCE]: this.session.provenance,
			},
		} as R & CmcdRequestReport<R['customData']>

		if (!this.config.enabledKeys?.length || !report.url) {
			return report
		}

		// Request reports are always current-session. The session's sid is
		// stamped over any per-call value here so a transform sees the
		// session identity the report will carry.
		const session = this.session
		const merged: Cmcd = { ...session.data, ...data, sid: session.sid }
		const { transform } = this.config
		let cmcdData: Cmcd | null = merged

		if (transform) {
			// The spread above is shallow, so nested values are still shared
			// with the persistent store.
			copyReportValues(merged)

			// The caller's request is passed, not the internal clone, so a
			// transform cannot alter the outgoing report through it.
			cmcdData = transform(merged, request as CmcdTransformRequest<C>)

			// A cancelled report consumes neither a sequence number nor msd.
			if (cmcdData == null) {
				return report
			}
		}

		// Reporter-owned fields are stamped after the transform runs.
		cmcdData.sn = session.requestTarget.sn++
		cmcdData.sid = session.sid

		// msd may only ride a report through the once-per-session gate; a value
		// smuggled in via per-call data or the transform is stripped, so the
		// gate stays the single source of once-per-session semantics. The gate
		// is consumed after preparation, and only if the key filter retained
		// msd, so a filtered-out msd is not silently dropped for the session.
		const sendMsd = !isNaN(session.msd) && !session.requestTarget.msdSent

		if (sendMsd) {
			cmcdData.msd = session.msd
		}
		else {
			delete cmcdData.msd
		}

		const url = new URL(report.url)
		const options = createEncodingOptions(CMCD_REQUEST_MODE, this.config, report.url)

		// The stored snapshot is detached from the caller and the persistent
		// store: prepareCmcdData builds a fresh object but copies values by
		// reference, and a late response merges this snapshot into its
		// report, where a shared array would leak post-decoration mutation.
		const cmcd = report.customData.cmcd = copyReportValues(prepareCmcdData(cmcdData, options))

		if (sendMsd && cmcd.msd !== undefined) {
			session.requestTarget.msdSent = true
		}

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

		// Oldest session first, so an archived session's late reports leave
		// ahead of current traffic.
		this.sessions.forEach((session) => {
			// An archived session receives no further regular events, so its
			// queues could never fill a batch again; its remainders are always
			// drain-eligible, preserving the pre-existing behavior of unsent
			// old-sid events draining after a session change.
			const drain = flush || session !== this.session

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
	private async sendEventReport(session: CmcdSession<C>, config: CmcdEventReportConfigNormalized<C>, data: string[]): Promise<void> {
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
	private disposeEventTarget(session: CmcdSession<C>, config: CmcdEventReportConfigNormalized<C>): void {
		session.eventTargets.forEach((target, sibling) => {
			if (sibling.url !== config.url || target.disposed) {
				return
			}

			target.disposed = true
			target.queue.length = 0

			// The timer belongs to the live session only; an archived session's
			// disposal is bookkeeping and must not silence current reporting.
			if (session === this.session) {
				this.disarmInterval(sibling)
			}
		})
	}
}
