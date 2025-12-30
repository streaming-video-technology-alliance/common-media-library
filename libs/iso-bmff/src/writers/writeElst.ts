import type { EditListBox } from '../boxes/EditListBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write an EditListBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.6.6 Edit List Box
 *
 * @param box - The EditListBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeElst(box: EditListBox): IsoBoxWriteView {
	const v1 = box.version === 1
	const size = v1 ? 8 : 4
	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const entrySize = size + size + 2 + 2 // segmentDuration + mediaTime + mediaRateInteger + mediaRateFraction
	const entriesSize = box.entryCount * entrySize
	const totalSize = headerSize + fullBoxSize + entryCountSize + entriesSize

	const writer = new IsoBoxWriteView('elst', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.entryCount, 4)

	for (const entry of box.entries) {
		writer.writeUint(entry.segmentDuration, size)
		writer.writeInt(entry.mediaTime, size)
		writer.writeInt(entry.mediaRateInteger, 2)
		writer.writeInt(entry.mediaRateFraction, 2)
	}

	return writer
}
