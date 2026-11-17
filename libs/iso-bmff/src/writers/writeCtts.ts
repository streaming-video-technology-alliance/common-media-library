import type { CompositionTimeToSampleBox } from '../boxes/CompositionTimeToSampleBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `ctts` box (`CompositionTimeToSampleBox`).
 *
 * ISO/IEC 14496-12:2012 - 8.6.1.3 Composition Time to Sample Box
 *
 * For a box of version 2 or above, the writer writes `entryCount` and no entries.
 *
 * @param box - The `CompositionTimeToSampleBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeCtts(box: CompositionTimeToSampleBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const hasEntries = box.version < 2
	const entriesSize = hasEntries ? box.entryCount * 8 : 0 // 4 bytes sampleCount + 4 bytes sampleOffset
	const totalSize = headerSize + fullBoxSize + entryCountSize + entriesSize

	const writer = new IsoBoxWriteView('ctts', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.entryCount, 4)

	if (hasEntries) {
		for (const entry of box.entries) {
			writer.writeUint(entry.sampleCount, 4)
			// For version 1, sampleOffset is signed, but we store as unsigned
			writer.writeUint(entry.sampleOffset, 4)
		}
	}

	return writer
}
