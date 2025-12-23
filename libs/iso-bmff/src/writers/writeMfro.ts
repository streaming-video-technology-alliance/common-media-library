import type { Fields } from '../boxes/Fields.ts'
import type { MovieFragmentRandomAccessOffsetBox } from '../boxes/MovieFragmentRandomAccessOffsetBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a MovieFragmentRandomAccessOffsetBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.8.11 Movie Fragment Random Access Offset Box
 *
 * @param box - The MovieFragmentRandomAccessOffsetBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeMfro(box: Fields<MovieFragmentRandomAccessOffsetBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const mfraSizeSize = 4
	const totalSize = headerSize + fullBoxSize + mfraSizeSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'mfro', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 4, box.mfraSize)

	return new Uint8Array(buffer)
}

