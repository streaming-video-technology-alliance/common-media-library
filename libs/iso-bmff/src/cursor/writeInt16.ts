import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { failInteger } from './failInteger.ts'
import { reserve } from './reserve.ts'

/**
 * Writes a signed integer of 2 bytes.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the field.
 * @param value - The value to write.
 *
 * @throws RangeError if `value` is not an integer from -32768 to 32767. The cursor does not move.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#example}
 *
 * @public
 */
export function writeInt16(cursor: IsoBoxWriteCursor, value: number): void {
	if (typeof value !== 'number' || (value << 16) >> 16 !== value) {
		failInteger('writeInt16: value', value, -0x8000, 0x7fff)
	}

	const pos = reserve(cursor, 2)

	cursor.view.setInt16(pos, value)
}
