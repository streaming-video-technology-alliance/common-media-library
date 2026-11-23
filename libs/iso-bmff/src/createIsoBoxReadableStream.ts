import type { IsoBoxMap } from './IsoBoxMap.ts'
import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import type { IsoBoxType } from './IsoBoxType.ts'
import type { IsoBoxWriteConfig } from './IsoBoxWriteConfig.ts'
import { createIsoBoxWriteCursor } from './createIsoBoxWriteCursor.ts'
import { writeChildBoxes } from './writeChildBoxes.ts'

/**
 * Creates a ReadableStream of ISO BMFF boxes as Uint8Arrays.
 *
 * The function reads the global `ReadableStream` at each call. A polyfill that the caller installs after the import works.
 * The stream writes one box for each read, and writes no box before the first read. An error of any box rejects the read.
 * The stream writes every box into one buffer. The buffer keeps the size of the largest box until the stream ends.
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
export function createIsoBoxReadableStream<
	B extends { type: keyof IsoBoxMap | (string & Record<never, never>) } | ArrayBufferView,
>(
	boxes: Iterable<IsoBoxStreamable<B>>,
	config?: IsoBoxWriteConfig,
): ReadableStream<Uint8Array<ArrayBuffer>>
export function createIsoBoxReadableStream(
	boxes: Iterable<IsoBoxStreamable | { type: IsoBoxType }>,
	config: IsoBoxWriteConfig = {},
): ReadableStream<Uint8Array<ArrayBuffer>> {
	if (typeof ReadableStream === 'undefined') {
		throw new Error('ReadableStream is not available in this environment')
	}

	const iterator = boxes[Symbol.iterator]()
	const cursor = createIsoBoxWriteCursor(config)

	function pull(controller: ReadableStreamDefaultController<Uint8Array<ArrayBuffer>>): void {
		const next = iterator.next()

		if (next.done) {
			controller.close()
		} else {
			cursor.pos = 0
			writeChildBoxes(cursor, [next.value])
			controller.enqueue(cursor.bytes.slice(0, cursor.pos))
		}
	}

	function cancel(): void {
		iterator.return?.()
	}

	return new ReadableStream<Uint8Array<ArrayBuffer>>({ pull, cancel }, { highWaterMark: 0 })
}
