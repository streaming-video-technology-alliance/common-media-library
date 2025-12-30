import type { IsoBoxReadableStreamConfig } from './IsoBoxReadableStreamConfig.ts'
import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import { writeIsoBox } from './writeIsoBox.ts'

/**
 * A readable stream of ISO BMFF boxes as Uint8Arrays.
 *
 * @public
 */
export class IsoBoxReadableStream extends ReadableStream<Uint8Array> {
	/**
	 * Constructs a new IsoBoxReadableStream.
	 *
	 * @param boxes - The boxes to stream.
	 * @param config - The configuration for the stream.
	 */
	constructor(boxes: IsoBoxStreamable[], config: IsoBoxReadableStreamConfig = {}) {
		const iterator = boxes[Symbol.iterator]()
		const { writers = {} } = config

		function pull(controller: ReadableStreamDefaultController<Uint8Array>) {
			const desiredSize = controller.desiredSize ?? 0

			for (let i = 0; i < desiredSize; i++) {
				const { value, done } = iterator.next()

				if (done) {
					controller.close()
				} else {
					controller.enqueue(writeIsoBox(value, writers))
				}
			}
		}

		super({ start: pull, pull })
	}
}
