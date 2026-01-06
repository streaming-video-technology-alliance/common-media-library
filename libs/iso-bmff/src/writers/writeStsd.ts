import type { SampleDescriptionBox } from '../boxes/SampleDescriptionBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeIsoBoxes } from '../writeIsoBoxes.ts'

/**
 * Write a SampleDescriptionBox to an IsoDataWriter.
 *
 * @param box - The SampleDescriptionBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeStsd(box: SampleDescriptionBox, config: IsoBoxWriteViewConfig): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const entryCount = box.entries.length

	// TODO: Is there a way to avoid creating the intermediate Uint8Arrays?
	const entries = writeIsoBoxes(box.entries, config)
	const entriesSize = entries.reduce((size, entry) => size + entry.byteLength, 0)
	const totalSize = headerSize + fullBoxSize + entryCountSize + entriesSize

	const writer = new IsoBoxWriteView('stsd', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(entryCount, 4)

	for (const entry of entries) {
		writer.writeBytes(entry)
	}

	return writer
}
