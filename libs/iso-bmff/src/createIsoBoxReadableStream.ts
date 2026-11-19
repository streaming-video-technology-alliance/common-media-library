import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import type { IsoBoxWriteConfig } from './IsoBoxWriteConfig.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import { writeIsoBox } from './writeIsoBox.ts'

/**
 * Creates a ReadableStream of ISO BMFF boxes as Uint8Arrays.
 *
 * The function reads the global `ReadableStream` at each call. A polyfill that the caller installs after the import works.
 * The stream writes one box for each read, and writes no box before the first read. An error of any box rejects the read.
 *
 * @param boxes - The boxes to stream.
 * @param config - The optional configuration with the writers. With no writers, the function writes only byte arrays, raw boxes, and containers.
 *
 * @returns A new `ReadableStream` with one chunk for each box.
 *
 * @throws Error if `ReadableStream` is not available in this environment.
 *
 * @example
 * {@includeCode ../test/createIsoBoxReadableStream.test.ts#example}
 *
 * @public
 */
export function createIsoBoxReadableStream(
	boxes: Iterable<IsoBoxStreamable<IsoInt64>>,
	config: IsoBoxWriteConfig = {},
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

	return new ReadableStream<Uint8Array>({ pull, cancel }, { highWaterMark: 0 })
}
