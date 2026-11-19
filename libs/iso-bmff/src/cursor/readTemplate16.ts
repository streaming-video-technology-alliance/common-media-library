import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { take } from './take.ts'

/**
 * Reads an unsigned fixed-point value of 2 bytes (8.8): 1 byte for the integer part and 1 byte for the fraction.
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
export function readTemplate16(cursor: IsoBoxReadCursor<IsoInt64>): number {
	return cursor.view.getUint16(take(cursor, 2)) / 0x100
}
