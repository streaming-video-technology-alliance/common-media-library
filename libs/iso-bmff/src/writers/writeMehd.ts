import type { Fields } from '../boxes/Fields.ts'
import type { MovieExtendsHeaderBox } from '../boxes/MovieExtendsHeaderBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a MovieExtendsHeaderBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.8.2 Movie Extends Header Box
 *
 * @param box - The MovieExtendsHeaderBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeMehd(box: Fields<MovieExtendsHeaderBox>): Uint8Array {
	const v1 = box.version === 1
	const size = v1 ? 8 : 4
	const headerSize = 8
	const fullBoxSize = 4
	const fragmentDurationSize = size
	const totalSize = headerSize + fullBoxSize + fragmentDurationSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'mehd', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, size, box.fragmentDuration)

	return new Uint8Array(buffer)
}

