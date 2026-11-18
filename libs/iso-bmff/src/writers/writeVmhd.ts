import type { VideoMediaHeaderBox } from '../boxes/VideoMediaHeaderBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `vmhd` box (`VideoMediaHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 12.1.2
 *
 * @param box - The `VideoMediaHeaderBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeVmhd(box: VideoMediaHeaderBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const graphicsmodeSize = 2
	const opcolorSize = 6 // 3 x 2 bytes
	const totalSize = headerSize + fullBoxSize + graphicsmodeSize + opcolorSize

	const writer = new IsoBoxWriteView('vmhd', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.graphicsMode, 2)
	writer.writeArray(box.opColor, UINT, 2, 3)

	return writer
}
