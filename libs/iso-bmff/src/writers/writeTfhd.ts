import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { TrackFragmentHeaderBox } from '../boxes/TrackFragmentHeaderBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeWideUint } from '../cursor/writeWideUint.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `tfhd` box (`TrackFragmentHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.7
 *
 * Each 64-bit integer field of the box is a `number` or a `bigint`.
 * The writer throws a `RangeError` for a `bigint` that does not fit the field.
 *
 * @param cursor - The write cursor
 * @param box - The `TrackFragmentHeaderBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @public
 */
export function writeTfhd(cursor: IsoBoxWriteCursor, box: TrackFragmentHeaderBox<IsoInt64>): void {
	const { flags } = box
	const start = beginIsoFullBox(cursor, 'tfhd', box.version, flags)

	writeUint32(cursor, box.trackId)

	if (flags & 0x01) {
		writeWideUint(cursor, box.baseDataOffset as IsoInt64, 8)
	}

	if (flags & 0x02) {
		writeUint32(cursor, box.sampleDescriptionIndex as number)
	}

	if (flags & 0x08) {
		writeUint32(cursor, box.defaultSampleDuration as number)
	}

	if (flags & 0x10) {
		writeUint32(cursor, box.defaultSampleSize as number)
	}

	if (flags & 0x20) {
		writeUint32(cursor, box.defaultSampleFlags as number)
	}

	endIsoBox(cursor, start)
}
