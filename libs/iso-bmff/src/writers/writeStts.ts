import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { TimeToSampleBox } from '../boxes/TimeToSampleBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `stts` box (`TimeToSampleBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.1.2
 *
 * @param cursor - The write cursor
 * @param box - The `TimeToSampleBox` fields to write
 *
 * @public
 */
export function writeStts(cursor: IsoBoxWriteCursor, box: TimeToSampleBox): void {
	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const entriesSize = box.entryCount * 8 // 4 bytes sampleCount + 4 bytes sampleDelta
	const totalSize = headerSize + fullBoxSize + entryCountSize + entriesSize

	const writer = new IsoBoxWriteView('stts', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.entryCount, 4)

	for (const entry of box.entries) {
		writer.writeUint(entry.sampleCount, 4)
		writer.writeUint(entry.sampleDelta, 4)
	}

	writeLegacyView(cursor, writer)
}
