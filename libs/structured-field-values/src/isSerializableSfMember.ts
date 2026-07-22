import type { SfInnerList } from './SfInnerList.ts'
import { SfItem } from './SfItem.ts'
import { serializeInnerList } from './serialize/serializeInnerList.ts'
import { serializeItem } from './serialize/serializeItem.ts'

/**
 * Checks if a value can be serialized as a structured field dictionary or
 * list member — an item or an inner list — without failing. Bare values are
 * wrapped the way `encodeSfDict` wraps members: arrays become inner lists
 * and everything else becomes an item.
 *
 * Serialization fails per RFC 8941 for values such as strings containing
 * control characters, integers outside ±999,999,999,999,999, tokens with
 * characters outside the token grammar, and unsupported object types —
 * including such values nested inside inner lists or parameters.
 *
 * @param value - The value to check.
 *
 * @returns `true` if the value is serializable.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/isSerializableSfMember.test.ts#example}
 */
export function isSerializableSfMember(value: unknown): boolean {
	try {
		const item = value instanceof SfItem ? value : new SfItem(value)

		if (Array.isArray(item.value)) {
			serializeInnerList(item as SfInnerList)
		}
		else {
			serializeItem(item)
		}

		return true
	}
	catch {
		return false
	}
}
