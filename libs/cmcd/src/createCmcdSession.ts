import { SfItem, SfToken } from '@svta/cml-structured-field-values'
import type { DeepReadonly, HttpRequest } from '@svta/cml-utils'
import { uuid } from '@svta/cml-utils'
import { CMCD_DEFAULT_TIME_INTERVAL } from './CMCD_DEFAULT_TIME_INTERVAL.ts'
import { CMCD_MIME_TYPE } from './CMCD_MIME_TYPE.ts'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdEventSender } from './CmcdEventSender.ts'
import type { CmcdEventSendResult } from './CmcdEventSendResult.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import {
	CMCD_EVENT_BACKGROUNDED_MODE,
	CMCD_EVENT_ERROR,
	CMCD_EVENT_RESPONSE_RECEIVED,
	CMCD_EVENT_TIME_INTERVAL,
} from './CmcdEventType.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdReportFilter } from './CmcdReportFilter.ts'
import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import { CMCD_EVENT_MODE, CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdSessionRequestReportConfig } from './CmcdSessionRequestReportConfig.ts'
import type { CmcdSession } from './CmcdSession.ts'
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import type { CmcdSessionEventReportConfig } from './CmcdSessionEventReportConfig.ts'
import { CMCD_HEADERS } from './CmcdTransmissionMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'
import { encodePreparedCmcd } from './encodePreparedCmcd.ts'
import { prepareCmcdData } from './prepareCmcdData.ts'
import type { CmcdScopedValues } from './readScopedValues.ts'
import { readScopedValues } from './readScopedValues.ts'
import { replaceCmcdParam } from './replaceCmcdParam.ts'
import { toBareValue } from './toBareValue.ts'
import { toPreparedCmcdHeaders } from './toPreparedCmcdHeaders.ts'
import { toResponseKeys } from './toResponseKeys.ts'
import { toTokenString } from './toTokenString.ts'

type KeyFilter = CmcdEncodeOptions['filter']

type Requester = (request: HttpRequest) => Promise<{ status: number }>

type Batch = (string | Cmcd)[]

type Waiting = {
	bs: string[]
	bsd: unknown[]
	ec: unknown[]
}

type Destination = {
	sn: number
	msdSent: boolean
	waiting: Waiting
	gone: boolean
}

type Draft = Pick<Destination, 'sn' | 'msdSent' | 'waiting'>

type Target = {
	destination: Destination
	events: readonly CmcdEventType[]
	keys: KeyFilter
	batchSize: number
	interval: number
	filter?: CmcdReportFilter
	copies: boolean
	deliver: (batch: Batch) => Promise<number>
	queue: Batch
	urgent: boolean
	inFlight: boolean
	flushPending: boolean
	delay: number
	retry?: ReturnType<typeof setTimeout>
	timer?: ReturnType<typeof setInterval>
}

const MIN_DELAY = 1000
const MAX_DELAY = 60_000
const CMCD_HEADER = /^cmcd-(object|request|session|status)$/i

function toKeyFilter(keys: readonly CmcdKey[] | undefined): KeyFilter {
	if (!keys) {
		return undefined
	}

	const set = new Set<string>(keys)

	return key => set.has(key)
}

function withoutScopedKeys({ msd, bs, bsd, ec, ...data }: Cmcd): Cmcd {
	return data
}

function withoutStallKeys({ bs, bsd, ...data }: Cmcd): Cmcd {
	return data
}

function copyValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(copyValue)
	}

	if (value instanceof SfItem) {
		return new SfItem(copyValue(value.value), value.params && { ...value.params })
	}

	if (value instanceof SfToken) {
		return new SfToken(value.description)
	}

	return value
}

function copyReport(report: Cmcd): Cmcd {
	const copy: Record<string, unknown> = {}

	for (const [key, value] of Object.entries(report)) {
		copy[key] = copyValue(value)
	}

	return copy as Cmcd
}

function createDestination(): Destination {
	return { sn: 0, msdSent: false, waiting: { bs: [], bsd: [], ec: [] }, gone: false }
}

function defaultRequester(request: HttpRequest): Promise<{ status: number }> {
	const { url, ...init } = request

	return fetch(url, init)
}

function toDeliver(
	{ url, send }: CmcdSessionEventReportConfig,
	requester: Requester,
): Target['deliver'] {
	if (url !== undefined) {
		return batch =>
			requester({
				url,
				method: 'POST',
				headers: { 'Content-Type': CMCD_MIME_TYPE },
				body: (batch as string[]).join('\n'),
			}).then(response => response?.status ?? 0)
	}

	return batch =>
		Promise.resolve(send?.(batch as Parameters<CmcdEventSender>[0])).then(result =>
			(result as CmcdEventSendResult | undefined)?.gone ? 410 : 200,
		)
}

/**
 * Creates a CMCD session. One session reports one `sid`.
 *
 * Request mode is one destination. Each event target is one destination.
 * Each destination has its own sequence number.
 * The player passes its CMCD data with each call and decides itself when its state changes.
 *
 * @param config - The configuration of the session.
 * @param requester - Sends each batch of event reports to a target with a `url`. The default requester uses `fetch`.
 * @returns The session.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/createCmcdSession.test.ts#example}
 */
