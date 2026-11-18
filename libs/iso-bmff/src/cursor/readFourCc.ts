import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
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
export function readFourCc(cursor: IsoBoxReadCursor): string {
	const pos = take(cursor, 4)
	const { view } = cursor

	return String.fromCharCode(
		view.getUint8(pos),
		view.getUint8(pos + 1),
		view.getUint8(pos + 2),
		view.getUint8(pos + 3),
	)
}
