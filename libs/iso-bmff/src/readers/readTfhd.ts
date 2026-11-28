import type { TrackFragmentHeaderBox } from '../boxes/TrackFragmentHeaderBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import { readWideUint } from '../cursor/readWideUint.ts'

/**
 * Read the `tfhd` box (`TrackFragmentHeaderBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `TrackFragmentHeaderBox`
 *
 * @public
 */
export function readTfhd<V extends IsoInt64>(
	cursor: IsoBoxReadCursor<V>,
): TrackFragmentHeaderBox<V> {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)

	return {
		type: 'tfhd',
		version,
		flags,
		trackId: readUint32(cursor),
		baseDataOffset: flags & 0x01 ? readWideUint(cursor, 8) : undefined,
		sampleDescriptionIndex: flags & 0x02 ? readUint32(cursor) : undefined,
		defaultSampleDuration: flags & 0x08 ? readUint32(cursor) : undefined,
		defaultSampleSize: flags & 0x10 ? readUint32(cursor) : undefined,
		defaultSampleFlags: flags & 0x20 ? readUint32(cursor) : undefined,
	}
}
