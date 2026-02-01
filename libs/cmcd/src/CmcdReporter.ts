import type { Request } from '@svta/cml-utils'
import { uuid } from '@svta/cml-utils'
import { CMCD_DEFAULT_TIME_INTERVAL } from './CMCD_DEFAULT_TIME_INTERVAL.ts'
import { CMCD_PARAM } from './CMCD_PARAM.ts'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { CmcdData } from './CmcdData.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdEventReportConfig } from './CmcdEventReportConfig.ts'
import { CMCD_EVENT_TIME_INTERVAL, CmcdEventType } from './CmcdEventType.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdReportConfig } from './CmcdReportConfig.ts'
import type { CmcdReporterConfig } from './CmcdReporterConfig.ts'
import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import { CMCD_EVENT_MODE, CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import { CMCD_HEADERS, CMCD_QUERY } from './CmcdTransmissionMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'
import { encodeCmcd } from './encodeCmcd.ts'
import { toCmcdHeaders } from './toCmcdHeaders.ts'

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

function createEncodingOptions(reportingMode: CmcdReportingMode, config: CmcdReportConfig): CmcdEncodeOptions {
	const { enabledKeys = [] } = config

	return {
		version: config.version || CMCD_V2,
		reportingMode,
		filter: (key: CmcdKey) => enabledKeys.includes(key),
	}
}

function defaultRequester(request: Request): Promise<{ status: number; }> {
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
			// TODO: How should an undefined events array be handled?
			//       Does that represent no events to report, or reporting all events?
			if (target && target.url && target.events?.length) {
				acc.push({
					version: target.version || CMCD_V2,
					enabledKeys: target.enabledKeys?.slice(),
					url: target.url,
					events: target.events.slice(),
					interval: target.interval ?? CMCD_DEFAULT_TIME_INTERVAL,
					batchSize: target.batchSize || 1,
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
	queue: CmcdData[];
}

/**
 * The CMCD reporter.
 *
 * @public
 */
export class CmcdReporter {
	private data: CmcdData = {}
	private config: CmcdReporterConfigNormalized
	private requestEncodingOptions: CmcdEncodeOptions
	private msd: number = NaN
	private eventTargets = new Map<CmcdEventReportConfigNormalized, CmcdEventTarget>()
	private requestTarget: CmcdTarget = {
		sn: 0,
		msdSent: false,
	}

	// TODO: Should this be an event handler?
	private requester: (request: Request) => Promise<{ status: number; }>

	/**
	 * Creates a new CMCD reporter.
	 *
	 * @param config - The configuration for the CMCD reporter.
	 */
	constructor(config: Partial<CmcdReporterConfig>, requester: (request: Request) => Promise<{ status: number; }> = defaultRequester) {
		this.config = createCmcdReporterConfig(config)
		this.data = {
			cid: this.config.cid,
			sid: this.config.sid,
			v: this.config.version,
		}
		this.requestEncodingOptions = createEncodingOptions(CMCD_REQUEST_MODE, this.config)
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
	 */
	start(): void {
		this.eventTargets.forEach((target, config) => {
			// If the interval is 0 or the TIME_INTERVAL event is not enabled, do not start the interval.
			if (config.interval === 0 || !config.events.includes(CmcdEventType.TIME_INTERVAL)) {
				return
			}

			const timeIntervalEvent = () => {
				this.recordEvent(CMCD_EVENT_TIME_INTERVAL)
			}

			target.intervalId = setInterval(timeIntervalEvent, config.interval * 1000)
			timeIntervalEvent()
		})
	}

	/**
	 * Stops the CMCD reporter. Called by the player when the reporter is disabled.
	 */
	stop(): void {
		this.eventTargets.forEach((target) => {
			clearInterval(target.intervalId)
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
	 * Updates the CMCD data. Called by the player when the data changes.
	 *
	 * @param data - The data to update.
	 */
	update(data: Partial<CmcdData>): void {
		if (data.sid && data.sid !== this.data.sid) {
			this.resetSession()
			return
		}

		if (data.msd && !isNaN(data.msd)) {
			this.msd = data.msd
		}

		// TODO: May need a deep merge utility for this.
		this.data = { ...this.data, ...data, msd: undefined }
	}

	/**
	 * Records an event. Called by the player when an event occurs.
	 *
	 * @param type - The type of event to record.
	 * @param data - Additional data to record with the event. This is
	 *               the same as calling `update()` with the same data.
	 */
	recordEvent(type: CmcdEventType, data?: Partial<CmcdData>): void {
		const { cen, ...rest } = data || {}

		if (rest) {
			this.update(rest)
		}

		this.eventTargets.forEach((target, config) => {
			if (!config.events.includes(type)) {
				return
			}

			const item = {
				...this.data,
				e: type,
				ts: Date.now(),
				sn: target.sn++,
			}

			if (type === CmcdEventType.CUSTOM_EVENT && cen) {
				item.cen = cen
			}

			if (!isNaN(this.msd) && !target.msdSent) {
				item.msd = this.msd
				target.msdSent = true
			}

			target.queue.push(item)
		})

		this.processEventTargets()
	}

	/**
	 * Applies the CMCD request report data to the request. Called by the player
	 * before sending the request.
	 *
	 * @param req - The request to apply the CMCD request report to.
	 * @returns The request with the CMCD request report applied.
	 */
	applyRequestReport(req: Request): Request {
		if (!req || !req.url || !this.config.enabledKeys?.length) {
			return req
		}

		const url = new URL(req.url)
		const headers = Object.assign({}, req.headers)
		const data = { ...this.data, sn: this.requestTarget.sn++ }

		if (!isNaN(this.msd) && !this.requestTarget.msdSent) {
			data.msd = this.msd
			this.requestTarget.msdSent = true
		}

		switch (this.config.transmissionMode) {
			case CMCD_QUERY:
				const param = encodeCmcd(data, this.requestEncodingOptions)
				if (param) {
					url.searchParams.set(CMCD_PARAM, param)
				}
				break

			case CMCD_HEADERS:
				Object.assign(headers, toCmcdHeaders(data, this.requestEncodingOptions))
				break
		}

		return {
			...req,
			url: url.toString(),
			headers,
		}
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
			this.sendEventReport(config, events)

			reprocess ||= queue.length > 0
		})

		if (reprocess) {
			this.processEventTargets()
		}
	}

	/**
	 * Sends an event report. Called by the reporter when a batch is ready to be sent.
	 *
	 * @param target - The target to send the event report to.
	 * @param data - The data to send in the event report.
	 */
	private async sendEventReport(target: CmcdEventReportConfigNormalized, data: CmcdData[]): Promise<void> {
		const options = createEncodingOptions(CMCD_EVENT_MODE, target)
		const response = await this.requester({
			url: target.url,
			method: 'POST',
			headers: {
				'Content-Type': 'text/cmcd',
			},
			body: data.reduce((acc, item) => acc += `${encodeCmcd(item, options)}\n`, ''),
		})

		const { status } = response
		switch (status) {
			case 410:
				this.eventTargets.delete(target)
				break

			case 429:
				// Needs clarification
				break

			default:
				if (status > 499 && status < 600) {
					// retry logic
				}
				break
		}
	}

	/**
	 * Resets the session related data. Called when the session ID changes.
	 */
	private resetSession(): void {
		this.eventTargets.forEach(target => target.sn = 0)
		this.requestTarget.sn = 0
	}
}
