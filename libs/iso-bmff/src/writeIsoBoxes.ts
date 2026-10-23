import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import type { IsoBoxWriteViewConfig } from './IsoBoxWriteViewConfig.ts'
import { createWriterConfig } from './utils/createWriterConfig.ts'
import { writeBoxes } from './utils/writeBoxes.ts'

/**
 * Writes ISO boxes to an array of `Uint8Array`, one per box.
 *
 * @param boxes - The boxes to write
 * @param config - The configuration for the writer
 *
 * @returns The written boxes. A box given as a view over a `SharedArrayBuffer` is copied, so each result is backed by an `ArrayBuffer`.
 *
 * @example
 * {@includeCode ../test/writeIsoBoxes.test.ts#example}
 *
 * @public
 */
export function writeIsoBoxes(
	boxes: Iterable<IsoBoxStreamable>,
	config: IsoBoxWriteViewConfig,
): Uint8Array<ArrayBuffer>[] {
	return writeBoxes(boxes, createWriterConfig(config))
}
