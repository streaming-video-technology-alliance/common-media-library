import type { Fields } from '../boxes/Fields.ts'
import type { TrackHeaderBox } from '../boxes/TrackHeaderBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeTemplate } from './writeTemplate.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a TrackHeaderBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.3.2 Track Header Box
 *
 * @param box - The TrackHeaderBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeTkhd(box: Fields<TrackHeaderBox>): Uint8Array {
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

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'tkhd', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, size, box.creationTime)
	offset += size

	writeUint(dataView, offset, size, box.modificationTime)
	offset += size

	writeUint(dataView, offset, 4, box.trackId)
	offset += 4

	writeUint(dataView, offset, 4, box.reserved1)
	offset += 4

	writeUint(dataView, offset, size, box.duration)
	offset += size

	for (let i = 0; i < 2; i++) {
		writeUint(dataView, offset, 4, box.reserved2[i] ?? 0)
		offset += 4
	}

	writeUint(dataView, offset, 2, box.layer)
	offset += 2

	writeUint(dataView, offset, 2, box.alternateGroup)
	offset += 2

	writeTemplate(dataView, offset, 2, box.volume)
	offset += 2

	writeUint(dataView, offset, 2, box.reserved3)
	offset += 2

	for (let i = 0; i < 9; i++) {
		writeTemplate(dataView, offset, 4, box.matrix[i] ?? 0)
		offset += 4
	}

	writeTemplate(dataView, offset, 4, box.width)
	offset += 4

	writeTemplate(dataView, offset, 4, box.height)

	return new Uint8Array(buffer)
}

