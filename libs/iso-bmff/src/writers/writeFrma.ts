import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { OriginalFormatBox } from '../boxes/OriginalFormatBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `frma` box (`OriginalFormatBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.12.2
 *
 * @param cursor - The write cursor
 * @param box - The `OriginalFormatBox` fields to write
 *
 * @public
 */
export function writeFrma(cursor: IsoBoxWriteCursor, box: OriginalFormatBox): void {
	const headerSize = 8
	const dataFormatSize = 4
	const totalSize = headerSize + dataFormatSize

	const writer = new IsoBoxWriteView('frma', totalSize)
	writer.writeUint(box.dataFormat, 4)

	writeLegacyView(cursor, writer)
}
