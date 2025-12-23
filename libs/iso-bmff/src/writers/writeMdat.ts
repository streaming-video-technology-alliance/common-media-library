import type { Fields } from '../boxes/Fields.ts'
import type { MediaDataBox } from '../boxes/MediaDataBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'

/**
 * Write a MediaDataBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.1.1 Media Data Box
 *
 * @param box - The MediaDataBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeMdat(box: Fields<MediaDataBox>): Uint8Array {
	const headerSize = 8
	const dataSize = box.data.length
	const totalSize = headerSize + dataSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)
	const result = new Uint8Array(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'mdat', totalSize)

	result.set(box.data, offset)

	return result
}

