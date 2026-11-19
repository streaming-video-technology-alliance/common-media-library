import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { take } from './take.ts'

/**
 * Reads an unsigned integer of 8 bytes as a `bigint`.
 *
 * The function needs the `getBigUint64` method of `DataView`.
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
export function readUint64(cursor: IsoBoxReadCursor<IsoInt64>): bigint {
	return cursor.view.getBigUint64(take(cursor, 8))
}
