import type { Fields } from '../boxes/Fields.ts'
import type { SegmentTypeBox } from '../boxes/SegmentTypeBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeString } from './writeString.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a SegmentTypeBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.16.2 Segment Type Box
 *
 * @param box - The SegmentTypeBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeStyp(box: Fields<SegmentTypeBox>): Uint8Array {
	const headerSize = 8
	const majorBrandSize = 4
	const minorVersionSize = 4
	const compatibleBrandsSize = box.compatibleBrands.length * 4
	const totalSize = headerSize + majorBrandSize + minorVersionSize + compatibleBrandsSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'styp', totalSize)

	writeString(dataView, offset, box.majorBrand)
	offset += majorBrandSize

	writeUint(dataView, offset, 4, box.minorVersion)
	offset += minorVersionSize

	for (const brand of box.compatibleBrands) {
		writeString(dataView, offset, brand)
		offset += 4
	}

	return new Uint8Array(buffer)
}

