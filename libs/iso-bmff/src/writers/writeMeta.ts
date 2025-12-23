import type { Fields } from '../boxes/Fields.ts'
import type { MetaBox } from '../boxes/MetaBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'

/**
 * Write a MetaBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.11.1 Meta Box
 *
 * @param box - The MetaBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeMeta(box: Fields<MetaBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const totalSize = headerSize + fullBoxSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'meta', totalSize)
	writeFullBox(dataView, offset, box.version, box.flags)

	return new Uint8Array(buffer)
}

