import type { VideoMediaHeaderBox } from '../boxes/VideoMediaHeaderBox.ts'
import { IsoDataWriter } from '../utils/IsoDataWriter.ts'

/**
 * Write a VideoMediaHeaderBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 12.1.2 Video Media Header Box
 *
 * @param box - The VideoMediaHeaderBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeVmhd(box: VideoMediaHeaderBox): IsoDataWriter {
	const headerSize = 8
	const fullBoxSize = 4
	const graphicsmodeSize = 2
	const opcolorSize = 6 // 3 x 2 bytes
	const totalSize = headerSize + fullBoxSize + graphicsmodeSize + opcolorSize

	const writer = new IsoDataWriter(totalSize)
	writer.writeBoxHeader('vmhd', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.graphicsmode, 2)

	for (let i = 0; i < 3; i++) {
		writer.writeUint(box.opcolor[i] ?? 0, 2)
	}

	return writer
}
