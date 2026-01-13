import type { FileTypeBox } from '../boxes/FileTypeBox.ts'
import { STRING } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `FileTypeBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `FileTypeBox`
 *
 * @public
 */
export function readFtyp(view: IsoBoxReadView): FileTypeBox {
	const size = 4
	const majorBrand = view.readString(4)
	const minorVersion = view.readUint(4)
	const length = view.bytesRemaining / size
	const compatibleBrands = view.readArray(STRING, size, length)

	return {
		type: 'ftyp',
		majorBrand,
		minorVersion,
		compatibleBrands,
	}
}
