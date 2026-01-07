import type { IsoBox } from '../IsoBox.ts'
import type { IsoBoxStreamable } from '../IsoBoxStreamable.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { isContainer } from '../utils/isContainer.ts'
import { writeContainerBox } from './writeContainerBox.ts'

/**
 * Write a box to a Uint8Array.
 *
 * @param box - The box to write
 * @param writers - The writers to use
 * @returns The written box
 *
 * @internal
 */
export function writeBox(box: IsoBoxStreamable, config: IsoBoxWriteViewConfig): Uint8Array {
	let view: ArrayBufferView | null = null

	if ('type' in box) {
		const { type } = box
		const writer = config.writers?.[type as IsoBox['type']]

		if (writer) {
			// TODO: Find a better way to do this without casting to any
			view = writer(box as any, config)
		}
		else if (isContainer(box)) {
			view = writeContainerBox(box, config)
		}
		else if ('view' in box) {
			view = box.view
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
