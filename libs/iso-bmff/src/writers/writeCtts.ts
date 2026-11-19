import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { CompositionOffsetBox } from '../boxes/CompositionOffsetBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `ctts` box (`CompositionOffsetBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.1.3
 *
 * For a box of version 2 or above, the writer writes `entryCount` and no entries.
 *
 * @param cursor - The write cursor
 * @param box - The `CompositionOffsetBox` fields to write
 *
 * @public
 */
export function writeCtts(cursor: IsoBoxWriteCursor, box: CompositionOffsetBox): void {
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
		const writeOffset = box.version ? writer.writeInt : writer.writeUint

		for (const entry of box.entries) {
			writer.writeUint(entry.sampleCount, 4)
			writeOffset(entry.sampleOffset, 4)
		}
	}

	writeLegacyView(cursor, writer)
}
