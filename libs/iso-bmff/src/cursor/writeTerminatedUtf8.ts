import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { failRange } from './failRange.ts'
import { writeUint8 } from './writeUint8.ts'
import { writeUtf8 } from './writeUtf8.ts'

/**
 * Writes text as UTF-8, then one null byte.
 *
 * A read with `readTerminatedUtf8` stops at the first U+0000, so the text cannot have that character.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the null byte.
 * @param value - The text to write.
 *
 * @throws RangeError if `value` is not a string or has a U+0000. The cursor does not move.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#writeTerminatedUtf8}
 *
 * @public
 */
export function writeTerminatedUtf8(cursor: IsoBoxWriteCursor, value: string): void {
	if (typeof value !== 'string' || value.includes('\0')) {
		failRange('writeTerminatedUtf8: value', 'a string with no U+0000', value)
	}

	writeUtf8(cursor, value)
	writeUint8(cursor, 0)
}
