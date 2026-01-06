import { IsoBoxReadableStream } from './IsoBoxReadableStream.ts'
import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import type { IsoBoxWriteViewConfig } from './IsoBoxWriteViewConfig.ts'

/**
 * Creates a ReadableStream of ISO BMFF boxes as Uint8Arrays.
 *
 * @param boxes - The boxes to stream.
 * @param config - The configuration for the stream.
 *
 * @returns A new IsoBoxReadableStream.
 *
 * @example
 * {@includeCode ../test/createIsoBoxReadableStream.test.ts#example}
 *
 * @public
 */
export function createIsoBoxReadableStream(boxes: Iterable<IsoBoxStreamable>, config: IsoBoxWriteViewConfig = {}): ReadableStream<Uint8Array> {
	return new IsoBoxReadableStream(boxes, config)
}
