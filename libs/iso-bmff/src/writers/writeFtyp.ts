import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { FileTypeBox } from '../boxes/FileTypeBox.ts'
import { beginIsoBox } from '../beginIsoBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeFourCc } from '../cursor/writeFourCc.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `ftyp` box (`FileTypeBox`).
 *
 * ISO/IEC 14496-12:2015 - 4.3
 *
 * @param cursor - The write cursor
 * @param box - The `FileTypeBox` fields to write
 *
 * @throws RangeError if `majorBrand` or a compatible brand does not have 4 characters.
 *
 * @example
 * {@includeCode ../../test/writers/writeFtyp.test.ts#example}
 *
 * @public
 */
export function writeFtyp(cursor: IsoBoxWriteCursor, box: FileTypeBox): void {
	const start = beginIsoBox(cursor, 'ftyp')

	writeFourCc(cursor, box.majorBrand)
	writeUint32(cursor, box.minorVersion)

	for (const brand of box.compatibleBrands) {
		writeFourCc(cursor, brand)
	}

	endIsoBox(cursor, start)
}
