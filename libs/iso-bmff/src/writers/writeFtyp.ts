import type { FileTypeBox } from '../boxes/FileTypeBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `ftyp` box (`FileTypeBox`).
 *
 * ISO/IEC 14496-12:2015 - 4.3
 *
 * @param box - The `FileTypeBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeFtyp(box: FileTypeBox): IsoBoxWriteView {
	const headerSize = 8
	const majorBrandSize = 4
	const minorVersionSize = 4
	const compatibleBrandsSize = box.compatibleBrands.length * 4
	const totalSize = headerSize + majorBrandSize + minorVersionSize + compatibleBrandsSize

	const writer = new IsoBoxWriteView('ftyp', totalSize)
	writer.writeString(box.majorBrand)
	writer.writeUint(box.minorVersion, 4)

	for (const brand of box.compatibleBrands) {
		writer.writeString(brand)
	}

	return writer
}
