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
import { decodeCmcd } from './decodeCmcd.ts'
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
 * Tracked state field for deduplication and auto-fired events.
 */
type StateField = 'sta' | 'pr' | 'cid' | 'bg' | 'br'

/**
 * One row in the STATE_FIELDS dispatch table.
 *
 * `snapshot` returns the value stored in `lastEmitted` for deduplication
 * comparisons. Reference types must clone. Otherwise the baseline would
 * share a reference with the caller's input, and in-place mutation would
 * silently corrupt the baseline.
 */
type StateFieldEntry = {
	field: StateField
	event: CmcdEventType
	equal: (a: unknown, b: unknown) => boolean
	snapshot: (v: unknown) => unknown
}

/**
 * Deep equality for CmcdObjectTypeList (used for `br` deduplication).
 *
 * Arrays with the same elements in different positions count as different.
 * Players that construct `br` consistently get correct deduplication.
 * Reordered arrays produce extra events, which is the safer failure.
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

function buildRequiredEventKeys(): ReadonlyMap<CmcdEventType, CmcdKey> {
	return new Map([
		...CMCD_STATE_EVENT_FIELDS,
		[CMCD_EVENT_CUSTOM_EVENT, 'cen'] as const,
		[CMCD_EVENT_ERROR, 'ec'] as const,
		[CMCD_EVENT_RESPONSE_RECEIVED, 'url'] as const,
	])
}

/**
 * Maps each event type to the key CTA-5004-B requires beyond `e` and `ts`.
 * Built from the state-change table plus the three event types whose
 * required key is event data, not player state.
 */
const CMCD_REQUIRED_EVENT_KEYS: ReadonlyMap<CmcdEventType, CmcdKey> = /* @__PURE__ */ buildRequiredEventKeys()

/**
 * Whether a required key's value will survive report preparation.
 *
 * This is `isValid` without its `false` exclusion. `false` must count as
 * usable because `bg: false` is a valid value on a backgrounded-mode event,
 * which the encoder writes as `?0`. If `false` counted as unusable,
 * restoration would silently revert a transform that cleared the key.
 * Later processing drops empty strings, empty lists, and non-finite numbers.
 * A transform that substitutes one of them leaves the report without a
 * required key.
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
 * Copies a value with the `SfItem` structure, including its `params` record.
 *
 * The copy keeps the prototype because `prepareCmcdData`, the formatter map,
 * validation, and the structured-field encoder all branch on
 * `instanceof SfItem`. A plain spread (and `structuredClone`) would return a
 * prototype-less object and silently change the encoded output.
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
 * Copies the nested values of a report in place. A transform cannot mutate
 * the reporter's data store, or another target's report for the same event,
 * through an array or an `SfItem` it received.
 *
 * The copy is complete for the CMCD value space. `CmcdValue` and
 * `CmcdCustomValue` admit only primitives, `SfItem<primitive>`, and arrays of
 * those. `SfItem.params` is a flat record. The reporter calls this function
 * where a transform is configured, at session end on the ended session's
 * store, and on the request's stored player-facing view. The session-end
 * copy detaches the frozen snapshot from caller-held references.
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
 * Decodes the per-call data snapshot of a provenance record into new,
 * encodable report data. Tokens decode as `SfToken` and items with params
 * as `SfItem` (`useSymbol: false`), so every value re-encodes with its
 * original type. Only `recordResponseReceived()` calls this function.
 * Returns an empty object when the record is absent, has no snapshot, or
 * the snapshot does not parse (a value this reporter did not write). The
 * response then reports its derived keys over the session's data alone.
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

/**
 * Creates a session's frozen base provenance record: the issuing `sid`, and
 * the `cid` that is current at creation time. `update()` creates a new record
 * on every `cid` change. Requests issued before a mid-session content change
 * keep their original `cid`, while later requests get the new one.
 */
function mintProvenance(sid: string, cid: string | undefined): CmcdRequestProvenance {
	return Object.freeze(typeof cid === 'string' && cid ? { sid, cid } : { sid })
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
	 * Complete, encoded report lines not yet sent. Encoding happens at queue
	 * time, so a value that cannot serialize throws inside the recording call.
	 * Later mutation of the source values cannot change a queued line.
	 */
	queue: string[];
	disposed: boolean;
}

/**
 * The state owned by one session (one `sid`). This state stores everything
 * CTA-5004-B scopes to the session. A report can belong to an ended session:
 * a response that completes after a `sid` change, or a re-queued batch. Such
 * a report uses its own session's data and counters, not the current
 * session's.
 */
