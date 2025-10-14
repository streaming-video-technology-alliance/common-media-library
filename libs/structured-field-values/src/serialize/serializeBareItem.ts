import { SfToken } from '../SfToken.ts'
import { BARE_ITEM } from '../utils/BARE_ITEM.ts'
import { serializeBoolean } from './serializeBoolean.ts'
import { serializeByteSequence } from './serializeByteSequence.ts'
import { serializeDate } from './serializeDate.ts'
import { serializeDecimal } from './serializeDecimal.ts'
import { serializeError } from './serializeError.ts'
import { serializeInteger } from './serializeInteger.ts'
import { serializeString } from './serializeString.ts'
import { serializeToken } from './serializeToken.ts'

// 4.1.3.1.  Serializing a Bare Item
//
// Given an Item as input_item, return an ASCII string suitable for use
// in a HTTP field value.
//
// 1.  If input_item is an Integer, return the result of running
//     Serializing an Integer (Section 4.1.4) with input_item.
//
// 2.  If input_item is a Decimal, return the result of running
//     Serializing a Decimal (Section 4.1.5) with input_item.
//
// 3.  If input_item is a String, return the result of running
//     Serializing a String (Section 4.1.6) with input_item.
//
// 4.  If input_item is a Token, return the result of running
//     Serializing a Token (Section 4.1.7) with input_item.
//
// 5.  If input_item is a Boolean, return the result of running
//     Serializing a Boolean (Section 4.1.9) with input_item.
//
// 6.  If input_item is a Byte Sequence, return the result of running
//     Serializing a Byte Sequence (Section 4.1.8) with input_item.
//
// 7.  If input_item is a Date, return the result of running Serializing
//     a Date (Section 4.1.10) with input_item.
//
// 8.  Otherwise, fail serialization.
/**
 * @internal
 */
export function serializeBareItem(value: any): string {
	switch (typeof value) {
		case 'number':
			if (!Number.isFinite(value)) {
				throw serializeError(value, BARE_ITEM)
			}

			if (Number.isInteger(value)) {
				return serializeInteger(value)
			}
			return serializeDecimal(value)
		case 'string':
			return serializeString(value)
		case 'symbol':
			return serializeToken(value)
		case 'boolean':
			return serializeBoolean(value)
		case 'object':
			if (value instanceof Date) {
				return serializeDate(value)
			}
			if (value instanceof Uint8Array) {
				return serializeByteSequence(value)
			}
			if (value instanceof SfToken) {
				return serializeToken(value)
			}
		default:
			// fail
			throw serializeError(value, BARE_ITEM)
	}
}
