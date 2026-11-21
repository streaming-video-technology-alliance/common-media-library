import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { TimeToSampleBox } from '../boxes/TimeToSampleBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `stts` box (`TimeToSampleBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.1.2
 *
 * @param cursor - The write cursor
 * @param box - The `TimeToSampleBox` fields to write
 *
 * @public
 */
export function writeStts(cursor: IsoBoxWriteCursor, box: TimeToSampleBox): void {
	const start = beginIsoFullBox(cursor, 'stts', box.version, box.flags)

	writeUint32(cursor, box.entries.length)

	for (const entry of box.entries) {
		writeUint32(cursor, entry.sampleCount)
		writeUint32(cursor, entry.sampleDelta)
	}

	endIsoBox(cursor, start)
}
