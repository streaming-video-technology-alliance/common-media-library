import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import type { IsoBoxWriteViewConfig } from './IsoBoxWriteViewConfig.ts'
import { createWriterConfig } from './utils/createWriterConfig.ts'
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
	constructor(boxes: Iterable<IsoBoxStreamable>, config: IsoBoxWriteViewConfig) {
		const iterator = boxes[Symbol.iterator]()
		const cfg = createWriterConfig(config)

		function pull(controller: ReadableStreamDefaultController<Uint8Array>) {
			const desiredSize = controller.desiredSize ?? 0

			for (let i = 0; i < desiredSize; i++) {
				const { value, done } = iterator.next()

				if (done) {
					controller.close()
				} else {
					controller.enqueue(writeIsoBox(value, cfg))
				}
			}
		}

		super({ start: pull, pull })
	}
}
