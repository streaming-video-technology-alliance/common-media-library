import type { Box } from '../boxes/Box.ts'
import type { ContainerBox } from '../boxes/ContainerBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { isFullBox } from '../utils/isFullBox.ts'

/**
 * Write a ContainerBox to an IsoBmffWriter.
 *
 * This function writes a container box with its child boxes. Child boxes are
 * extracted from the container box's `boxes` array and encoded using their `view` property.
 *
 * @param box - The ContainerBox to write
 *
 * @returns An IsoBmffWriter containing the encoded box
 *
 * @public
 */
export function writeContainerBox<T extends Box>(
	box: ContainerBox<T>
): IsoBoxWriteView {
	const headerSize = 8
	const isFullContainerBox = isFullBox(box)
	const fullBoxSize = isFullContainerBox ? 4 : 0

	// Calculate total size of all child boxes
	let childBoxesSize = 0
	for (const childBox of box.boxes) {
		childBoxesSize += childBox.view.byteLength
	}

	const totalSize = headerSize + fullBoxSize + childBoxesSize

	const writer = new IsoBoxWriteView(totalSize)

	// Handle largesize if needed
	if (box.largesize !== undefined) {
		writer.writeBoxHeader(box.type, totalSize, box.largesize)
	} else {
		writer.writeBoxHeader(box.type, totalSize)
	}

	// Write FullBox header if applicable
	if (isFullContainerBox) {
		writer.writeFullBox(box.version, box.flags)
	}

	// Write all child boxes
	for (const childBox of box.boxes) {
		const view = childBox.view
		writer.writeBytes(new Uint8Array(view.buffer, view.byteOffset, view.byteLength))
	}

	return writer
}

