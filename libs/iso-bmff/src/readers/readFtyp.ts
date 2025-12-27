import type { Fields } from '../boxes/Fields.ts'
import type { FileTypeBox } from '../boxes/FileTypeBox.ts'
import { STRING } from '../fields/STRING.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a FileTypeBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed FileTypeBox
 *
 * @public
 */
export function readFtyp(view: IsoBoxReadView): Fields<FileTypeBox> {
	const size = 4
	const majorBrand = view.readString(4)
	const minorVersion = view.readUint(4)
	const length = view.bytesRemaining / size
	const compatibleBrands = view.readArray(STRING, size, length)

	return {
		majorBrand,
		minorVersion,
		compatibleBrands,
	}
}
