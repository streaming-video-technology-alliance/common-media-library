import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import type { IsoBoxWriteViewConfig } from './IsoBoxWriteViewConfig.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import { writeIsoBox } from './writeIsoBox.ts'

/**
 * Creates a ReadableStream of ISO BMFF boxes as Uint8Arrays.
 *
 * The function reads the global `ReadableStream` when it is called, so a polyfill that the caller installs after the import works.
 * An error of a writer reaches the caller for the first box, and the consumer of the stream for a later box.
 *
 * @param boxes - The boxes to stream.
 * @param config - The optional configuration with the writers. With no writers, the function writes only containers, byte arrays, and boxes with a `view`.
 *
 * @returns A new `ReadableStream` with one chunk for each box.
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
	config: IsoBoxWriteViewConfig = {},
): ReadableStream<Uint8Array> {
	if (typeof ReadableStream === 'undefined') {
		throw new Error('ReadableStream is not available in this environment')
	}

	const iterator = boxes[Symbol.iterator]()

	function pull(controller: ReadableStreamDefaultController<Uint8Array>): void {
		const next = iterator.next()

		if (next.done) {
			controller.close()
		} else {
			controller.enqueue(writeIsoBox(next.value, config))
		}
	}

	function cancel(): void {
		iterator.return?.()
	}

	return new ReadableStream<Uint8Array>({ start: pull, pull, cancel })
}
