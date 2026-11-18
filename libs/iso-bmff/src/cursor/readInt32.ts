import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { take } from './take.ts'

/**
 * Reads a signed integer of 4 bytes.
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
export function readInt32(cursor: IsoBoxReadCursor): number {
	return cursor.view.getInt32(take(cursor, 4))
}
