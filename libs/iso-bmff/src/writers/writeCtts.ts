import type { CompositionTimeToSampleBox } from '../boxes/CompositionTimeToSampleBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a CompositionTimeToSampleBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.6.1.3 Composition Time to Sample Box
 *
 * @param box - The CompositionTimeToSampleBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeCtts(box: CompositionTimeToSampleBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const entriesSize = box.entryCount * 8 // 4 bytes sampleCount + 4 bytes sampleOffset
	const totalSize = headerSize + fullBoxSize + entryCountSize + entriesSize

	const writer = new IsoBoxWriteView('ctts', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.entryCount, 4)

	for (const entry of box.entries) {
		writer.writeUint(entry.sampleCount, 4)
		// For version 1, sampleOffset is signed, but we store as unsigned
		writer.writeUint(entry.sampleOffset, 4)
	}

	return writer
}