type CmcdSession<C> = {
	sid: string;
	/**
	 * Frozen base provenance record for this session: its `sid` and the
	 * `cid` current at creation time. The reporter writes the record under
	 * {@link CMCD_REQUEST_PROVENANCE} on every request it returns. A request
	 * created with per-call data gets a per-request record: the base record
	 * plus that data encoded. `update()` creates a new record on every `cid`
	 * change, so a record describes the state at request time. Already-issued
	 * requests keep their record. Attribution reads the record's `sid` (see
	 * `resolveSession()`).
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
 * `C` describes the player's own `customData`, which the reporter passes to
 * each configured `transform`. TypeScript infers `C` from the configuration,
 * so an annotation on one `transform` types the request in every other
 * `transform`. The default leaves `customData` values `unknown`.
 *
 * @typeParam C - The type of the player's `customData`. Defaults to
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
	 * Retained sessions keyed by `sid`, in insertion order: oldest first,
	 * current session last. `config.sessionRetention` limits the ended-session
	 * count. CTA-5004-B expects a `sid` to be unique per playback session. A
	 * reused `sid` replaces the earlier session with that `sid` at the newest
	 * position (see `startSession()`).
	 */
	private sessions = new Map<string, CmcdSession<C>>()
	private session: CmcdSession<C>

	/**
	 * Active time-interval timers by target config. Timers continue across
	 * session changes (their callbacks report into whichever session is
	 * current when they fire), so the reporter owns them, not the session.
	 */
	private intervals = new Map<CmcdEventReportConfigNormalized<C>, ReturnType<typeof setInterval>>()
	private started = false

	private requester: (request: HttpRequest) => Promise<{ status: number; }>

	/**
	 * Creates a new CMCD reporter.
	 *
	 * @param config - The configuration for the CMCD reporter.
	 * @param requester - The function that sends the request.
	 *                    The default is a simple wrapper around the
	 *                    native `fetch` API.
	 */
	constructor(config: Partial<CmcdReporterConfig<C>>, requester: (request: HttpRequest) => Promise<{ status: number; }> = defaultRequester) {
		this.config = createCmcdReporterConfig(config)
		this.session = this.createSession(this.config.sid, {
			cid: this.config.cid,
			v: this.config.version,
		})
		this.sessions.set(this.session.sid, this.session)
		this.requester = requester
	}

	/**
	 * Creates the state for a new session: initial counters, flags, queues, and
	 * deduplication baseline for every configured target.
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
			// Frozen because it is handed out on every returned request; the
			// sid value, not the record's identity, is what attributes.
			provenance: mintProvenance(sid, data.cid),
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
	 * Starts the CMCD reporter. The player calls this method when it enables the
	 * reporter.
	 *
	 * This method fires an initial time-interval event immediately (synchronously),
	 * before the first interval elapses. Populate the CMCD data (sid, cid, and
	 * others) before calling start().
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
	 * Starts the time-interval timer for an event target when its config
	 * requires one. Returns whether a timer started. The callback reports into
	 * whichever session is current when the timer fires.
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
	 * Stops the CMCD reporter. The player calls this method when it disables the
	 * reporter.
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
	 * Sends all outstanding event reports, regardless of the batch size or
	 * interval. Use this method when the player is destroyed or a playback
	 * session ends.
	 */
	flush(): void {
		this.processEventTargets(true)
	}

	/**
	 * Updates the CMCD data.
	 *
	 * The player calls this method when data changes. The tracked state fields
	 * are `sta`, `pr`, `cid`, `bg`, and `br`. If a new value for one of them
	 * differs from the last reported value for that field, the reporter fires
	 * the matching state-change event. The comparison uses the last reported
	 * value, not the previous persisted value. The first state-change event in
	 * a new session therefore always fires, even when the persisted value did
	 * not change across the `sid` boundary.
	 *
	 * Multi-field updates fire the events in this order: `sta`, `pr`, `cid`,
	 * `bg`, `br`. The order of keys in the input object does not affect the
	 * firing order.
	 *
	 * A state-change event can include context fields, for example `bl`, `mtp`,
	 * `pt`, `ltc`. Those fields must be in the data store before the state field
	 * changes. Either pass them with the state field in the same `update()`
	 * call, or persist them with earlier `update()` calls. An auto-fired event
	 * reports the current content of the data store. `TIME_INTERVAL` events also
	 * read the data store, and the caller cannot add per-call data to them. The
	 * player must therefore update the fields it wants in periodic reports with
	 * this method.
	 *
	 * A `sid` change resets the deduplication baseline.
	 *
	 * `sid` and `msd` are session-owned. The reporter tracks them itself and
	 * writes them into every outgoing report, so this method is the only way
	 * to change them. A per-call value on {@link CmcdReporter.recordEvent},
	 * {@link CmcdReporter.createRequestReport}, or
	 * {@link CmcdReporter.recordResponseReceived} has no effect. Response
	 * attribution uses the provenance record alone.
	 * `msd` must be a finite number of milliseconds between `0` and
	 * `999_999_999_999_999` (the RFC 8941 integer maximum). The reporter
	 * rounds `msd` to the nearest integer and ignores invalid values.
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

		// A cid change re-mints the session's base provenance record, so a
		// request issued from here on carries the new cid while requests
		// already in flight keep the one they were issued under. Their late
		// responses then report the content the request was actually about.
		if (session.data.cid !== session.provenance.cid) {
			session.provenance = mintProvenance(session.sid, session.data.cid)
		}

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
	 * Starts a new session. The reporter retains the current session for late
	 * responses and creates a new current session. It then sends the ended
	 * sessions' queued reports and removes the oldest sessions beyond the
	 * configured retention.
	 *
	 * The ended session's snapshot is frozen: the reporter detaches its value
	 * graph, so nested values from earlier `update()` calls cannot mutate the
	 * snapshot. The new session starts from a shallow copy of that graph, which
	 * preserves the data store. All fields, including `cid`, `br`, and custom
	 * keys, survive a `sid` change as before. CTA-5004-B expects a `sid` to be
	 * unique per playback session, so a reused `sid` replaces the retained
	 * session with that `sid`. The replaced session's remaining state is lost,
	 * as if removed, and the reporter attributes its late responses to the
	 * replacement.
	 */
	private startSession(sid: string): void {
		this.session.data = copyReportValues({ ...this.session.data })
		this.session = this.createSession(sid, { ...this.session.data })

		// Map.set keeps an existing key's insertion position, so a reused
		// sid must be deleted first: re-inserting at the newest position
		// keeps oldest-first eviction from ever reaching the current
		// session, and ages out genuinely older sessions ahead of it.
		this.sessions.delete(sid)
		this.sessions.set(sid, this.session)

		// Drain ended sessions before eviction can destroy their queues: a
		// partial batch the ended session could never fill again leaves now.
		this.processEventTargets()

		// An evicted session's unsent queues die with it, and its stale
		// responses drop, because its sid no longer names a retained
		// session. The current session was inserted last, so oldest-first
		// eviction never reaches it, and `Infinity` retention never evicts.
		for (const key of this.sessions.keys()) {
			if (this.sessions.size <= this.config.sessionRetention + 1) {
				break
			}

			this.sessions.delete(key)
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
	 * Records an event. The player calls this method when an event occurs.
	 *
	 * For state-change events (`PLAY_STATE`, `PLAYBACK_RATE`, `CONTENT_ID`,
	 * `BACKGROUNDED_MODE`, `BITRATE_CHANGE`), this method:
	 * 1. Writes the state field from `data` (if present) into the reporter's
	 *    data store, as `update()` would.
	 * 2. Discards the event if the state field has no value after that write
	 *    (never set, or cleared with `update({ field: undefined })`).
	 *    A state-change event without its required field would violate CTA-5004-B.
	 * 3. Suppresses the event if the field's current value equals the
	 *    last reported value (no state transition).
	 *
	 * The reporter always records all other event types.
	 *
	 * For state-change events, prefer {@link CmcdReporter.update}, also for
	 * context fields in a combined call like
	 * `update({ sta: 'p', bl: [3000], mtp: [8500] })`. After `update()`
	 * auto-fires a state-change event, deduplication suppresses a
	 * `recordEvent()` call for the same event, and that call's `data` is
	 * silently lost.
	 *
	 * Call `recordEvent()` directly for events whose data comes with the event
	 * call. Examples: `CUSTOM_EVENT` with `cen`, `ERROR` with `ec`, ad lifecycle
	 * events, `MUTE`/`UNMUTE`, `PLAYER_EXPAND`/`PLAYER_COLLAPSE`, `SKIP`. For
	 * `RESPONSE_RECEIVED`, prefer {@link CmcdReporter.recordResponseReceived},
	 * which derives the per-response fields automatically.
	 *
	 * @param type - The type of event to record.
	 * @param data - Additional data to record with the event. This data applies
	 *               only to this event report. The exception is the state field
	 *               of a state-change event, which the reporter also writes into
	 *               its data store. The reporter ignores session-owned keys
	 *               (`sid`, `msd`) supplied here and writes its own values.
	 */
	recordEvent(type: CmcdEventType, data: Partial<Cmcd> = {}): void {
		this.emitEvent(this.session, type, data)
	}

	/**
	 * Records an event for every configured target of a session. State-change
	 * deduplication runs once, before the per-target loop.
	 *
	 * @param session - The session the event belongs to. Everything the event
	 *                  touches (data store, deduplication baseline, counters,
	 *                  queues) is that session's. Only `recordResponseReceived()`
	 *                  ever passes an ended session.
	 * @param type - The type of event to record.
	 * @param data - Additional data to record with the event.
	 * @param request - The media request that triggered the event, when
	 *                  one exists. Only `recordResponseReceived()` sets this
	 *                  parameter, which the reporter passes to each target's
	 *                  `transform`.
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

			// Never emit a state-change event with a missing required field. Per
			// CTA-5004-B these events must include their state field. Catches both
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
	 * Records an event for a target. The reporter calls this method when an
	 * event occurs.
	 *
	 * @param target - The target to record the event for.
	 * @param config - The configuration for the target.
	 * @param type - The type of event to record.
	 * @param data - Additional data to record with the event. This data
	 *               only applies to this event report. Use `update()` for
	 *               persistent data.
	 * @param request - The media request that triggered the event, when
	 *                  one exists. The target's `transform` receives it.
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
	 * Writes the reporter-owned fields into a finished event report, encodes
	 * the report, and pushes the encoded line to the target's queue.
	 *
	 * This method runs after any transform. A transform cannot bypass the
	 * target's `events` filter through `e`, break `sn` continuity, or replace
	 * the session identity in `sid` and `msd`. Encoding here makes a report
	 * that cannot serialize throw inside the recording call, instead of failing
	 * the batch send and re-queueing forever.
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
	 * Records a response-received event. The player calls this method when a
	 * media request response has fully arrived.
	 *
	 * This method derives these `rr` event keys automatically:
	 *
	 * - `url` - the original requested URL (before any redirects)
	 * - `rc` - the HTTP response status code
	 * - `ts` - the request initiation time (from `resourceTiming.startTime`)
	 * - `ttfb` - time to first byte (from `resourceTiming.responseStart`)
	 * - `ttlb` - time to last byte (from `resourceTiming.duration`)
	 *
	 * If the player has additional keys like `ttfbb`, `cmsdd`, `cmsds`, and
	 * `smrt`, pass them in the `data` parameter.
	 *
	 * The request's `customData` is generic, so a player can pass a request with
	 * its own keys (for example `{ requestType: 'segment' }`) without a cast. The
	 * reporter reads only the provenance record that
	 * {@link CmcdReporter.createRequestReport} writes there. Every other key
	 * stays unchanged and visible to an event target's `transform` through its
	 * `request` argument.
	 *
	 * A reporter with a concrete `C` requires the request to satisfy that type.
	 * TypeScript therefore rejects a call whose request the configured
	 * transforms could not read. See {@link CmcdReporterCustomData}.
	 *
	 * The reporter attributes the event only to the session that issued the
	 * request. The provenance record that
	 * {@link CmcdReporter.createRequestReport} stored on the request's
	 * `customData` (under {@link CMCD_REQUEST_PROVENANCE}) selects the session
	 * by `sid`. Without a match, the reporter discards the response rather than
	 * attributing it elsewhere. There is no other key. The reporter discards the
	 * response when a serialization boundary lost the record and nothing
	 * restored it (see {@link CMCD_REQUEST_PROVENANCE}). It also discards the
	 * response when the session is no longer retained (see
	 * `CmcdReporterConfig.sessionRetention`). A per-call `data.sid` cannot
	 * substitute. The reporter accepts any record whose `sid` names a retained
	 * session. The record may come from another reporter with the same session
	 * attributes, or be hand-built. A response that completes after a `sid`
	 * change reports under its own retained session, with that session's data
	 * snapshot and sequence numbers.
	 *
	 * Request-time report keys come from the record's encoded per-call `data`
	 * snapshot, which the reporter decodes for each response. The record's `cid`
	 * replaces the session's current `cid` in the report. A response that
	 * completes after a mid-session content change therefore reports its
	 * request-time values.
	 *
	 * @typeParam RD - The `customData` of this request. Defaults to the
	 *                reporter's own `C`.
	 *
	 * @param response - The HTTP response received.
	 * @param data - Additional CMCD data to include with the event.
	 *               Values provided here override the derived values.
	 *               The reporter ignores session-owned keys (`sid`, `msd`)
	 *               supplied here. Attribution uses the provenance record alone.
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
		const session = this.resolveSession(provenance)

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
	 * Resolves the session a response belongs to. The provenance record's `sid`
	 * must name one of this reporter's retained sessions, or the reporter
	 * discards the response. There is no other key. A lost record, or one that
	 * names a removed or unknown `sid`, resolves nothing. Any other attribution
	 * would be wrong. The reporter reads the `sid` as a plain property. A record
	 * copied through JSON therefore resolves the same session, and a hand-built
	 * record that names a retained session is accepted.
	 */
	private resolveSession(provenance: unknown): CmcdSession<C> | undefined {
		if (provenance === null || typeof provenance !== 'object') {
			return undefined
		}

		const { sid } = provenance as { sid?: unknown; }

		return typeof sid === 'string' ? this.sessions.get(sid) : undefined
	}

	/**
	 * Applies the CMCD request report data to the request. The player calls this
	 * method before sending the request.
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
	 * Checks whether request reporting is enabled.
	 *
	 * @returns `true` if request reporting is enabled, `false` otherwise.
	 */
	isRequestReportingEnabled(): boolean {
		return !!this.config.enabledKeys?.length
	}

	/**
	 * The provenance record to write on a returned request. It is the session's
	 * frozen base record, extended with the caller's per-call data encoded as a
	 * CMCD string when there is any. Requests without per-call data share the
	 * base record, so the reporter writes only one property. The snapshot never
	 * contains reporter-written fields. A value that cannot encode contributes
	 * no snapshot and does not fail the request. The response still attributes
	 * and reports derived keys over session data, matching the tolerance of
	 * `decodeSnapshot()` when reading.
	 */
	private createRequestProvenance(data: Partial<Cmcd> | undefined, baseUrl: string | undefined): CmcdRequestProvenance {
		const base = this.session.provenance

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
	 * Creates a new request with the CMCD request report data applied. The
	 * player calls this method before sending the request.
	 *
	 * A reporter with a concrete `C` requires the request's `customData` to
	 * satisfy that type. TypeScript therefore rejects a call whose request the
	 * configured transform could not read. See
	 * {@link CmcdReporterCustomData}.
	 *
	 * @typeParam R - The type of the request. Its `customData` must satisfy
	 *                the reporter's `C`.
	 *
	 * @param request - The request to apply the CMCD request report to.
	 * @param data - The data to apply to the request. This data only
	 *               applies to this request report. Use `update()` for
	 *               persistent data.
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

		// The player-facing view is detached from the persistent store:
		// prepareCmcdData builds a fresh object but copies values by
		// reference, and players read this object to identify requests, so a
		// shared array would leak mutation into the store. The reporter never
		// reads it back; the response path works from the encoded snapshot on
		// the provenance record.
		const cmcd = report.customData.cmcd = copyReportValues(prepareCmcdData(cmcdData, options))

		if (sendMsd && cmcd.msd !== undefined) {
			session.requestTarget.msdSent = true
		}

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

		return report
	}

	/**
	 * Processes the event targets. The reporter calls this method when an event
	 * occurs.
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
	 * Sends an event report. The reporter calls this method when a batch is
	 * ready.
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
			body: data.join('\n'),
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
	 * stored id. Safe to call when no timer is active (clearInterval(undefined)
	 * does nothing).
	 */
	private disarmInterval(config: CmcdEventReportConfigNormalized<C>): void {
		clearInterval(this.intervals.get(config))
		this.intervals.delete(config)
	}

	/**
	 * Silences an event target URL for the remainder of its session after the
	 * collector signals that the target is gone (HTTP 410). The method clears
	 * the queues and blocks further enqueues for every config in the session
	 * that reports to the URL (the CTA-5004-B suppression scope). For the
	 * current session, the method also cancels those configs' timers. A session
	 * started after the disposal gets new target state and is unaffected.
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
