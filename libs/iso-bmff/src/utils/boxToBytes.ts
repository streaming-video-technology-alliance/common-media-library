import type { Box } from '../boxes/Box.ts'
import type { IsoBmffBox } from '../boxes/IsoBmffBox.ts'
import { writeContainerBox } from '../writers/writeContainerBox.ts'
import { isContainer } from './isContainer.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'
import type { IsoStreamable } from './IsoStreamable.ts'

export function boxToBytes(box: IsoStreamable, writers: Record<string, (box: Box) => IsoDataWriter>): Uint8Array {
	let view: ArrayBufferView | null = null

	if ('type' in box) {
		const { type } = box

		if (isContainer(box)) {
			view = writeContainerBox(box, box.boxes.map(box => boxToBytes(box, writers)))
		}
		else {
			view = writers[type]?.(box as IsoBmffBox) ?? box.view
		}

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

	return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
}
