import { SfItem, SfToken } from '@svta/cml-structured-field-values'
import { CMCD_FORMATTER_MAP } from './CMCD_FORMATTER_MAP.ts'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdFormatterOptions } from './CmcdFormatterOptions.ts'
import type { CmcdKey } from './CmcdKey.ts'
import { CMCD_EVENT_MODE, CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdValue } from './CmcdValue.ts'
import { isCmcdEventKey } from './isCmcdEventKey.ts'
import { isCmcdRequestKey } from './isCmcdRequestKey.ts'
import { isCmcdResponseReceivedKey } from './isCmcdResponseReceivedKey.ts'
import { isCmcdV1Key } from './isCmcdV1Key.ts'
import { isTokenField } from './isTokenField.ts'
import { isValid } from './isValid.ts'

const filterMap: Record<string, (key: string) => boolean> = {
	[CMCD_EVENT_MODE]: isCmcdEventKey,
	[CMCD_REQUEST_MODE]: isCmcdRequestKey,
}

/**
 * V1 keys that use inner lists in V2 but plain numbers in V1.
 */
const INNER_LIST_V1_KEYS = new Set(['br', 'bl', 'dl', 'mtp', 'rtp', 'tb'])

/**
 * Unwrap an inner list or SfItem value to a plain scalar.
 */
function unwrapValue(value: any): any {
	if (Array.isArray(value)) {
		return unwrapValue(value[0])
	}
	if (value instanceof SfItem) {
		return value.value
	}
	return value
}

/**
 * Down-convert V2 CMCD data to V1 format.
 *
 * - Extracts `nrr` from `nor` SfItem `r` parameter.
 * - Unwraps inner-list values to plain scalars.
 */
function downConvertToV1(obj: Record<string, any>): Record<string, any> {
	const result: Record<string, any> = {}

	for (const [key, value] of Object.entries(obj)) {
		if (value == null) {
			result[key] = value
			continue
		}

		if (key === 'nor') {
			const items = Array.isArray(value) ? value : [value]
			const first = items[0]

			if (first instanceof SfItem) {
				result['nor'] = first.value
				if (first.params?.r) {
					result['nrr'] = first.params.r
				}
			} else {
				result['nor'] = first
			}
		} else if (INNER_LIST_V1_KEYS.has(key)) {
			result[key] = unwrapValue(value)
		} else {
			result[key] = value
		}
	}

	return result
}

/**
 * Convert a generic object to CMCD data.
 *
 * @param obj - The CMCD object to process.
 * @param options - Options for encoding.
 *
 * @public
 */
export function prepareCmcdData(obj: Record<string, any>, options: CmcdEncodeOptions = {}): Cmcd {
	const results: Cmcd = {}

	if (obj == null || typeof obj !== 'object') {
		return results
	}

	const version = options.version || (obj['v'] as number) || CMCD_V2
	const reportingMode = options.reportingMode || CMCD_REQUEST_MODE

	// Down-convert V2 data to V1 format if needed
	const data = version === 1 ? downConvertToV1(obj) : obj

	const keyFilter = version === 1 ? isCmcdV1Key : filterMap[reportingMode]

	// Filter keys based on the version, reporting mode and options
	let keys = Object.keys(data).filter(keyFilter) as CmcdKey[]

	if (data['e'] && data['e'] !== 'rr') {
		keys = keys.filter(key => !isCmcdResponseReceivedKey(key))
	}

	const filter = options.filter
	if (typeof filter === 'function') {
		keys = keys.filter(filter)
	}

	if (keys.length === 0) {
		return results
	}

	// Ensure all required event keys are present before sorting
	const needsTimestamp = reportingMode === CMCD_EVENT_MODE

	if (needsTimestamp) {
		if (!keys.includes('e') && data['e'] != null) {
			keys.push('e')
		}

		if (!keys.includes('ts')) {
			keys.push('ts')
		}

		if (!keys.includes('cen') && data['cen'] != null) {
			keys.push('cen')
		}
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
		let value = data[key] as CmcdValue

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
