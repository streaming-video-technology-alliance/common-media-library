import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { ProducerReferenceTimeBox } from '../boxes/ProducerReferenceTimeBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeWideUint } from '../cursor/writeWideUint.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `prft` box (`ProducerReferenceTimeBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.16.5
 *
 * Each 64-bit integer field of the box is a `number` or a `bigint`.
 * The writer throws a `RangeError` for a `bigint` that does not fit the field.
 *
 * @param cursor - The write cursor
 * @param box - The `ProducerReferenceTimeBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @public
 */
export function writePrft(
	cursor: IsoBoxWriteCursor,
	box: ProducerReferenceTimeBox<IsoInt64>,
): void {
	const start = beginIsoFullBox(cursor, 'prft', box.version, box.flags)

	writeUint32(cursor, box.referenceTrackId)
	writeUint32(cursor, box.ntpTimestampSec)
	writeUint32(cursor, box.ntpTimestampFrac)
	writeWideUint(cursor, box.mediaTime, box.version === 0 ? 4 : 8)
	endIsoBox(cursor, start)
}
