import { CMCD_INNER_LIST_KEYS } from './CMCD_INNER_LIST_KEYS.ts'
import { CMCD_V2 } from './CMCD_V2.ts'

/**
 * Up-convert version 1 CMCD data to version 2.
 *
 * - Wraps scalar values in arrays for inner-list keys.
 * - Wraps `nor` string in an array.
 *
 * The function returns version 2 data (has `v: 2`) unchanged.
 *
 * @internal
 */
export function upConvertToV2(obj: Record<string, any>): Record<string, any> {
	if (obj['v'] === CMCD_V2) {
		return obj
	}

	const result: Record<string, any> = {}

	for (const [key, value] of Object.entries(obj)) {
		if (value == null) {
			result[key] = value
			continue
		}

		if (CMCD_INNER_LIST_KEYS.has(key) && !Array.isArray(value)) {
			result[key] = [value]
		}
		else if (key === 'nor' && typeof value === 'string') {
			result[key] = [value]
		}
		else {
			result[key] = value
		}
	}

	return result
}
