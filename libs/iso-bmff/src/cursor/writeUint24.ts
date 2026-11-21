import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { reserve } from './reserve.ts'

/**
 * Writes an unsigned integer of 3 bytes, such as the `flags` of a full box.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the field.
 * @param value - The value to write.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#example}
 *
 * @public
 */
export function writeUint24(cursor: IsoBoxWriteCursor, value: number): void {
	const pos = reserve(cursor, 3)

	cursor.view.setUint16(pos, value >> 8)
	cursor.view.setUint8(pos + 2, value)
}
