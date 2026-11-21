import type { TrackFragmentBaseMediaDecodeTimeBox } from '../boxes/TrackFragmentBaseMediaDecodeTimeBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readWideUint } from '../cursor/readWideUint.ts'

/**
 * Read the `tfdt` box (`TrackFragmentBaseMediaDecodeTimeBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `TrackFragmentBaseMediaDecodeTimeBox`
 *
 * @public
 */
export function readTfdt<V extends IsoInt64>(
	cursor: IsoBoxReadCursor<V>,
): TrackFragmentBaseMediaDecodeTimeBox<V> {
	const version = readUint8(cursor)

	return {
		type: 'tfdt',
		version,
		flags: readUint24(cursor),
		baseMediaDecodeTime: readWideUint(cursor, version == 1 ? 8 : 4),
	}
}
