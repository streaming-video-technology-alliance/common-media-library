import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { failInteger } from './failInteger.ts'
import { reserve } from './reserve.ts'

/**
 * Writes an unsigned integer of 1 byte.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the field.
 * @param value - The value to write.
 *
 * @throws RangeError if `value` is not an integer from 0 to 255. The cursor does not move.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#example}
 *
 * @public
 */
export function writeUint8(cursor: IsoBoxWriteCursor, value: number): void {
	if (typeof value !== 'number' || (value & 0xff) !== value) {
		failInteger('writeUint8: value', value, 0, 0xff)
	}

	const pos = reserve(cursor, 1)

	cursor.view.setUint8(pos, value)
}
