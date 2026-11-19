import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUtf8 } from './readUtf8.ts'

/**
 * Reads UTF-8 text that ends at a null byte.
 *
 * The function reads to the first null byte and moves the cursor past that byte.
 * With no null byte, the function reads to `cursor.end` and throws no error.
 *
 * @param cursor - The cursor to read from.
 * @returns The text, with no null byte.
 *
 * @example
 * {@includeCode ../../test/readFields.test.ts#readTerminatedUtf8}
 *
 * @public
 */
export function readTerminatedUtf8(cursor: IsoBoxReadCursor<IsoInt64>): string {
	const { view, pos, end } = cursor
	let i = pos

	while (i < end && view.getUint8(i)) {
		i++
	}

	const text = readUtf8(cursor, i - pos)

	if (i < end) {
		cursor.pos++
	}

	return text
}
