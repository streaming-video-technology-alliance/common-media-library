import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { VideoMediaHeaderBox } from '../boxes/VideoMediaHeaderBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `vmhd` box (`VideoMediaHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 12.1.2
 *
 * @param cursor - The write cursor
 * @param box - The `VideoMediaHeaderBox` fields to write
 *
 * @public
 */
export function writeVmhd(cursor: IsoBoxWriteCursor, box: VideoMediaHeaderBox): void {
	const headerSize = 8
	const fullBoxSize = 4
	const graphicsmodeSize = 2
	const opcolorSize = 6 // 3 x 2 bytes
	const totalSize = headerSize + fullBoxSize + graphicsmodeSize + opcolorSize

	const writer = new IsoBoxWriteView('vmhd', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.graphicsMode, 2)
	writer.writeArray(box.opColor, UINT, 2, 3)

	writeLegacyView(cursor, writer)
}
