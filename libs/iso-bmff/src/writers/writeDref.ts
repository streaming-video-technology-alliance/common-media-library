import type { DataReferenceBox } from '../boxes/DataReferenceBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteConfig } from '../IsoBoxWriteConfig.ts'
import { writeChildBoxes } from '../utils/writeChildBoxes.ts'

/**
 * Write the `dref` box (`DataReferenceBox`).
 *
 * @param box - The `DataReferenceBox` fields to write
 * @param config - The `IsoBoxWriteConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeDref(box: DataReferenceBox, config: IsoBoxWriteConfig): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const entryCount = box.boxes.length

	// TODO: Is there a way to avoid creating the intermediate Uint8Arrays?
	const { bytes, size } = writeChildBoxes(box.boxes, config)
	const totalSize = headerSize + fullBoxSize + entryCountSize + size

	const writer = new IsoBoxWriteView('dref', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(entryCount, 4)

	writer.writeBytes(bytes)

	return writer
}
