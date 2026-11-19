import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { decodeFourCc } from './decodeFourCc.ts'
import { take } from './take.ts'

/**
 * Reads a four-character code of 4 bytes, such as a box type or a brand.
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
export function readFourCc(cursor: IsoBoxReadCursor<IsoInt64>): string {
	return decodeFourCc(cursor.view, take(cursor, 4))
}
