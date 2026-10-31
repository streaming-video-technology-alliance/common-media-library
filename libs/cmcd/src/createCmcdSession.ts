import type { HttpRequest } from '@svta/cml-utils'
import { uuid } from '@svta/cml-utils'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdKey } from './CmcdKey.ts'
import { CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdSessionRequestReportConfig } from './CmcdSessionRequestReportConfig.ts'
import type { CmcdSession } from './CmcdSession.ts'
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { CMCD_HEADERS } from './CmcdTransmissionMode.ts'
import { encodePreparedCmcd } from './encodePreparedCmcd.ts'
import { prepareCmcdData } from './prepareCmcdData.ts'
import { replaceCmcdParam } from './replaceCmcdParam.ts'
import { toPreparedCmcdHeaders } from './toPreparedCmcdHeaders.ts'

type KeyFilter = CmcdEncodeOptions['filter']

const CMCD_HEADER = /^cmcd-(object|request|session|status)$/i

function toKeyFilter(keys: readonly CmcdKey[] | undefined): KeyFilter {
	if (!keys) {
		return undefined
	}

	const set = new Set<string>(keys)

	return key => set.has(key)
}

/**
 * Creates a CMCD session. One session reports one `sid`.
 *
 * Request mode has its own sequence number.
 * The player passes its CMCD data with each call.
 *
 * @param config - The configuration of the session.
 * @returns The session.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/createCmcdSession.test.ts#example}
 */
export function createCmcdSession(config: CmcdSessionConfig = {}): CmcdSession {
	const sid = config.sid ?? uuid()
	const settings: CmcdSessionRequestReportConfig = {
		version: config.version,
		transmissionMode: config.transmissionMode,
		enabledKeys: config.enabledKeys,
		customHeaderMap: config.customHeaderMap,
	}
	let requestKeys = toKeyFilter(settings.enabledKeys)
	let sn = 0

	return {
		sid,

		createRequestReport<R extends HttpRequest>(
			request: R,
			data: Cmcd = {},
		): R & CmcdRequestReport<R['customData']> {
			const cmcd = prepareCmcdData(
				{ ...data, cid: data.cid ?? config.cid, sid, sn },
				{
					version: settings.version ?? CMCD_V2,
					reportingMode: CMCD_REQUEST_MODE,
					filter: requestKeys,
					baseUrl: request.url,
				},
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

			sn++

			return { ...rest, url, headers, customData: { ...customData, cmcd } } as R &
				CmcdRequestReport<R['customData']>
		},

		configure(next) {
			Object.assign(settings, next)
			requestKeys = toKeyFilter(settings.enabledKeys)
		},
	}
}
