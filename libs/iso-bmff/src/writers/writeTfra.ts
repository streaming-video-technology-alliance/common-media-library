import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { TrackFragmentRandomAccessBox } from '../boxes/TrackFragmentRandomAccessBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint8 } from '../cursor/writeUint8.ts'
import { writeUint16 } from '../cursor/writeUint16.ts'
import { writeUint24 } from '../cursor/writeUint24.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeWideUint } from '../cursor/writeWideUint.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `tfra` box (`TrackFragmentRandomAccessBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.10
 *
 * Each 64-bit integer field of the box is a `number` or a `bigint`.
 * The writer throws a `RangeError` for a `bigint` that does not fit the field.
 *
 * @param cursor - The write cursor
 * @param box - The `TrackFragmentRandomAccessBox` fields to write
 *
 * @public
 */
export function writeTfra(
	cursor: IsoBoxWriteCursor,
	box: TrackFragmentRandomAccessBox<IsoInt64>,
): void {
	const traf = box.lengthSizeOfTrafNum & 0x3
	const trun = box.lengthSizeOfTrunNum & 0x3
	const sample = box.lengthSizeOfSampleNum & 0x3
	const size = box.version === 1 ? 8 : 4
	const start = beginIsoFullBox(cursor, 'tfra', box.version, box.flags)

	const writeNumber = (value: number, lengthSize: number): void =>
		lengthSize === 0
			? writeUint8(cursor, value)
			: lengthSize === 1
				? writeUint16(cursor, value)
				: lengthSize === 2
					? writeUint24(cursor, value)
					: writeUint32(cursor, value)

	writeUint32(cursor, box.trackId)
	writeUint32(cursor, (traf << 4) | (trun << 2) | sample)
	writeUint32(cursor, box.entries.length)

	for (const entry of box.entries) {
		writeWideUint(cursor, entry.time, size)
		writeWideUint(cursor, entry.moofOffset, size)
		writeNumber(entry.trafNumber, traf)
		writeNumber(entry.trunNumber, trun)
		writeNumber(entry.sampleNumber, sample)
	}

	endIsoBox(cursor, start)
}
