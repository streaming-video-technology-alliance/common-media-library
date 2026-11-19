import type { CompactSampleSizeBox } from '../boxes/CompactSampleSizeBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint16 } from '../cursor/readUint16.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'

/**
 * Read the `stz2` box (`CompactSampleSizeBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.3
 *
 * The reader reads entries of 4, 8, or 16 bits. For another `field_size`, `entrySize` is empty.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `CompactSampleSizeBox`
 *
 * @example
 * {@includeCode ../../test/readers/readStz2.test.ts#example}
 *
 * @public
 */
export function readStz2(cursor: IsoBoxReadCursor<IsoInt64>): CompactSampleSizeBox {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)

	cursor.pos += 3

	const fieldSize = readUint8(cursor)
	const sampleCount = readUint32(cursor)
	const entrySize: number[] = []

	if (fieldSize === 4) {
		for (let i = 0; i < sampleCount; i += 2) {
			const byte = readUint8(cursor)

			entrySize.push(byte >> 4)

			if (i + 1 < sampleCount) {
				entrySize.push(byte & 0xf)
			}
		}
	} else if (fieldSize === 8 || fieldSize === 16) {
		const read = fieldSize === 8 ? readUint8 : readUint16

		for (let i = 0; i < sampleCount; i++) {
			entrySize.push(read(cursor))
		}
	}

	return {
		type: 'stz2',
		version,
		flags,
		fieldSize,
		entrySize,
	}
}
