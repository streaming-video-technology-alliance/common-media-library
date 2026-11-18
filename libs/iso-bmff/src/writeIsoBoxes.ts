import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { IsoBoxWriteViewConfig } from './IsoBoxWriteViewConfig.ts'
import { writeBoxes } from './utils/writeBoxes.ts'

/**
 * Writes ISO boxes to an array of `Uint8Array`, one per box.
 *
 * @param boxes - The boxes to write
 * @param config - The optional configuration with the writers. With no writers, the function writes only containers, byte arrays, and boxes with a `view`.
 *
 * @returns The written boxes. A box given as a view over a `SharedArrayBuffer` is copied, so each result is backed by an `ArrayBuffer`.
 *
 * @throws Error if a box has no writer, no `boxes` field of a container, and no `view`. The message starts with "No writer found for box type".
 * @throws RangeError if a `bigint` field does not fit its size.
 *
 * @example
 * {@includeCode ../test/writeIsoBoxes.test.ts#example}
 *
 * @public
 */
export function writeIsoBoxes(
	boxes: Iterable<IsoBoxStreamable<IsoInt64>>,
	config: IsoBoxWriteViewConfig = {},
): Uint8Array<ArrayBuffer>[] {
	return writeBoxes(boxes, config)
}
