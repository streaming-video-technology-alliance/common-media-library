import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { TrackFragmentBaseMediaDecodeTimeBox } from '../boxes/TrackFragmentBaseMediaDecodeTimeBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeWideUint } from '../cursor/writeWideUint.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `tfdt` box (`TrackFragmentBaseMediaDecodeTimeBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.12
 *
 * Each 64-bit integer field of the box is a `number` or a `bigint`.
 * The writer throws a `RangeError` for a `bigint` that does not fit the field.
 *
 * @param cursor - The write cursor
 * @param box - The `TrackFragmentBaseMediaDecodeTimeBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @public
 */
export function writeTfdt(
	cursor: IsoBoxWriteCursor,
	box: TrackFragmentBaseMediaDecodeTimeBox<IsoInt64>,
): void {
	const start = beginIsoFullBox(cursor, 'tfdt', box.version, box.flags)

	writeWideUint(cursor, box.baseMediaDecodeTime, box.version === 1 ? 8 : 4)
	endIsoBox(cursor, start)
}
