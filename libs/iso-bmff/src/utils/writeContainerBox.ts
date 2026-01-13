import type { IsoBoxContainer } from '../IsoBoxContainer.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeChildBoxes } from '../utils/writeChildBoxes.ts'

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
 * @internal
 */
export function writeContainerBox<T extends IsoBoxContainer>(
	box: T,
	config: IsoBoxWriteViewConfig
): IsoBoxWriteView {
	const headerSize = 8
	// TODO: Is there a way to avoid creating the intermediate Uint8Arrays?
	const { bytes, size } = writeChildBoxes(box.boxes as any, config)

	const totalSize = headerSize + size

	const writer = new IsoBoxWriteView(box.type, totalSize)

	writer.writeBytes(bytes)

	return writer
}
