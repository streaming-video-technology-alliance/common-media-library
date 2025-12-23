import type { Fields } from '../boxes/Fields.ts'
import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'

/**
 * Write a FreeSpaceBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.1.2 Free Space Box
 *
 * @param box - The FreeSpaceBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeFree(box: Fields<FreeSpaceBox<'free'>>): Uint8Array {
	const headerSize = 8
	const dataSize = box.data.length
	const totalSize = headerSize + dataSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)
	const result = new Uint8Array(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'free', totalSize)

	result.set(box.data, offset)

	return result
}

