import { IsoBoxReadableStream } from './IsoBoxReadableStream.ts'
import type { IsoBoxReadableStreamConfig } from './IsoBoxReadableStreamConfig.ts'
import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'

/**
 * Writes ISO boxes to a readable stream.
 *
 * @param boxes - The boxes to write
 * @param config - The configuration for the readable stream
 *
 * @returns A readable stream of the written boxes
 *
 * @public
 */
export function writeIsoBoxes(boxes: IsoBoxStreamable[], config: IsoBoxReadableStreamConfig): IsoBoxReadableStream {
	return new IsoBoxReadableStream(boxes, config)
}
