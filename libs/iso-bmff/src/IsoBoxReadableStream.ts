import type { IsoBoxReadableStreamConfig } from './IsoBoxReadableStreamConfig.ts'
import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import { writeIsoBox } from './writeIsoBox.ts'

export class IsoBoxReadableStream extends ReadableStream<Uint8Array> {
	constructor(boxes: IsoBoxStreamable[], config: IsoBoxReadableStreamConfig) {
		super({
			start(controller) {
				const { writers } = config

				for (const box of boxes) {
					controller.enqueue(writeIsoBox(box, writers))
				}

				controller.close()
			}
		})
	}
}
