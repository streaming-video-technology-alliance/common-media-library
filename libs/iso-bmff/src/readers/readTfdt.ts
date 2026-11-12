import type { TrackFragmentBaseMediaDecodeTimeBox } from '../boxes/TrackFragmentBaseMediaDecodeTimeBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `TrackFragmentBaseMediaDecodeTimeBox` from an `IsoBoxReadView`.
 *
 * The 64-bit integer fields of the result have the type that the `int64` option of the view returns.
 * With no option, they are numbers.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `TrackFragmentBaseMediaDecodeTimeBox`
 *
 * @public
 */
export function readTfdt<V extends IsoInt64>(
	view: IsoBoxReadView<V>,
): TrackFragmentBaseMediaDecodeTimeBox<V> {
	const { version, flags } = view.readFullBox()

	return {
		type: 'tfdt',
		version,
		flags,
		baseMediaDecodeTime: view.readWideUint(version == 1 ? 8 : 4),
	}
}
