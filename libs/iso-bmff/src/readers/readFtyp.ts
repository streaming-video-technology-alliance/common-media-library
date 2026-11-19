import type { FileTypeBox } from '../boxes/FileTypeBox.ts'
import { STRING } from '../IsoBoxFields.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `ftyp` box (`FileTypeBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `FileTypeBox`
 *
 * @public
 */
export function readFtyp(cursor: IsoBoxReadCursor<IsoInt64>): FileTypeBox {
	const view = new IsoBoxReadView(cursor)

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
