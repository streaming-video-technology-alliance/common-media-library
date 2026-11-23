import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { TrackExtendsBox } from '../boxes/TrackExtendsBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `trex` box (`TrackExtendsBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.3
 *
 * @param cursor - The write cursor
 * @param box - The `TrackExtendsBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @public
 */
export function writeTrex(cursor: IsoBoxWriteCursor, box: TrackExtendsBox): void {
	const start = beginIsoFullBox(cursor, 'trex', box.version, box.flags)

	writeUint32(cursor, box.trackId)
	writeUint32(cursor, box.defaultSampleDescriptionIndex)
	writeUint32(cursor, box.defaultSampleDuration)
	writeUint32(cursor, box.defaultSampleSize)
	writeUint32(cursor, box.defaultSampleFlags)
	endIsoBox(cursor, start)
}
