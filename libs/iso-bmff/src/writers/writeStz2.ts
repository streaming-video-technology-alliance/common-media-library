import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { CompactSampleSizeBox } from '../boxes/CompactSampleSizeBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint8 } from '../cursor/writeUint8.ts'
import { writeUint16 } from '../cursor/writeUint16.ts'
import { writeUint24 } from '../cursor/writeUint24.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { endIsoBox } from '../endIsoBox.ts'
import { checkUint } from '../cursor/checkUint.ts'
import { failRange } from '../cursor/failRange.ts'

/**
 * Write the `stz2` box (`CompactSampleSizeBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.3
 *
 * The writer writes entries of 4, 8, or 16 bits. With a `fieldSize` of 4, the last byte has 0 in its low bits
 * for an odd number of entries.
 *
 * @param cursor - The write cursor
 * @param box - The `CompactSampleSizeBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @example
 * {@includeCode ../../test/writers/writeStz2.test.ts#example}
 *
 * @public
 */
export function writeStz2(cursor: IsoBoxWriteCursor, box: CompactSampleSizeBox): void {
	const { fieldSize, entrySize } = box

	if (fieldSize !== 4 && fieldSize !== 8 && fieldSize !== 16) {
		failRange('fieldSize', '4, 8, or 16', fieldSize)
	}

	const start = beginIsoFullBox(cursor, 'stz2', box.version, box.flags)

	writeUint24(cursor, 0)
	writeUint8(cursor, fieldSize)
	writeUint32(cursor, entrySize.length)

	if (fieldSize === 4) {
		for (let i = 0; i < entrySize.length; i += 2) {
			writeUint8(
				cursor,
				(checkUint('entrySize', entrySize[i], 15) << 4) |
					(i + 1 < entrySize.length ? checkUint('entrySize', entrySize[i + 1], 15) : 0),
			)
		}
	} else {
		const write = fieldSize === 8 ? writeUint8 : writeUint16

		for (const size of entrySize) {
			write(cursor, size)
		}
	}

	endIsoBox(cursor, start)
}
