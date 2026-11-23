import { writeFourCc } from './cursor/writeFourCc.ts'
import { writeUint32 } from './cursor/writeUint32.ts'
import type { IsoBoxWriteCursor } from './IsoBoxWriteCursor.ts'

/**
 * Writes a box header with no size. `endIsoBox` writes the size.
 *
 * A writer for a `uuid` box then writes the 16 bytes of `usertype` with `writeBytes`.
 *
 * @param cursor - The cursor to write to.
 * @param type - The four-character code of the box.
 * @returns The position of the first byte of the box. Pass it to `endIsoBox`.
 *
 * @throws RangeError if `type` does not have 4 characters of 1 byte each.
 *
 * @example
 * {@includeCode ../test/beginIsoBox.test.ts#example}
 *
 * @public
 */
export function beginIsoBox(cursor: IsoBoxWriteCursor, type: string): number {
	const start = cursor.pos

	writeUint32(cursor, 0)
	writeFourCc(cursor, type)

	return start
}
