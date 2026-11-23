import type { IsoBoxReadCursorState } from './cursor/IsoBoxReadCursorState.ts'
import { decodeFourCc } from './cursor/decodeFourCc.ts'
import { readIsoBoxHeader } from './cursor/readIsoBoxHeader.ts'
import type { IsoBoxReadCursor } from './IsoBoxReadCursor.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { IsoRawBox } from './IsoRawBox.ts'
import type { ParsedIsoBox } from './ParsedIsoBox.ts'
import { CONTAINERS } from './utils/CONTAINERS.ts'

const CONTAINER_SET: ReadonlySet<string> = /* @__PURE__ */ new Set(CONTAINERS)

/**
 * Reads the boxes from the position of a cursor to its end.
 *
 * For each box, the function calls the reader of `cursor.readers` with the cursor at the first byte after the box header.
 * For a `uuid` box, the position is the first byte of `usertype`.
 * After the reader, the function moves the cursor to the end of the box, so a reader can stop before the end of its box.
 * A box with no reader and a type in `CONTAINERS` gets its child boxes in `boxes`. Any other box with no reader is a raw box.
 *
 * The function stops before a truncated box: the data ends inside the box, or the size is below the header size.
 * The position of the cursor is then the first byte of that box.
 * The function does not catch an error of a reader. After an error, the position of the cursor is the first byte of the box that failed,
 * and `start` and `end` do not change.
 *
 * @param cursor - The cursor at the first byte of the first box.
 * @param count - The maximum number of boxes. With no count, the function reads every box to `cursor.end`.
 * @returns The boxes.
 *
 * @throws RangeError if `count` is negative or `NaN`.
 * @throws RangeError if a box is deeper than 128 levels. The message has the box type and the limit.
 *
 * @example
 * {@includeCode ../test/readChildBoxes.test.ts#example}
 *
 * @public
 */
export function readChildBoxes<V extends IsoInt64 = number>(
	cursor: IsoBoxReadCursor<V>,
	count?: number,
): ParsedIsoBox<V>[] {
	const state = cursor as IsoBoxReadCursorState
	const { view, start, end, readers } = state
	const depth = state.depth || 0
	const max = count ?? Infinity
	const boxes: ParsedIsoBox<V>[] = []

	if (!(max >= 0)) {
		throw new RangeError(`readChildBoxes: count must be 0 or more, received ${count}`)
	}

	while (boxes.length < max) {
		const boxStart = state.pos
		const size = readIsoBoxHeader(state, boxStart)

		if (!size) {
			break
		}

		const boxEnd = boxStart + size
		const header = view.getUint32(boxStart) === 1 ? 16 : 8

		const type = decodeFourCc(view, boxStart + 4)
		const reader = readers?.[type] || readers?.[type.trim()] // url and urn boxes have a trailing space in their type field
		let box: ParsedIsoBox<V>

		try {
			if (depth >= 128) {
				throw new RangeError(`The box ${type} is deeper than the limit of 128 levels`)
			}

			state.pos = boxStart + header
			state.start = boxStart
			state.end = boxEnd
			state.depth = depth + 1

			if (reader) {
				box = reader(state, type) as ParsedIsoBox<V>
			} else if (CONTAINER_SET.has(type)) {
				box = { type, boxes: readChildBoxes(state) } as ParsedIsoBox<V>
			} else {
				const bytes = new Uint8Array(view.buffer, view.byteOffset + boxStart, size)
				const raw: IsoRawBox = { boxType: type, bytes, headerSize: header }

				if (type === 'uuid') {
					raw.headerSize = header + 16
					raw.usertype = bytes.subarray(header, header + 16)
				}

				box = raw
			}
		} finally {
			state.pos = boxStart
			state.start = start
			state.end = end
			state.depth = depth
		}

		state.pos = boxEnd
		boxes.push(box)
	}

	return boxes
}
