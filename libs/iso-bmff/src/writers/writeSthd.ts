import type { SubtitleMediaHeaderBox } from '../boxes/SubtitleMediaHeaderBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `sthd` box (`SubtitleMediaHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 12.6.2
 *
 * @param box - The `SubtitleMediaHeaderBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeSthd(box: SubtitleMediaHeaderBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const totalSize = headerSize + fullBoxSize

	const writer = new IsoBoxWriteView('sthd', totalSize)
	writer.writeFullBox(box.version, box.flags)

	return writer
}
