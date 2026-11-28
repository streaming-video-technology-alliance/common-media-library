import { writeBytes } from './cursor/writeBytes.ts'
import type { IsoBoxContainer } from './IsoBoxContainer.ts'
import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import type { IsoBoxWriter } from './IsoBoxWriter.ts'
import type { IsoBoxWriteCursor } from './IsoBoxWriteCursor.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import { CONTAINERS } from './utils/CONTAINERS.ts'
import { writeContainerBox } from './utils/writeContainerBox.ts'

/**
 * Writes boxes at the position of a write cursor, with the writers of the cursor.
 *
 * The function handles each box in this order:
 *
 * 1. An `ArrayBufferView`: the function copies the bytes.
 * 2. A box with a `bytes` field, such as a raw box of `readIsoBoxes`: the function copies the bytes.
 * 3. A box with a writer in `cursor.writers`: the function calls the writer.
 * 4. A box with a type in `CONTAINERS`: the function writes the header and the `boxes` field.
 * 5. Any other box: the function throws.
 *
 * @param cursor - The write cursor.
 * @param boxes - The boxes to write.
 *
 * @throws Error if a box has no writer, no `bytes` field, and a type outside `CONTAINERS`. The message starts with "No writer found for box type".
 * @throws RangeError if a value of a box does not fit its field. Examples are a number outside the range, a missing value of a field that the flags select, and a list that is longer than its count field can state.
 * @throws RangeError if a box has more than 2^32 - 1 bytes.
 *
 * @example
 * {@includeCode ../test/writeChildBoxes.test.ts#example}
 *
 * @public
 */
export function writeChildBoxes(
	cursor: IsoBoxWriteCursor,
	boxes: Iterable<IsoBoxStreamable>,
): void {
	const map = cursor.writers as Record<string, IsoBoxWriter<never>> | undefined

	for (const box of boxes) {
		if (ArrayBuffer.isView(box)) {
			writeBytes(cursor, new Uint8Array(box.buffer, box.byteOffset, box.byteLength))
			continue
		}

		if ('bytes' in box) {
			writeBytes(cursor, box.bytes)
			continue
		}

		const type: string = box.type
		const writer = map?.[type] || map?.[type.trim()] // url and urn boxes have a trailing space in their type field

		if (writer) {
			writer(cursor, box as never)
		} else if (CONTAINERS.includes(type)) {
			writeContainerBox(cursor, box as IsoBoxContainer<IsoInt64>)
		} else {
			throw new Error(`No writer found for box type: ${type}`)
		}
	}
}
