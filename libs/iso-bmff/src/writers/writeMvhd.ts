import type { MovieHeaderBox } from '../boxes/MovieHeaderBox.ts'
import { TEMPLATE } from '../fields/TEMPLATE.ts'
import { UINT } from '../fields/UINT.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a MovieHeaderBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.2.2 Movie Header Box
 *
 * @param box - The MovieHeaderBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeMvhd(box: MovieHeaderBox): IsoBoxWriteView {
	const size = box.version === 1 ? 8 : 4
	const headerSize = 8
	const fullBoxSize = 4
	const timesSize = size * 3 // creationTime, modificationTime, duration
	const timescaleSize = 4
	const rateSize = 4
	const volumeSize = 2
	const reserved1Size = 2
	const reserved2Size = 8 // 2 x 4 bytes
	const matrixSize = 36 // 9 x 4 bytes
	const preDefinedSize = 24 // 6 x 4 bytes
	const nextTrackIdSize = 4

	const totalSize = headerSize + fullBoxSize + timesSize + timescaleSize + rateSize +
		volumeSize + reserved1Size + reserved2Size + matrixSize + preDefinedSize + nextTrackIdSize

	const writer = new IsoBoxWriteView('mvhd', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.creationTime, size)
	writer.writeUint(box.modificationTime, size)
	writer.writeUint(box.timescale, 4)
	writer.writeUint(box.duration, size)
	writer.writeTemplate(box.rate, 4)
	writer.writeTemplate(box.volume, 2)
	writer.writeUint(box.reserved1, 2)
	writer.writeArray(box.reserved2, UINT, 4, 2)
	writer.writeArray(box.matrix, TEMPLATE, 4, 9)
	writer.writeArray(box.preDefined, UINT, 4, 6)
	writer.writeUint(box.nextTrackId, 4)

	return writer
}