export function createCmcdSession(
	config: CmcdSessionConfig = {},
	requester: (request: HttpRequest) => Promise<{ status: number }> = defaultRequester,
): CmcdSession {
	const sid = config.sid ?? uuid()
	const timeOrigin = performance.timeOrigin || Date.now() - performance.now()
	const settings: CmcdSessionRequestReportConfig = {
		version: config.version,
		transmissionMode: config.transmissionMode,
		enabledKeys: config.enabledKeys,
		customHeaderMap: config.customHeaderMap,
	}
	const requestDestination = createDestination()
	const destinations: Destination[] = [requestDestination]
	const targets: Target[] = []
	let requestKeys = toKeyFilter(settings.enabledKeys)
	let msd: number | undefined
	let stopped = false

	for (const target of config.eventTargets ?? []) {
		const destination = createDestination()

		destinations.push(destination)
		targets.push({
			destination,
			events: [...(target.events ?? [])],
			keys: toKeyFilter(target.enabledKeys),
			batchSize: target.batchSize ?? 1,
			interval: target.interval ?? CMCD_DEFAULT_TIME_INTERVAL,
			filter: target.filter,
			copies: target.send !== undefined,
			deliver: toDeliver(target, requester),
			queue: [],
			urgent: false,
			inFlight: false,
			flushPending: false,
			delay: 0,
		})
	}

	function draftOf(drafts: Map<Destination, Draft>, destination: Destination): Draft {
		let draft = drafts.get(destination)

		if (!draft) {
			draft = {
				sn: destination.sn,
				msdSent: destination.msdSent,
				waiting: { ...destination.waiting },
			}
			drafts.set(destination, draft)
		}

		return draft
	}

	function build(
		draft: Draft,
		base: Cmcd,
		scoped: CmcdScopedValues,
		reportingMode: CmcdReportingMode,
		version: CmcdVersion,
		keys: KeyFilter,
		baseUrl?: string,
	): Cmcd {
		const { waiting } = draft
		const values: Record<string, unknown> = {
			...base,
			cid: base.cid ?? config.cid,
			msd: draft.msdSent ? undefined : (msd ?? scoped.msd),
		}

		if (waiting.bs.length) {
			const ot = toTokenString(base.ot)
			const kept = ot === undefined ? [] : waiting.bs.filter(type => type !== '' && type !== ot)

			if (kept.length < waiting.bs.length) {
				values['bs'] = true
			}

			waiting.bs = kept
		}

		if (waiting.bsd.length) {
			values['bsd'] = [...waiting.bsd, ...(scoped.bsd ?? [])]
			waiting.bsd = []
		}

		if (waiting.ec.length) {
			values['ec'] = [...waiting.ec, ...(scoped.ec ?? [])]
			waiting.ec = []
		}

		values['sid'] = sid
		values['sn'] = draft.sn++

		const prepared = prepareCmcdData(values, { version, reportingMode, filter: keys, baseUrl })

		draft.msdSent ||= prepared.msd !== undefined

		return prepared
	}

	function commit(drafts: Map<Destination, Draft>, scoped: CmcdScopedValues): void {
		msd ??= scoped.msd

		for (const destination of destinations) {
			const draft = drafts.get(destination)

			if (draft) {
				Object.assign(destination, draft)
			} else if (!destination.gone) {
				const { waiting } = destination

				if (scoped.bs !== undefined) {
					waiting.bs.push(scoped.bs)
				}

				if (scoped.bsd) {
					waiting.bsd.push(...scoped.bsd)
				}

				if (scoped.ec) {
					waiting.ec.push(...scoped.ec)
				}
			}
		}
	}

	function stopTarget(target: Target): void {
		target.destination.gone = true
		target.destination.waiting = { bs: [], bsd: [], ec: [] }
		clearInterval(target.timer)
		clearTimeout(target.retry)
		target.timer = undefined
		target.retry = undefined
		target.queue.length = 0
		target.urgent = false
		target.flushPending = false
	}

	function isReady(target: Target): boolean {
		return target.queue.length >= target.batchSize || target.urgent
	}

	function send(target: Target, force?: boolean): void {
		if (target.inFlight) {
			target.flushPending ||= force === true
			return
		}

		if (target.destination.gone || !target.queue.length || (target.retry !== undefined && !force)) {
			return
		}

		clearTimeout(target.retry)
		target.retry = undefined
		target.inFlight = true

		const batch = target.queue.splice(0)
		const urgent = target.urgent

		target.urgent = false

		const settle = (status?: number): void => {
			target.inFlight = false

			if (status === 410) {
				stopTarget(target)
				return
			}

			if (target.destination.gone) {
				return
			}

			// CTA-5004-B: back off after a 429 or 5xx response.
			const failed =
				status === undefined || status === 0 || status === 429 || (status >= 500 && status < 600)

			if (failed) {
				target.queue.unshift(...batch)
				target.urgent ||= urgent
				target.delay = Math.min(target.delay * 2 || MIN_DELAY, MAX_DELAY)

				if (!stopped) {
					target.retry = setTimeout(() => {
						target.retry = undefined
						send(target)
					}, target.delay)
				}
			} else {
				target.delay = 0
			}

			if (target.flushPending) {
				target.flushPending = false
				send(target, true)
			} else if (!failed && isReady(target)) {
				send(target)
			}
		}

		new Promise<number>(resolve => resolve(target.deliver(batch))).then(settle, () => settle())
	}

	function emit(
		type: CmcdEventType,
		data: Cmcd,
		request?: DeepReadonly<HttpRequest>,
		candidates: readonly Target[] = targets,
		ec?: readonly string[],
	): void {
		const report: Cmcd = { ...data, e: type, ts: data.ts ?? Date.now() }

		// CTA-5004-B: a b event without bg is the exit from backgrounded mode.
		if (type === CMCD_EVENT_BACKGROUNDED_MODE && toBareValue(report.bg) === false) {
			delete report.bg
		}

		const scoped = readScopedValues(report, ec)
		const selected = candidates.filter(
			target =>
				target.events.includes(type) &&
				!target.destination.gone &&
				(!target.filter || target.filter(report, request)),
		)
		const drafts = new Map<Destination, Draft>()
		const queued = selected.map(target => {
			const prepared = build(
				draftOf(drafts, target.destination),
				report,
				scoped,
				CMCD_EVENT_MODE,
				CMCD_V2,
				target.keys,
			)
			const line = encodePreparedCmcd(prepared)

			return target.copies ? copyReport(prepared) : line
		})

		commit(drafts, scoped)

		selected.forEach((target, i) => {
			target.queue.push(queued[i])
			target.urgent ||= type === CMCD_EVENT_ERROR

			if (isReady(target)) {
				send(target)
			}
		})
	}

	return {
		sid,

		createRequestReport<R extends HttpRequest>(
			request: R,
			data: Cmcd = {},
		): R & CmcdRequestReport<R['customData']> {
			const scoped = readScopedValues(data)
			const drafts = new Map<Destination, Draft>()
			const cmcd = build(
				draftOf(drafts, requestDestination),
				data,
				scoped,
				CMCD_REQUEST_MODE,
				settings.version ?? CMCD_V2,
				requestKeys,
				request.url,
			)
			const { headers: source = {}, ...rest } = request
			const customData = request.customData as object | undefined
			const replace = settings.transmissionMode === CMCD_HEADERS
			const headers: Record<string, string> = {}
			let url = request.url

			for (const name in source) {
				if (!replace || !CMCD_HEADER.test(name)) {
					headers[name] = source[name]
				}
			}

			if (replace) {
				Object.assign(headers, toPreparedCmcdHeaders(cmcd, settings.customHeaderMap))
			} else {
				url = replaceCmcdParam(url, encodePreparedCmcd(cmcd))
			}

			commit(drafts, scoped)

			return { ...rest, url, headers, customData: { ...customData, cmcd } } as R &
				CmcdRequestReport<R['customData']>
		},

		recordEvent(type, data = {}, request) {
			emit(type, data, request)
		},

		recordResponseReceived(response, data = {}) {
			const { cmcd } = (response.request.customData ?? {}) as { cmcd?: Cmcd }
			const requestData = withoutScopedKeys(cmcd ?? {})

			emit(
				CMCD_EVENT_RESPONSE_RECEIVED,
				{ ...requestData, ...toResponseKeys(response, timeOrigin), ...data },
				response.request,
			)
		},

		recordError(codes, data = {}) {
			const ec = typeof codes === 'string' ? [codes] : [...codes]

			emit(CMCD_EVENT_ERROR, { ...data, ec }, undefined, targets, ec)
		},

		configure(next) {
			Object.assign(settings, next)
			requestKeys = toKeyFilter(settings.enabledKeys)
		},

		start(immediate = true) {
			const { snapshot } = config
			const ticks: (() => void)[] = []

			stopped = false

			for (const target of targets) {
				clearInterval(target.timer)
				target.timer = undefined

				if (
					snapshot &&
					target.interval > 0 &&
					!target.destination.gone &&
					target.events.includes(CMCD_EVENT_TIME_INTERVAL)
				) {
					const tick = (): void =>
						emit(CMCD_EVENT_TIME_INTERVAL, withoutStallKeys(snapshot()), undefined, [target])

					target.timer = setInterval(tick, target.interval * 1000)

					if (immediate) {
						ticks.push(tick)
					}
				}
			}

			ticks.forEach(tick => tick())
		},

		stop() {
			stopped = true

			for (const target of targets) {
				clearInterval(target.timer)
				clearTimeout(target.retry)
				target.timer = undefined
				target.retry = undefined
			}
		},

		flush() {
			for (const target of targets) {
				send(target, true)
			}
		},
	}
}
