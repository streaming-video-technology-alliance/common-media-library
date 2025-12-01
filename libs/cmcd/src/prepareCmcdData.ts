import { isTokenField, isValid } from '@svta/cml-cta'
import { SfToken } from '@svta/cml-structured-field-values'
import { CMCD_EVENT_MODE } from './CMCD_EVENT_MODE.ts'
import { CMCD_FORMATTER_MAP } from './CMCD_FORMATTER_MAP.ts'
import { CMCD_REQUEST_MODE } from './CMCD_REQUEST_MODE.ts'
import type { CmcdData } from './CmcdData.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdFormatterOptions } from './CmcdFormatterOptions.ts'
import type { CmcdValue } from './CmcdValue.ts'
import { isCmcdEventKey } from './isCmcdEventKey.ts'
import { isCmcdRequestKey } from './isCmcdRequestKey.ts'
import { isCmcdResponseReceivedKey } from './isCmcdResponseReceivedKey.ts'
import { isCmcdV1Key } from './isCmcdV1Key.ts'

const filterMap = {
	[CMCD_EVENT_MODE]: isCmcdEventKey,
	[CMCD_REQUEST_MODE]: isCmcdRequestKey,
}

/**
 * Convert a generic object to CMCD data.
 *
 * @param obj - The CMCD object to process.
 * @param options - Options for encoding.
 *
 *
 * @beta
 */
export function prepareCmcdData(obj: Record<string, any>, options: CmcdEncodeOptions = {}): CmcdData {
	const results: CmcdData = {}

	if (obj == null || typeof obj !== 'object') {
		return results
	}

	const version = options.version || (obj['v'] as number) || 1
	const reportingMode = options.reportingMode || CMCD_REQUEST_MODE
	const keyFilter = version === 1 ? isCmcdV1Key : filterMap[reportingMode]

	// Filter keys based on the version, reporting mode and options
	let keys = Object.keys(obj).filter(keyFilter)

	if (obj['e'] && obj['e'] !== 'rr') {
		keys = keys.filter(key => !isCmcdResponseReceivedKey(key))
	}

	const filter = options.filter
	if (typeof filter === 'function') {
		keys = keys.filter(filter)
	}

	// Ensure all required keys are present before sorting
	const needsTimestamp = reportingMode === CMCD_EVENT_MODE
	if (needsTimestamp && !keys.includes('ts')) {
		keys.push('ts')
	}

	if (version > 1 && !keys.includes('v')) {
		keys.push('v')
	}

	const formatters = Object.assign({}, CMCD_FORMATTER_MAP, options.formatters)
	const formatterOptions: CmcdFormatterOptions = {
		version,
		reportingMode,
		baseUrl: options.baseUrl,
	}

	keys.sort().forEach(key => {
		let value = obj[key] as CmcdValue

		const formatter = formatters[key]
		if (typeof formatter === 'function') {
			value = formatter(value, formatterOptions)
		}

		// Version should only be reported if not equal to 1.
		if (key === 'v') {
			if (version === 1) {
				return
			}
			else {
				value = version
			}
		}

		// Playback rate should only be sent if not equal to 1.
		if (key == 'pr' && value === 1) {
			return
		}

		// Ensure a timestamp is set for response and event modes
		if (needsTimestamp && key === 'ts' && !Number.isFinite(value)) {
			value = Date.now()
		}

		// ignore invalid values
		if (!isValid(value)) {
			return
		}

		if (isTokenField(key) && typeof value === 'string') {
			value = new SfToken(value)
		}

		(results as any)[key] = value
	})

	return results
}
