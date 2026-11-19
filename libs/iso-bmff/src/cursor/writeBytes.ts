import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { reserve } from './reserve.ts'

/**
 * Writes a number of bytes.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the bytes.
 * @param data - The bytes to write, such as a `Uint8Array` or an array of numbers.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#writeBytes}
 *
 * @public
 */
export function writeBytes(cursor: IsoBoxWriteCursor, data: ArrayLike<number>): void {
	const pos = reserve(cursor, data.length)

	cursor.bytes.set(data, pos)
}
