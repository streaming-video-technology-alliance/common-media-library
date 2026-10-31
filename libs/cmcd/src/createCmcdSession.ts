import type { DeepReadonly, HttpRequest } from '@svta/cml-utils'
import { uuid } from '@svta/cml-utils'
import { CMCD_MIME_TYPE } from './CMCD_MIME_TYPE.ts'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import { CMCD_EVENT_BACKGROUNDED_MODE } from './CmcdEventType.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdReportFilter } from './CmcdReportFilter.ts'
import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import { CMCD_EVENT_MODE, CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdSessionRequestReportConfig } from './CmcdSessionRequestReportConfig.ts'
import type { CmcdSession } from './CmcdSession.ts'
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { CMCD_HEADERS } from './CmcdTransmissionMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'
import { encodePreparedCmcd } from './encodePreparedCmcd.ts'
import { prepareCmcdData } from './prepareCmcdData.ts'
import { replaceCmcdParam } from './replaceCmcdParam.ts'
import { toBareValue } from './toBareValue.ts'
import { toPreparedCmcdHeaders } from './toPreparedCmcdHeaders.ts'

type KeyFilter = CmcdEncodeOptions['filter']

type Destination = {
	sn: number
}

type Draft = Pick<Destination, 'sn'>

type Target = {
	url: string
	destination: Destination
	events: readonly CmcdEventType[]
	keys: KeyFilter
	batchSize: number
	filter?: CmcdReportFilter
	queue: string[]
	inFlight: boolean
	flushPending: boolean
}

const CMCD_HEADER = /^cmcd-(object|request|session|status)$/i

function toKeyFilter(keys: readonly CmcdKey[] | undefined): KeyFilter {
	if (!keys) {
		return undefined
	}

	const set = new Set<string>(keys)

	return key => set.has(key)
}

function createDestination(): Destination {
	return { sn: 0 }
}

function defaultRequester(request: HttpRequest): Promise<{ status: number }> {
	const { url, ...init } = request

	return fetch(url, init)
}

/**
 * Creates a CMCD session. One session reports one `sid`.
 *
 * Request mode is one destination. Each event target is one destination.
 * Each destination has its own sequence number.
 * The player passes its CMCD data with each call and decides itself when its state changes.
 *
 * @param config - The configuration of the session.
 * @param requester - Sends each batch of event reports. The default requester uses `fetch`.
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
	const settings: CmcdSessionRequestReportConfig = {
		version: config.version,
		transmissionMode: config.transmissionMode,
		enabledKeys: config.enabledKeys,
		customHeaderMap: config.customHeaderMap,
	}
	const requestDestination = createDestination()
	const targets: Target[] = []
	let requestKeys = toKeyFilter(settings.enabledKeys)

	for (const target of config.eventTargets ?? []) {
		const destination = createDestination()

		targets.push({
			url: target.url,
			destination,
			events: [...(target.events ?? [])],
			keys: toKeyFilter(target.enabledKeys),
			batchSize: target.batchSize ?? 1,
			filter: target.filter,
			queue: [],
			inFlight: false,
			flushPending: false,
		})
	}

	function draftOf(drafts: Map<Destination, Draft>, destination: Destination): Draft {
		let draft = drafts.get(destination)

		if (!draft) {
			draft = { sn: destination.sn }
			drafts.set(destination, draft)
		}

		return draft
	}

	function build(
		draft: Draft,
		base: Cmcd,
		reportingMode: CmcdReportingMode,
		version: CmcdVersion,
		keys: KeyFilter,
		baseUrl?: string,
	): Cmcd {
		return prepareCmcdData(
			{ ...base, cid: base.cid ?? config.cid, sid, sn: draft.sn++ },
			{ version, reportingMode, filter: keys, baseUrl },
		)
	}

	function commit(drafts: Map<Destination, Draft>): void {
		for (const [destination, draft] of drafts) {
			Object.assign(destination, draft)
		}
	}

	function isReady(target: Target): boolean {
		return target.queue.length >= target.batchSize
	}

	function send(target: Target, force?: boolean): void {
		if (target.inFlight) {
			target.flushPending ||= force === true
			return
		}

		if (!target.queue.length) {
			return
		}

		target.inFlight = true

		const lines = target.queue.splice(0)
		const request: HttpRequest = {
			url: target.url,
			method: 'POST',
			headers: { 'Content-Type': CMCD_MIME_TYPE },
			body: lines.join('\n'),
		}

		const settle = (): void => {
			target.inFlight = false

			if (target.flushPending) {
				target.flushPending = false
				send(target, true)
			} else if (isReady(target)) {
				send(target)
			}
		}

		new Promise<{ status: number }>(resolve => resolve(requester(request))).then(settle, settle)
	}

	function emit(type: CmcdEventType, data: Cmcd, request?: DeepReadonly<HttpRequest>): void {
		const report: Cmcd = { ...data, e: type, ts: data.ts ?? Date.now() }

		// CTA-5004-B: a b event without bg is the exit from backgrounded mode.
		if (type === CMCD_EVENT_BACKGROUNDED_MODE && toBareValue(report.bg) === false) {
			delete report.bg
		}

		const selected = targets.filter(
			target => target.events.includes(type) && (!target.filter || target.filter(report, request)),
		)
		const drafts = new Map<Destination, Draft>()
		const lines = selected.map(target =>
			encodePreparedCmcd(
				build(draftOf(drafts, target.destination), report, CMCD_EVENT_MODE, CMCD_V2, target.keys),
			),
		)

		commit(drafts)

		selected.forEach((target, i) => {
			target.queue.push(lines[i])

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
			const drafts = new Map<Destination, Draft>()
			const cmcd = build(
				draftOf(drafts, requestDestination),
				data,
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

			commit(drafts)

			return { ...rest, url, headers, customData: { ...customData, cmcd } } as R &
				CmcdRequestReport<R['customData']>
		},

		recordEvent(type, data = {}, request) {
			emit(type, data, request)
		},

		configure(next) {
			Object.assign(settings, next)
			requestKeys = toKeyFilter(settings.enabledKeys)
		},

		flush() {
			for (const target of targets) {
				send(target, true)
			}
		},
	}
}
