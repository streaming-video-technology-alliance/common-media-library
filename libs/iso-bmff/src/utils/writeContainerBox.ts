import type { IsoBox } from '../IsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxContainer } from '../IsoBoxContainer.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteConfig } from '../IsoBoxWriteConfig.ts'
import { writeChildBoxes } from '../utils/writeChildBoxes.ts'

/**
 * Writes a container box from the child boxes in its `boxes` field.
 *
 * @param box - The container box to write
 * @param config - The `IsoBoxWriteConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @internal
 */
export function writeContainerBox<T extends IsoBoxContainer<IsoInt64>>(
	box: T,
	config: IsoBoxWriteConfig,
): IsoBoxWriteView {
	const headerSize = 8
	// TODO: Is there a way to avoid creating the intermediate Uint8Arrays?
	const { bytes, size } = writeChildBoxes(box.boxes as IsoBox<IsoInt64>[], config)

	const totalSize = headerSize + size

	const writer = new IsoBoxWriteView(box.type, totalSize)

	writer.writeBytes(bytes)

	return writer
}
