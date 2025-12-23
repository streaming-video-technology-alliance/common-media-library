import type { Fields } from '../boxes/Fields.ts'
import type { MovieFragmentHeaderBox } from '../boxes/MovieFragmentHeaderBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a MovieFragmentHeaderBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.8.5 Movie Fragment Header Box
 *
 * @param box - The MovieFragmentHeaderBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeMfhd(box: Fields<MovieFragmentHeaderBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const sequenceNumberSize = 4
	const totalSize = headerSize + fullBoxSize + sequenceNumberSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'mfhd', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 4, box.sequenceNumber)

	return new Uint8Array(buffer)
}

