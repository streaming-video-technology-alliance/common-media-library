import { decodeFourCc } from './cursor/decodeFourCc.ts'
import type { IsoBoxWriteCursor } from './IsoBoxWriteCursor.ts'

/**
 * Writes the size of a box into its header. The size is the number of bytes from `start` to `cursor.pos`.
 *
 * @param cursor - The cursor at the first byte after the box.
 * @param start - The position that `beginIsoBox` or `beginIsoFullBox` returned.
 *
 * @throws RangeError if the box has more than 2^32 - 1 bytes. The message has the box type and the size.
 *
 * @example
 * {@includeCode ../test/beginIsoBox.test.ts#example}
 *
 * @public
 */
export function endIsoBox(cursor: IsoBoxWriteCursor, start: number): void {
	const { view } = cursor
	const size = cursor.pos - start

	if (size > 0xffffffff) {
		throw new RangeError(
			`The box ${decodeFourCc(view, start + 4)} has ${size} bytes, above the limit of 2^32 - 1 bytes`,
		)
	}

	view.setUint32(start, size)
}
