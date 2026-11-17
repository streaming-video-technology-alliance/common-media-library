import { IsoBoxReadableStream } from './IsoBoxReadableStream.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import type { IsoBoxWriteViewConfig } from './IsoBoxWriteViewConfig.ts'

/**
 * Creates a ReadableStream of ISO BMFF boxes as Uint8Arrays.
 *
 * The function needs `ReadableStream`.
 * An error of a writer reaches the caller for the first box, and the consumer of the stream for a later box.
 *
 * @param boxes - The boxes to stream.
 * @param config - The configuration for the stream.
 *
 * @returns A new IsoBoxReadableStream.
 *
 * @throws Error if `ReadableStream` is not available in this environment.
 * @throws Error if a box has no writer, no `boxes` field of a container, and no `view`. The message starts with "No writer found for box type".
 * @throws RangeError if a `bigint` field does not fit its size.
 *
 * @example
 * {@includeCode ../test/createIsoBoxReadableStream.test.ts#example}
 *
 * @public
 */
export function createIsoBoxReadableStream(
	boxes: Iterable<IsoBoxStreamable<IsoInt64>>,
	config: IsoBoxWriteViewConfig,
): ReadableStream<Uint8Array> {
	return new IsoBoxReadableStream(boxes, config)
}
