import type { IsoBoxReadableStreamConfig } from './IsoBoxReadableStreamConfig.ts'
import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import { boxToBytes } from './writeIsoBox.ts'

export class IsoBoxReadableStream extends ReadableStream<Uint8Array> {
	constructor(boxes: IsoBoxStreamable[], config: IsoBoxReadableStreamConfig) {
		super({
			start(controller) {
				const { writers } = config

				for (const box of boxes) {
					controller.enqueue(boxToBytes(box, writers))
				}

				controller.close()
			}
		})
	}
}
