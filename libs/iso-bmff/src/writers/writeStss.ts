import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { SyncSampleBox } from '../boxes/SyncSampleBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `stss` box (`SyncSampleBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.2
 *
 * @param cursor - The write cursor
 * @param box - The `SyncSampleBox` fields to write
 *
 * @public
 */
export function writeStss(cursor: IsoBoxWriteCursor, box: SyncSampleBox): void {
	const start = beginIsoFullBox(cursor, 'stss', box.version, box.flags)

	writeUint32(cursor, box.sampleNumber.length)

	for (const sampleNumber of box.sampleNumber) {
		writeUint32(cursor, sampleNumber)
	}

	endIsoBox(cursor, start)
}
