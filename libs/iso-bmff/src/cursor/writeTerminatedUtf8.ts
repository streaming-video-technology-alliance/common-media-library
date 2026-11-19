import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeUint8 } from './writeUint8.ts'
import { writeUtf8 } from './writeUtf8.ts'

/**
 * Writes text as UTF-8, then one null byte.
 *
 * The function writes the text up to the first U+0000, so a read with `readTerminatedUtf8` returns the same text.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the null byte.
 * @param value - The text to write.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#writeTerminatedUtf8}
 *
 * @public
 */
export function writeTerminatedUtf8(cursor: IsoBoxWriteCursor, value: string): void {
	const end = value.indexOf('\0')

	writeUtf8(cursor, end < 0 ? value : value.slice(0, end))
	writeUint8(cursor, 0)
}
