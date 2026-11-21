import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { CompositionOffsetBox } from '../boxes/CompositionOffsetBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeInt32 } from '../cursor/writeInt32.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `ctts` box (`CompositionOffsetBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.1.3
 *
 * For a box of version 2 or above, the writer writes `entryCount` and no entries.
 *
 * @param cursor - The write cursor
 * @param box - The `CompositionOffsetBox` fields to write
 *
 * @public
 */
export function writeCtts(cursor: IsoBoxWriteCursor, box: CompositionOffsetBox): void {
	const start = beginIsoFullBox(cursor, 'ctts', box.version, box.flags)

	if (box.version > 1) {
		writeUint32(cursor, box.entryCount ?? 0)
	} else {
		const writeOffset = box.version ? writeInt32 : writeUint32

		writeUint32(cursor, box.entries.length)

		for (const entry of box.entries) {
			writeUint32(cursor, entry.sampleCount)
			writeOffset(cursor, entry.sampleOffset)
		}
	}

	endIsoBox(cursor, start)
}
