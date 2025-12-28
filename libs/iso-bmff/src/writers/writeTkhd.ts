import type { Fields } from '../boxes/Fields.ts'
import type { TrackHeaderBox } from '../boxes/TrackHeaderBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a TrackHeaderBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.3.2 Track Header Box
 *
 * @param box - The TrackHeaderBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeTkhd(box: Fields<TrackHeaderBox>): IsoBoxWriteView {
	const v1 = box.version === 1
	const size = v1 ? 8 : 4
	const headerSize = 8
	const fullBoxSize = 4
	const timesSize = size * 3 // creationTime, modificationTime, duration
	const trackIdSize = 4
	const reserved1Size = 4
	const reserved2Size = 8 // 2 x 4 bytes
	const layerSize = 2
	const alternateGroupSize = 2
	const volumeSize = 2
	const reserved3Size = 2
	const matrixSize = 36 // 9 x 4 bytes
	const widthSize = 4
	const heightSize = 4

	const totalSize = headerSize + fullBoxSize + timesSize + trackIdSize + reserved1Size +
		reserved2Size + layerSize + alternateGroupSize + volumeSize + reserved3Size +
		matrixSize + widthSize + heightSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('tkhd', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.creationTime, size)
	writer.writeUint(box.modificationTime, size)
	writer.writeUint(box.trackId, 4)
	writer.writeUint(box.reserved1, 4)
	writer.writeUint(box.duration, size)

	for (let i = 0; i < 2; i++) {
		writer.writeUint(box.reserved2[i] ?? 0, 4)
	}

	writer.writeUint(box.layer, 2)
	writer.writeUint(box.alternateGroup, 2)
	writer.writeTemplate(box.volume, 2)
	writer.writeUint(box.reserved3, 2)

	for (let i = 0; i < 9; i++) {
		writer.writeTemplate(box.matrix[i] ?? 0, 4)
	}

	writer.writeTemplate(box.width, 4)
	writer.writeTemplate(box.height, 4)

	return writer
}
