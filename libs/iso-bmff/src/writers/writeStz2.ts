import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { CompactSampleSizeBox } from '../boxes/CompactSampleSizeBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint8 } from '../cursor/writeUint8.ts'
import { writeUint16 } from '../cursor/writeUint16.ts'
import { writeUint24 } from '../cursor/writeUint24.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `stz2` box (`CompactSampleSizeBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.3
 *
 * The writer writes entries of 4, 8, or 16 bits. With a `fieldSize` of 4, the last byte has 0 in its low bits
 * for an odd number of entries. For another `fieldSize`, the writer writes a sample count of 0 and no entries.
 *
 * @param cursor - The write cursor
 * @param box - The `CompactSampleSizeBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeStz2.test.ts#example}
 *
 * @public
 */
export function writeStz2(cursor: IsoBoxWriteCursor, box: CompactSampleSizeBox): void {
	const { fieldSize, entrySize } = box
	const known = fieldSize === 4 || fieldSize === 8 || fieldSize === 16
	const start = beginIsoFullBox(cursor, 'stz2', box.version, box.flags)

	writeUint24(cursor, 0)
	writeUint8(cursor, fieldSize)
	writeUint32(cursor, known ? entrySize.length : 0)

	if (fieldSize === 4) {
		for (let i = 0; i < entrySize.length; i += 2) {
			writeUint8(cursor, ((entrySize[i] & 0xf) << 4) | ((entrySize[i + 1] ?? 0) & 0xf))
		}
	} else if (known) {
		const write = fieldSize === 8 ? writeUint8 : writeUint16

		for (const size of entrySize) {
			write(cursor, size)
		}
	}

	endIsoBox(cursor, start)
}
