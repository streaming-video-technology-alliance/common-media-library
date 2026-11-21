import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { SampleSizeBox } from '../boxes/SampleSizeBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `stsz` box (`SampleSizeBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.3
 *
 * @param cursor - The write cursor
 * @param box - The `SampleSizeBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeStsz.test.ts#example}
 *
 * @public
 */
export function writeStsz(cursor: IsoBoxWriteCursor, box: SampleSizeBox): void {
	const start = beginIsoFullBox(cursor, 'stsz', box.version, box.flags)

	writeUint32(cursor, box.sampleSize)

	if (box.sampleSize !== 0) {
		writeUint32(cursor, box.sampleCount ?? 0)
	} else {
		const entrySize = box.entrySize ?? []

		writeUint32(cursor, entrySize.length)

		for (const size of entrySize) {
			writeUint32(cursor, size)
		}
	}

	endIsoBox(cursor, start)
}
