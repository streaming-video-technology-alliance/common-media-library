import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { take } from './take.ts'

/**
 * Reads an unsigned fixed-point value of 4 bytes (16.16): 2 bytes for the integer part and 2 bytes for the fraction.
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
export function readTemplate32(cursor: IsoBoxReadCursor<IsoInt64>): number {
	return cursor.view.getUint32(take(cursor, 4)) / 0x10000
}
