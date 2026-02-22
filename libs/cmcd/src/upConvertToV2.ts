import { CMCD_INNER_LIST_KEYS } from './CMCD_INNER_LIST_KEYS.ts'
import { CMCD_V2 } from './CMCD_V2.ts'

/**
 * Up-convert V1 CMCD data to V2 format.
 *
 * - Wraps plain scalar values in arrays for inner-list keys.
 * - Wraps `nor` string in an array.
 *
 * If the data is already V2 (has `v: 2`), it is returned unchanged.
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
