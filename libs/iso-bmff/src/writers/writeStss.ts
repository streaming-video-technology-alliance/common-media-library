import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { SyncSampleBox } from '../boxes/SyncSampleBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `stss` box (`SyncSampleBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.2
 *
 * @param cursor - The write cursor
 * @param box - The `SyncSampleBox` fields to write
 *
 * @public
 */
export function writeStss(cursor: IsoBoxWriteCursor, box: SyncSampleBox): void {
	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const entriesSize = box.entryCount * 4
	const totalSize = headerSize + fullBoxSize + entryCountSize + entriesSize

	const writer = new IsoBoxWriteView('stss', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.entryCount, 4)

	for (const sampleNumber of box.sampleNumber) {
		writer.writeUint(sampleNumber, 4)
	}

	writeLegacyView(cursor, writer)
}
