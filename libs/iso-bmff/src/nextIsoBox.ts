import { decodeFourCc } from './cursor/decodeFourCc.ts'
import { readIsoBoxHeader } from './cursor/readIsoBoxHeader.ts'
import type { IsoBoxReadCursor } from './IsoBoxReadCursor.ts'
import type { IsoBoxType } from './IsoBoxType.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * Returns the type of the box at the position of a cursor, and moves the position to the first byte after that box.
 *
 * The function parses no content of the box. The bytes from the old position to the new position are the complete box.
 *
 * @param cursor - The cursor at the first byte of a box.
 * @returns The type of the box. The result is `null` at `cursor.end` and before a truncated box, and the position does not move.
 *
 * @example
 * {@includeCode ../test/nextIsoBox.test.ts#example}
 *
 * @public
 */
export function nextIsoBox(cursor: IsoBoxReadCursor<IsoInt64>): IsoBoxType | null {
	const at = cursor.pos
	const size = readIsoBoxHeader(cursor, at)

	if (!size) {
		return null
	}

	cursor.pos = at + size

	return decodeFourCc(cursor.view, at + 4)
}
