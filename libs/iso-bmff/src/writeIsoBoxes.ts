import type { IsoBoxReadableStreamConfig } from './IsoBoxReadableStreamConfig.ts'
import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import { writeIsoBox } from './writeIsoBox.ts'

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
export function writeIsoBoxes(boxes: Iterable<IsoBoxStreamable>, config?: IsoBoxReadableStreamConfig): Uint8Array[] {
	const { writers = {} } = config ?? {}
	return Array.from(boxes, box => writeIsoBox(box, writers))
}
