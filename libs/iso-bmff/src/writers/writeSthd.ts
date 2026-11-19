import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { SubtitleMediaHeaderBox } from '../boxes/SubtitleMediaHeaderBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `sthd` box (`SubtitleMediaHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 12.6.2
 *
 * @param cursor - The write cursor
 * @param box - The `SubtitleMediaHeaderBox` fields to write
 *
 * @public
 */
export function writeSthd(cursor: IsoBoxWriteCursor, box: SubtitleMediaHeaderBox): void {
	const headerSize = 8
	const fullBoxSize = 4
	const totalSize = headerSize + fullBoxSize

	const writer = new IsoBoxWriteView('sthd', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writeLegacyView(cursor, writer)
}
