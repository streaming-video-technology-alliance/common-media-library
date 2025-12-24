import type { Box } from '../boxes/Box.ts'
import type { IsoBmffBox } from '../boxes/IsoBmffBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

type IsoStreamable = Box | ArrayBufferView
type IsoReadableStreamConfig = {
	writers: Record<string, (box: Box) => IsoDataWriter>
}

export class IsoReadableStream extends ReadableStream<Uint8Array> {
	constructor(boxes: IsoStreamable[], config: IsoReadableStreamConfig) {
		super({
			start(controller) {
				const { writers } = config

				for (const box of boxes) {
					let type: string | null = null
					let view: ArrayBufferView | null = null

					if ('type' in box) {
						type = box.type
						view = writers[type]?.(box as IsoBmffBox) ?? box.view

						if (!view) {
							throw new Error(`No writer found for box type: ${type}`)
						}
					}

					if ('buffer' in box) {
						view = box
					}

					if (!view) {
						throw new Error('Invalid box')
					}

					const { buffer, byteLength, byteOffset } = view
					controller.enqueue(new Uint8Array(buffer, byteOffset, byteLength))
				}

				controller.close()
			},
		})
	}
}
