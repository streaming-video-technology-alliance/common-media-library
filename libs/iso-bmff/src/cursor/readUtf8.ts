import { decodeUtf8 } from '@svta/cml-utils'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { readBytes } from './readBytes.ts'

/**
 * Reads UTF-8 text of a number of bytes, with no terminator.
 *
 * The function decodes every byte of the length, null bytes included.
 * The result for bytes that are not valid UTF-8 depends on the environment.
 *
 * @param cursor - The cursor to read from. The function moves the cursor past the bytes.
 * @param length - The number of bytes. A length of 0 reads an empty string.
 * @returns The text.
 *
 * @throws RangeError if `length` is negative or the bytes pass `cursor.end`.
 *
 * @example
 * {@includeCode ../../test/readFields.test.ts#readUtf8}
 *
 * @public
 */
export function readUtf8(cursor: IsoBoxReadCursor, length: number): string {
	const bytes = readBytes(cursor, length)

	return length ? decodeUtf8(bytes) : ''
}
