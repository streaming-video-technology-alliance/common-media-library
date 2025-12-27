import type { Box } from './boxes/Box.ts'
import type { IsoBmffBox } from './boxes/IsoBmffBox.ts'
import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import type { IsoBoxWriteView } from './IsoBoxWriteView.ts'
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
export function writeIsoBox(box: IsoBoxStreamable, writers: Record<string, (box: Box) => IsoBoxWriteView>): Uint8Array {
	let view: ArrayBufferView | null = null

	if ('type' in box) {
		const { type } = box

		if (isContainer(box)) {
			view = writeContainerBox(box)
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
