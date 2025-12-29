import type { SegmentTypeBox } from '../boxes/SegmentTypeBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a SegmentTypeBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.16.2 Segment Type Box
 *
 * @param box - The SegmentTypeBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeStyp(box: SegmentTypeBox): IsoBoxWriteView {
	const headerSize = 8
	const majorBrandSize = 4
	const minorVersionSize = 4
	const compatibleBrandsSize = box.compatibleBrands.length * 4
	const totalSize = headerSize + majorBrandSize + minorVersionSize + compatibleBrandsSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('styp', totalSize)
	writer.writeString(box.majorBrand)
	writer.writeUint(box.minorVersion, 4)

	for (const brand of box.compatibleBrands) {
		writer.writeString(brand)
	}

	return writer
}
