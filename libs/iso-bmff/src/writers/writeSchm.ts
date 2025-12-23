import type { Fields } from '../boxes/Fields.ts'
import type { SchemeTypeBox } from '../boxes/SchemeTypeBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeString } from './writeString.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a SchemeTypeBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.12.5 Scheme Type Box
 *
 * @param box - The SchemeTypeBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeSchm(box: Fields<SchemeTypeBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const schemeTypeSize = 4
	const schemeVersionSize = 4
	const schemeUriSize = (box.flags & 0x000001) && box.schemeUri ? box.schemeUri.length + 1 : 0
	const totalSize = headerSize + fullBoxSize + schemeTypeSize + schemeVersionSize + schemeUriSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'schm', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 4, box.schemeType)
	offset += 4

	writeUint(dataView, offset, 4, box.schemeVersion)
	offset += 4

	if ((box.flags & 0x000001) && box.schemeUri) {
		writeString(dataView, offset, box.schemeUri)
		offset += box.schemeUri.length
		dataView.setUint8(offset, 0) // null terminator
	}

	return new Uint8Array(buffer)
}

