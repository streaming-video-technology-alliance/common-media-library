import type { IsoBmffBox } from './boxes/types/IsoBmffBox.ts'
import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import type { IsoBoxWriterMap } from './IsoBoxWriterMap.ts'
import { isContainer } from './utils/isContainer.ts'
import { writeContainerBox } from './writers/writeContainerBox.ts'

/**
 * Write an ISO box to a Uint8Array.
 *
 * @param box - The box to write
 * @param writers - The writers to use
 * @returns The written box
 *
 * @public
 */
export function writeIsoBox(box: IsoBoxStreamable, writers: IsoBoxWriterMap): Uint8Array {
	let view: ArrayBufferView | null = null

	if ('type' in box) {
		const { type } = box

		if (isContainer(box)) {
			view = writeContainerBox(box)
		}
		else {
			view = writers[type]?.write(box as IsoBmffBox) ?? box.view
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
