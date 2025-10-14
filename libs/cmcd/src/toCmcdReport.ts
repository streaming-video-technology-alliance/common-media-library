import type { Request } from '@svta/cml-utils'
import type { Cmcd } from './Cmcd.ts'
import { CMCD_HEADERS } from './CMCD_HEADERS.ts'
import { CMCD_PARAM } from './CMCD_PARAM.ts'
import { CMCD_QUERY } from './CMCD_QUERY.ts'
import type { CmcdData } from './CmcdData.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdReportTarget } from './CmcdReportTarget.ts'
import { encodeCmcd } from './encodeCmcd.ts'
import { toCmcdHeaders } from './toCmcdHeaders.ts'

/**
 * Converts CMCD data into a report format.
 *
 * @param data - The CMCD data to be transformed into a report
 * @param target - The target configuration for the CMCD report
 *
 * @return A CMCD report object
 *
 *
 * @beta
 *
 * @example
 * {@includeCode ../test/toCmcdReport.test.ts#example}
 */
export function toCmcdReport(data: CmcdData, target: CmcdReportTarget): Request<{ cmcd: Cmcd }> | null {
	if (!target || !target.url) {
		return null
	}

	const url = new URL(target.url)
	const method = target.method || 'GET'
	const headers = {}
	const transimissionMode = target.transmissionMode || CMCD_QUERY
	const options: CmcdEncodeOptions = {
		version: target.version,
		reportingMode: target.reportingMode,
	}

	if (target.enabledKeys) {
		options.filter = (key: CmcdKey) => target.enabledKeys!.includes(key)
	}

	switch (transimissionMode) {
		case CMCD_QUERY:
			const param = encodeCmcd(data, options)
			if (param) {
				url.searchParams.set(CMCD_PARAM, param)
			}
			break

		case CMCD_HEADERS:
			Object.assign(headers, toCmcdHeaders(data, options))
			break
	}

	return {
		url: url.toString(),
		method,
		headers,
	}
}
