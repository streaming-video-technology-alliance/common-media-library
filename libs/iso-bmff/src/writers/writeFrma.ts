import type { Fields } from '../boxes/Fields.ts'
import type { OriginalFormatBox } from '../boxes/OriginalFormatBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write an OriginalFormatBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.12.2 Original Format Box
 *
 * @param box - The OriginalFormatBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeFrma(box: Fields<OriginalFormatBox>): Uint8Array {
	const headerSize = 8
	const dataFormatSize = 4
	const totalSize = headerSize + dataFormatSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'frma', totalSize)

	writeUint(dataView, offset, 4, box.dataFormat)

	return new Uint8Array(buffer)
}

