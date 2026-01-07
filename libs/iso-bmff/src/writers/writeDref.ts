import type { DataReferenceBox } from '../boxes/DataReferenceBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeChildBoxes } from '../utils/writeChildBoxes.ts'

/**
 * Write a DataReferenceBox to an IsoDataWriter.
 *
 * @param box - The DataReferenceBox fields to write
 * @param config - The IsoBoxWriteViewConfig to use
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeDref(box: DataReferenceBox, config: IsoBoxWriteViewConfig): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const entryCount = box.entries.length

	// TODO: Is there a way to avoid creating the intermediate Uint8Arrays?
	const { bytes, size } = writeChildBoxes(box.entries, config)
	const totalSize = headerSize + fullBoxSize + entryCountSize + size

	const writer = new IsoBoxWriteView('dref', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(entryCount, 4)

	writer.writeBytes(bytes)

	return writer
}
