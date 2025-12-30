import type { SubtitleMediaHeaderBox } from '../boxes/SubtitleMediaHeaderBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a SubtitleMediaHeaderBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 12.6.2 Subtitle Media Header Box
 *
 * @param box - The SubtitleMediaHeaderBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
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
