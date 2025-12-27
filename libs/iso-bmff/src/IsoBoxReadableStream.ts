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
		super({
			start(controller) {
				const { writers = {} } = config

				for (const box of boxes) {
					controller.enqueue(writeIsoBox(box, writers))
				}

				controller.close()
			}
		})
	}
}
