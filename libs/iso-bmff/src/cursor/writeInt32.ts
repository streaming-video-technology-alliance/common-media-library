import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { reserve } from './reserve.ts'

/**
 * Writes a signed integer of 4 bytes.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the field.
 * @param value - The value to write.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#example}
 *
 * @public
 */
export function writeInt32(cursor: IsoBoxWriteCursor, value: number): void {
	const pos = reserve(cursor, 4)

	cursor.view.setInt32(pos, value)
}
