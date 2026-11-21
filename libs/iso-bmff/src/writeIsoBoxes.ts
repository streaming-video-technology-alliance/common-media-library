import { createIsoBoxWriteCursor } from './createIsoBoxWriteCursor.ts'
import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { IsoBoxWriteConfig } from './IsoBoxWriteConfig.ts'
import { writeChildBoxes } from './writeChildBoxes.ts'

/**
 * Writes ISO boxes to one `Uint8Array`.
 *
 * The function writes each box in the order of `writeChildBoxes`.
 * It copies an `ArrayBufferView` or a raw box, then calls a writer, then writes the `boxes` field of a container.
 *
 * @param boxes - The boxes to write
 * @param config - The optional configuration with the writers. With no writers, the function writes only byte arrays, raw boxes, and containers.
 *
 * @returns The bytes of every box, in a new array with the exact size.
 *
 * @throws Error if a box has no writer, no `bytes` field, and a type outside `CONTAINERS`. The message starts with "No writer found for box type".
 * @throws RangeError if a `bigint` field does not fit its size.
 *
 * @example
 * {@includeCode ../test/writeIsoBoxes.test.ts#example}
 *
 * @public
 */
export function writeIsoBoxes(
	boxes: Iterable<IsoBoxStreamable<IsoInt64>>,
	config: IsoBoxWriteConfig = {},
): Uint8Array<ArrayBuffer> {
	const cursor = createIsoBoxWriteCursor(config)

	writeChildBoxes(cursor, boxes)

	return cursor.bytes.slice(0, cursor.pos)
}
