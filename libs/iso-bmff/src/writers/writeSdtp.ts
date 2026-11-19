import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { SampleDependencyTypeBox } from '../boxes/SampleDependencyTypeBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `sdtp` box (`SampleDependencyTypeBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.4
 *
 * @param cursor - The write cursor
 * @param box - The `SampleDependencyTypeBox` fields to write
 *
 * @public
 */
export function writeSdtp(cursor: IsoBoxWriteCursor, box: SampleDependencyTypeBox): void {
	const headerSize = 8
	const fullBoxSize = 4
	const sampleDependencyTableSize = box.sampleDependencyTable.length
	const totalSize = headerSize + fullBoxSize + sampleDependencyTableSize

	const writer = new IsoBoxWriteView('sdtp', totalSize)
	writer.writeFullBox(box.version, box.flags)

	for (const entry of box.sampleDependencyTable) {
		writer.writeUint(entry, 1)
	}

	writeLegacyView(cursor, writer)
}
