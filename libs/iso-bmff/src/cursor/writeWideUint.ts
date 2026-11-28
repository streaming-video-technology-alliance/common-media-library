import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { checkInteger } from './checkInteger.ts'
import { writeUint32 } from './writeUint32.ts'
import { writeUint64 } from './writeUint64.ts'

/**
 * Writes an unsigned integer field of 4 or 8 bytes from a `number` or a `bigint`.
 *
 * Use this function for a field that is 64 bits in one version of its box.
 * A `number` of 8 bytes loses precision above 2^53 - 1.
 * For the `number` 2^64, the function writes all bits set. A read of a field with all bits set returns that `number`.
 * The function writes a `bigint` with the exact value. For a `bigint` of 8 bytes, it needs the `setBigUint64` method of `DataView`.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the field.
 * @param value - The value to write.
 * @param size - The size of the field in bytes.
 *
 * @throws RangeError if `value` is a `bigint` that is negative or does not fit in `size` bytes. The cursor does not move.
 * @throws RangeError if `value` is a `number` that is not an integer from 0 to 2^32 - 1 for 4 bytes, or from 0 to 2^64 for 8 bytes. The cursor does not move.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#example}
 *
 * @public
 */
export function writeWideUint(
	cursor: IsoBoxWriteCursor,
	value: number | bigint,
	size: 4 | 8,
): void {
	if (typeof value === 'bigint') {
		if (size === 8) {
			writeUint64(cursor, value)
			return
		}

		if (BigInt.asUintN(32, value) !== value) {
			throw new RangeError(
				`writeWideUint: value must be in the range 0 to 2^32 - 1, received ${value}`,
			)
		}

		value = Number(value)
	} else if (size === 8) {
		checkInteger('writeWideUint: value', value, 0, 2 ** 64)

		let high = Math.floor(value / 0x100000000)
		let low = value - high * 0x100000000

		if (high > 0xffffffff) {
			high = low = 0xffffffff
		}

		writeUint32(cursor, high)
		value = low
	}

	writeUint32(cursor, value)
}
