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
	interval: number;
	batchSize: number;
}

type CmcdReporterConfigNormalized = CmcdReporterConfig & CmcdReportConfigNormalized & {
	sid: string;
	targets: CmcdEventReportConfigNormalized[];
}

function createEncodingOptions(reportingMode: CmcdReportingMode, config: CmcdReportConfig): CmcdEncodeOptions {
	const { enabledKeys } = config

	return {
		version: config.version || CMCD_V2,
		reportingMode,
		filter: enabledKeys ? (key: CmcdKey) => enabledKeys.includes(key) : undefined,
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
		targets = [],
		sid = uuid(),
		...rest
	} = config

	return {
		...rest,
		version,
		sid,
		// Apply target config defaults
		targets: targets.reduce((acc, target) => {
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

type CmcdEventTarget = {
	intervalId: ReturnType<typeof setInterval>;
	sn: number;
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
	private eventTargets = new Map<CmcdEventReportConfigNormalized, CmcdEventTarget>()

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
			cid: config.cid,
			sid: config.sid,
			v: config.version,
		}
		this.requester = requester
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

			target.intervalId = setInterval(() => {
				this.recordEvent(CMCD_EVENT_TIME_INTERVAL)
			}, config.interval * 1000)
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
		// TODO: May need a deep merge utility for this.
		this.data = { ...this.data, ...data }
	}

	/**
	 * Records an event. Called by the player when an event occurs.
	 *
	 * @param type - The type of event to record.
	 */
	recordEvent(type: CmcdEventType): void {
		this.eventTargets.forEach((target) => {
			target.queue.push({
				e: type,
				ts: Date.now(),
				sn: target.sn++,
				...this.data
			})
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
		if (!req || !req.url) {
			return req
		}

		const url = new URL(req.url)
		const headers = Object.assign({}, req.headers)
		const transimissionMode = this.config.transmissionMode || CMCD_QUERY
		const options = createEncodingOptions(CMCD_REQUEST_MODE, this.config)

		switch (transimissionMode) {
			case CMCD_QUERY:
				const param = encodeCmcd(this.data, options)
				if (param) {
					url.searchParams.set(CMCD_PARAM, param)
				}
				break

			case CMCD_HEADERS:
				Object.assign(headers, toCmcdHeaders(this.data, options))
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

			if (config.batchSize < queue.length && !flush) {
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

		switch (response.status) {
			case 410:
				this.eventTargets.delete(target)
				break

			case 429:
				// Needs clarification
				break

			default:
				break
		}
	}
}
