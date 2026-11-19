import type { FileTypeBox } from '../boxes/FileTypeBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import { readFourCc } from '../cursor/readFourCc.ts'

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
	const majorBrand = readFourCc(cursor)
	const minorVersion = readUint32(cursor)
	const compatibleBrands: string[] = []

	while (cursor.pos < cursor.end) {
		compatibleBrands.push(readFourCc(cursor))
	}

	return {
		type: 'ftyp',
		majorBrand,
		minorVersion,
		compatibleBrands,
	}
}
