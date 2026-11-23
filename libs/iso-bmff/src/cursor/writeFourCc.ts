import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { reserve } from './reserve.ts'

const WIDE_CHARACTER = /[\u0100-\uffff]/

/**
 * Writes a four-character code of 4 bytes, such as a box type or a brand.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the code.
 * @param value - The code. Each character is one byte.
 *
 * @throws RangeError if `value` does not have 4 characters, or a character is above U+00FF. The cursor does not move.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#example}
 *
 * @public
 */
export function writeFourCc(cursor: IsoBoxWriteCursor, value: string): void {
	if (typeof value !== 'string' || value.length !== 4 || WIDE_CHARACTER.test(value)) {
		throw new RangeError(
			`A four-character code must have 4 characters of 1 byte each, received "${String(value)}"`,
		)
	}

	const pos = reserve(cursor, 4)

	for (let i = 0; i < 4; i++) {
		cursor.view.setUint8(pos + i, value.charCodeAt(i))
	}
}
