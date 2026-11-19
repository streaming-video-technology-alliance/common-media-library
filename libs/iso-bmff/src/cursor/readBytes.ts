import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { take } from './take.ts'

/**
 * Reads a number of bytes.
 *
 * The result shares memory with the input. To keep the bytes after the input changes, call `slice()` on the result.
 *
 * @param cursor - The cursor to read from. The function moves the cursor past the bytes.
 * @param length - The number of bytes. A length of 0 reads no bytes.
 * @returns A view of the bytes.
 *
 * @throws RangeError if `length` is negative or the bytes pass `cursor.end`.
 *
 * @example
 * {@includeCode ../../test/readFields.test.ts#readBytes}
 *
 * @public
 */
export function readBytes(cursor: IsoBoxReadCursor<IsoInt64>, length: number): Uint8Array {
	const pos = take(cursor, length)
	const { view } = cursor

	return new Uint8Array(view.buffer, view.byteOffset + pos, length)
}
