import { boxToBytes } from './boxToBytes.ts'
import type { IsoReadableStreamConfig } from './IsoReadableStreamConfig.ts'
import type { IsoStreamable } from './IsoStreamable.ts'

export class IsoReadableStream extends ReadableStream<Uint8Array> {
	constructor(boxes: IsoStreamable[], config: IsoReadableStreamConfig) {
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
