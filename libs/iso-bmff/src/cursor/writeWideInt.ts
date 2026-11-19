import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { reserve } from './reserve.ts'
import { writeUint32 } from './writeUint32.ts'

/**
 * Writes a signed integer field of 4 or 8 bytes from a `number` or a `bigint`.
 *
 * Use this function for a field that is 64 bits in one version of its box.
 * A `number` of 8 bytes loses precision outside the safe integer range.
 * The function writes a `bigint` with the exact value. For a `bigint` of 8 bytes, it needs the `setBigInt64` method of `DataView`.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the field.
 * @param value - The value to write.
 * @param size - The size of the field in bytes.
 *
 * @throws RangeError if `value` is a `bigint` that does not fit in `size` bytes. The cursor does not move.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#example}
 *
 * @public
 */
export function writeWideInt(cursor: IsoBoxWriteCursor, value: number | bigint, size: 4 | 8): void {
	if (typeof value === 'bigint') {
		if (BigInt.asIntN(size * 8, value) !== value) {
			throw new RangeError(`writeWideInt: value must fit in ${size} bytes, received ${value}`)
		}

		if (size === 8) {
			const pos = reserve(cursor, 8)

			cursor.view.setBigInt64(pos, value)
			return
		}

		value = Number(value)
	} else if (size === 8) {
		const high = Math.floor(value / 0x100000000)

		writeUint32(cursor, high)
		value -= high * 0x100000000
	}

	writeUint32(cursor, value)
}
