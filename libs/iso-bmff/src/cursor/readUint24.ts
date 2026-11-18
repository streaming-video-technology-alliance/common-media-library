import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { take } from './take.ts'

/**
 * Reads an unsigned integer of 3 bytes, such as the `flags` of a full box.
 *
 * @param cursor - The cursor to read from. The function moves the cursor past the field.
 * @returns The value of the field.
 *
 * @throws RangeError if the field passes `cursor.end`.
 *
 * @example
 * {@includeCode ../../test/readFields.test.ts#example}
 *
 * @public
 */
export function readUint24(cursor: IsoBoxReadCursor): number {
	const pos = take(cursor, 3)

	return (cursor.view.getUint16(pos) << 8) | cursor.view.getUint8(pos + 2)
}
