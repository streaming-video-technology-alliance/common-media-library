import { IsoBoxReadableStream } from './IsoBoxReadableStream.ts'
import type { IsoBoxReadableStreamConfig } from './IsoBoxReadableStreamConfig.ts'
import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'

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
export function createIsoBoxReadableStream(boxes: Iterable<IsoBoxStreamable>, config: IsoBoxReadableStreamConfig = {}): ReadableStream<Uint8Array> {
	return new IsoBoxReadableStream(boxes, config)
}
