import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { SegmentTypeBox } from '../boxes/SegmentTypeBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `styp` box (`SegmentTypeBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.16.2
 *
 * @param cursor - The write cursor
 * @param box - The `SegmentTypeBox` fields to write
 *
 * @public
 */
export function writeStyp(cursor: IsoBoxWriteCursor, box: SegmentTypeBox): void {
	const headerSize = 8
	const majorBrandSize = 4
	const minorVersionSize = 4
	const compatibleBrandsSize = box.compatibleBrands.length * 4
	const totalSize = headerSize + majorBrandSize + minorVersionSize + compatibleBrandsSize

	const writer = new IsoBoxWriteView('styp', totalSize)
	writer.writeString(box.majorBrand)
	writer.writeUint(box.minorVersion, 4)

	for (const brand of box.compatibleBrands) {
		writer.writeString(brand)
	}

	writeLegacyView(cursor, writer)
}
