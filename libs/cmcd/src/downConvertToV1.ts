import { SfItem } from '@svta/cml-structured-field-values'
import { CMCD_INNER_LIST_KEYS } from './CMCD_INNER_LIST_KEYS.ts'

function hasParams(params: object | undefined): boolean {
	for (const _ in params) {
		return true
	}

	return false
}

/**
 * Unwrap an inner list or SfItem value to a scalar.
 *
 * The scalar is the value of the item with the object type flag of `ot`
 * (CTA-5004-B section 4.1, item 14). Without that item, it is the value
 * of the first item without parameters. Otherwise it is `undefined`.
 */
function unwrapValue(value: unknown, ot: string | undefined): unknown {
	if (value instanceof SfItem) {
		value = value.value
	}

	if (!Array.isArray(value)) {
		return value
	}

	let fallback: unknown

	for (const item of value) {
		if (!(item instanceof SfItem)) {
			if (fallback === undefined) {
				fallback = item
			}
			continue
		}

		if (ot && item.params?.[ot] === true) {
			return item.value
		}

		if (fallback === undefined && !hasParams(item.params)) {
			fallback = item.value
		}
	}

	return fallback
}

/**
 * Down-convert version 2 CMCD data to version 1.
 *
 * - Extracts `nrr` from the `nor` SfItem's `r` parameter.
 * - Unwraps inner-list values to scalars for the object type `ot`.
 *
 * @internal
 */
export function downConvertToV1(obj: Record<string, any>, ot: string | undefined): Record<string, any> {
	const result: Record<string, any> = {}

	for (const [key, value] of Object.entries(obj)) {
		if (value == null) {
			result[key] = value
			continue
		}

		if (key === 'nor') {
			const list = value instanceof SfItem && Array.isArray(value.value) ? value.value : value
			const first = Array.isArray(list) ? list[0] : list

			if (first instanceof SfItem) {
				result['nor'] = first.value
				if (first.params?.r) {
					result['nrr'] = first.params.r
				}
			}
			else {
				result['nor'] = first
			}
		}
		else if (CMCD_INNER_LIST_KEYS.has(key)) {
			result[key] = unwrapValue(value, ot)
		}
		else {
			result[key] = value
		}
	}

	return result
}
