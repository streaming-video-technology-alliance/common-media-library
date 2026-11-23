import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { failInteger } from './failInteger.ts'
import { reserve } from './reserve.ts'

/**
 * Writes an unsigned integer of 2 bytes.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the field.
 * @param value - The value to write.
 *
 * @throws RangeError if `value` is not an integer from 0 to 65535. The cursor does not move.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#example}
 *
 * @public
 */
export function writeUint16(cursor: IsoBoxWriteCursor, value: number): void {
	if (typeof value !== 'number' || (value & 0xffff) !== value) {
		failInteger('writeUint16: value', value, 0, 0xffff)
	}

	const pos = reserve(cursor, 2)

	cursor.view.setUint16(pos, value)
}
