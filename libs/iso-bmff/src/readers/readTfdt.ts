import type { TrackFragmentBaseMediaDecodeTimeBox } from '../boxes/TrackFragmentBaseMediaDecodeTimeBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

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
	const view = new IsoBoxReadView(cursor)

	const { version, flags } = view.readFullBox()

	return {
		type: 'tfdt',
		version,
		flags,
		baseMediaDecodeTime: view.readWideUint(version == 1 ? 8 : 4),
	}
}
