import { encodeText } from '@svta/cml-utils'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { failRange } from './failRange.ts'
import { writeBytes } from './writeBytes.ts'

/**
 * Writes text as UTF-8, with no terminator.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the bytes.
 * @param value - The text to write.
 *
 * @throws RangeError if `value` is not a string. The cursor does not move.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#writeTerminatedUtf8}
 *
 * @public
 */
export function writeUtf8(cursor: IsoBoxWriteCursor, value: string): void {
	if (typeof value !== 'string') {
		failRange('writeUtf8: value', 'a string', value)
	}

	writeBytes(cursor, encodeText(value))
}
