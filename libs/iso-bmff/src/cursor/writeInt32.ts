import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { failInteger } from './failInteger.ts'
import { reserve } from './reserve.ts'

/**
 * Writes a signed integer of 4 bytes.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the field.
 * @param value - The value to write.
 *
 * @throws RangeError if `value` is not an integer from -2147483648 to 2147483647. The cursor does not move.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#example}
 *
 * @public
 */
export function writeInt32(cursor: IsoBoxWriteCursor, value: number): void {
	if (typeof value !== 'number' || (value | 0) !== value) {
		failInteger('writeInt32: value', value, -0x80000000, 0x7fffffff)
	}

	const pos = reserve(cursor, 4)

	cursor.view.setInt32(pos, value)
}
