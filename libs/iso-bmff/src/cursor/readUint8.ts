import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { take } from './take.ts'

/**
 * Reads an unsigned integer of 1 byte.
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
export function readUint8(cursor: IsoBoxReadCursor<IsoInt64>): number {
	return cursor.view.getUint8(take(cursor, 1))
}
