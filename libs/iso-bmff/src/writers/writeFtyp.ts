import type { FileTypeBox } from '../boxes/FileTypeBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a FileTypeBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 4.3 File Type Box
 *
 * @param box - The FileTypeBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeFtyp(box: FileTypeBox): IsoBoxWriteView {
	const headerSize = 8
	const majorBrandSize = 4
	const minorVersionSize = 4
	const compatibleBrandsSize = box.compatibleBrands.length * 4
	const totalSize = headerSize + majorBrandSize + minorVersionSize + compatibleBrandsSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('ftyp', totalSize)
	writer.writeString(box.majorBrand)
	writer.writeUint(box.minorVersion, 4)

	for (const brand of box.compatibleBrands) {
		writer.writeString(brand)
	}

	return writer
}
