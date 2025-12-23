import type { Fields } from '../boxes/Fields.ts'
import type { MediaHeaderBox } from '../boxes/MediaHeaderBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a MediaHeaderBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.4.2 Media Header Box
 *
 * @param box - The MediaHeaderBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeMdhd(box: Fields<MediaHeaderBox>): Uint8Array {
	const size = box.version === 1 ? 8 : 4
	const headerSize = 8
	const fullBoxSize = 4
	const timesSize = size * 3 // creationTime, modificationTime, duration
	const timescaleSize = 4
	const languageSize = 2
	const preDefined = 2
	const totalSize = headerSize + fullBoxSize + timesSize + timescaleSize + languageSize + preDefined

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'mdhd', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, size, box.creationTime)
	offset += size

	writeUint(dataView, offset, size, box.modificationTime)
	offset += size

	writeUint(dataView, offset, 4, box.timescale)
	offset += 4

	writeUint(dataView, offset, size, box.duration)
	offset += size

	writeUint(dataView, offset, 2, box.language)
	offset += 2

	writeUint(dataView, offset, 2, box.preDefined)

	return new Uint8Array(buffer)
}

