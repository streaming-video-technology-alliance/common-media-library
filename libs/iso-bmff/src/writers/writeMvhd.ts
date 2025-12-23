import type { Fields } from '../boxes/Fields.ts'
import type { MovieHeaderBox } from '../boxes/MovieHeaderBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeTemplate } from './writeTemplate.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a MovieHeaderBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.2.2 Movie Header Box
 *
 * @param box - The MovieHeaderBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeMvhd(box: Fields<MovieHeaderBox>): Uint8Array {
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

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'mvhd', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, size, box.creationTime)
	offset += size

	writeUint(dataView, offset, size, box.modificationTime)
	offset += size

	writeUint(dataView, offset, 4, box.timescale)
	offset += 4

	writeUint(dataView, offset, size, box.duration)
	offset += size

	writeTemplate(dataView, offset, 4, box.rate)
	offset += 4

	writeTemplate(dataView, offset, 2, box.volume)
	offset += 2

	writeUint(dataView, offset, 2, box.reserved1)
	offset += 2

	for (let i = 0; i < 2; i++) {
		writeUint(dataView, offset, 4, box.reserved2[i] ?? 0)
		offset += 4
	}

	for (let i = 0; i < 9; i++) {
		writeUint(dataView, offset, 4, box.matrix[i] ?? 0)
		offset += 4
	}

	for (let i = 0; i < 6; i++) {
		writeUint(dataView, offset, 4, box.preDefined[i] ?? 0)
		offset += 4
	}

	writeUint(dataView, offset, 4, box.nextTrackId)

	return new Uint8Array(buffer)
}

