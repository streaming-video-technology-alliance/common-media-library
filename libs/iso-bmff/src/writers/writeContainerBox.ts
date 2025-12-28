import type { ContainerBox } from '../boxes/ContainerBox.ts'
import type { IsoBox } from '../boxes/IsoBox.ts'
import type { IsoBoxWriterMap } from '../IsoBoxWriterMap.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { writeIsoBox } from '../writeIsoBox.ts'

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
export function writeContainerBox<T extends IsoBox>(
	box: ContainerBox<T>,
	writers: IsoBoxWriterMap
): IsoBoxWriteView {
	const children: Uint8Array[] = []
	const headerSize = 8
	let childrenSize = 0

	// TODO: Is there a way to avoid creating the intermediate Uint8Arrays?
	for (const childBox of box.boxes) {
		const view = writeIsoBox(childBox, writers)
		childrenSize += view.byteLength
		children.push(view)
	}

	const totalSize = headerSize + childrenSize

	const writer = new IsoBoxWriteView(totalSize)

	writer.writeBoxHeader(box.type, totalSize)

	for (const child of children) {
		writer.writeBytes(child)
	}

	return writer
}
