import type { ProducerReferenceTimeBox } from '../boxes/ProducerReferenceTimeBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import { readWideUint } from '../cursor/readWideUint.ts'

/**
 * Read the `prft` box (`ProducerReferenceTimeBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `ProducerReferenceTimeBox`
 *
 * @public
 */
export function readPrft<V extends IsoInt64>(
	cursor: IsoBoxReadCursor<V>,
): ProducerReferenceTimeBox<V> {
	const version = readUint8(cursor)

	return {
		type: 'prft',
		version,
		flags: readUint24(cursor),
		referenceTrackId: readUint32(cursor),
		ntpTimestampSec: readUint32(cursor),
		ntpTimestampFrac: readUint32(cursor),
		mediaTime: readWideUint(cursor, version === 0 ? 4 : 8),
	}
}
