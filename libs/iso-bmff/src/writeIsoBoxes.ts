import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import type { IsoBoxWriteViewConfig } from './IsoBoxWriteViewConfig.ts'
import { createWriterConfig } from './utils/createWriterConfig.ts'
import { writeBoxes } from './utils/writeBoxes.ts'

/**
 * Writes ISO boxes to a readable stream.
 *
 * @param boxes - The boxes to write
 * @param config - The configuration for the readable stream
 *
 * @returns A readable stream of the written boxes
 *
 * @example
 * {@includeCode ../test/writeIsoBoxes.test.ts#example}
 *
 * @public
 */
export function writeIsoBoxes(boxes: Iterable<IsoBoxStreamable>, config?: IsoBoxWriteViewConfig): Uint8Array[] {
	return writeBoxes(boxes, createWriterConfig(config))
}
