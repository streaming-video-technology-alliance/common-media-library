import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readWideNumber } from './readWideNumber.ts'

/**
 * Reads a signed integer field of 4 or 8 bytes. The field is 64 bits in one version of its box.
 *
 * With no `int64` function on the cursor, the function returns a `number`.
 * A field of 8 bytes then loses precision outside the safe integer range.
 * With the function, the result is the result of the `int64` function.
 *
 * @param cursor - The cursor to read from. The function moves the cursor past the field.
 * @param size - The size of the field in bytes.
 * @returns The value of the field.
 *
 * @throws RangeError if the field passes `cursor.end`.
 *
 * @example
 * {@includeCode ../../test/readWideUint.test.ts#example}
 *
 * @public
 */
export function readWideInt<V extends IsoInt64 = number>(
	cursor: IsoBoxReadCursor<V>,
	size: 4 | 8,
): V {
	const { int64 } = cursor

	return int64 ? int64(cursor, size, true) : (readWideNumber(cursor, size, true) as V)
}
