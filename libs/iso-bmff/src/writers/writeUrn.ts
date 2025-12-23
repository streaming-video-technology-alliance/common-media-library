import type { Fields } from '../boxes/Fields.ts'
import type { UrnBox } from '../boxes/UrnBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeString } from './writeString.ts'

/**
 * Write a UrnBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
 *
 * @param box - The UrnBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeUrn(box: Fields<UrnBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const nameSize = box.name.length + 1 // null-terminated
	const locationSize = box.location.length + 1 // null-terminated
	const totalSize = headerSize + fullBoxSize + nameSize + locationSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'urn ', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeString(dataView, offset, box.name)
	offset += box.name.length
	dataView.setUint8(offset, 0) // null terminator
	offset += 1

	writeString(dataView, offset, box.location)
	offset += box.location.length
	dataView.setUint8(offset, 0) // null terminator

	return new Uint8Array(buffer)
}

