import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { failInteger } from './failInteger.ts'
import { reserve } from './reserve.ts'

/**
 * Writes an unsigned integer of 4 bytes.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the field.
 * @param value - The value to write.
 *
 * @throws RangeError if `value` is not an integer from 0 to 4294967295. The cursor does not move.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#example}
 *
 * @public
 */
export function writeUint32(cursor: IsoBoxWriteCursor, value: number): void {
	if (typeof value !== 'number' || value >>> 0 !== value) {
		failInteger('writeUint32: value', value, 0, 0xffffffff)
	}

	const pos = reserve(cursor, 4)

	cursor.view.setUint32(pos, value)
}
