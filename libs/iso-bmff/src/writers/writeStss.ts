import type { Fields } from '../boxes/Fields.ts'
import type { SyncSampleBox } from '../boxes/SyncSampleBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a SyncSampleBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.6.2 Sync Sample Box
 *
 * @param box - The SyncSampleBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeStss(box: Fields<SyncSampleBox>): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const entriesSize = box.entryCount * 4
	const totalSize = headerSize + fullBoxSize + entryCountSize + entriesSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('stss', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.entryCount, 4)

	for (const entry of box.entries) {
		writer.writeUint(entry.sampleNumber, 4)
	}

	return writer
}
