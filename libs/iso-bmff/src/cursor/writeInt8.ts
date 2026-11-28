import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { failInteger } from './failInteger.ts'
import { reserve } from './reserve.ts'

/**
 * Writes a signed integer of 1 byte.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the field.
 * @param value - The value to write.
 *
 * @throws RangeError if `value` is not an integer from -128 to 127. The cursor does not move.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#example}
 *
 * @public
 */
export function writeInt8(cursor: IsoBoxWriteCursor, value: number): void {
	if (typeof value !== 'number' || (value << 24) >> 24 !== value) {
		failInteger('writeInt8: value', value, -0x80, 0x7f)
	}

	const pos = reserve(cursor, 1)

	cursor.view.setInt8(pos, value)
}
